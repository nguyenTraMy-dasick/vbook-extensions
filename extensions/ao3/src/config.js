var BASE_URL = "https://archiveofourown.org";
try {
    if (DOMAIN) {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (error) {
}

var SHOW_AUTHOR_NOTES = true;
try {
    SHOW_AUTHOR_NOTES = String(SHOW_NOTES) !== "false";
} catch (error) {
}

function normalizeUrl(url) {
    url = String(url || "").trim();
    if (!url) return BASE_URL;
    if (url.indexOf("//") === 0) url = "https:" + url;
    if (!/^https?:\/\//i.test(url)) {
        return BASE_URL + (url.charAt(0) === "/" ? "" : "/") + url;
    }
    return url.replace(/^https?:\/\/(?:www\.)?(?:archiveofourown\.(?:org|com|net|gay)|ao3\.org)/i, BASE_URL);
}

function addParam(url, param) {
    if (url.indexOf(param.split("=")[0] + "=") >= 0) return url;
    var hash = "";
    var i = url.indexOf("#");
    if (i >= 0) {
        hash = url.substring(i);
        url = url.substring(0, i);
    }
    return url + (url.indexOf("?") >= 0 ? "&" : "?") + param + hash;
}

function adultUrl(url) {
    return addParam(normalizeUrl(url), "view_adult=true");
}

function getWorkId(url) {
    var m = /\/works\/(\d+)/.exec(String(url || ""));
    return m ? m[1] : "";
}

function firstEl(root, selector) {
    var els = root.select(selector);
    return els.size() > 0 ? els.get(0) : null;
}

function cleanText(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
}

function joinTags(root, selector) {
    var out = [];
    root.select(selector).forEach(function (a) {
        var t = cleanText(a.text());
        if (t) out.push(t);
    });
    return out;
}

// AO3 encodes some characters in tag URLs: "/" -> *s*, "&" -> *a*, "." -> *d*, "?" -> *q*, "#" -> *h*.
function tagWorksPath(tag) {
    var t = String(tag)
        .replace(/\//g, "*s*")
        .replace(/&/g, "*a*")
        .replace(/\./g, "*d*")
        .replace(/\?/g, "*q*")
        .replace(/#/g, "*h*");
    return "/tags/" + encodeURIComponent(t) + "/works";
}

// Every real AO3 page has div#main. Cloudflare challenge pages don't (and their title
// is localized to the phone's language, so title checks are unreliable).
function isBlocked(doc) {
    return !doc || doc.select("#main").size() === 0;
}

function isMaintenance(doc) {
    var title = cleanText(doc.select("title").text()).toLowerCase();
    var body = cleanText(doc.select("body").text()).toLowerCase();
    return title.indexOf("request temporarily denied") >= 0 || body.indexOf("down for maintenance") >= 0;
}

var LAST_ERROR = "";

// Plain fetch first; on a Cloudflare challenge retry once in the app's headless browser.
function loadDoc(url, readySelector) {
    LAST_ERROR = "";
    var res = fetch(url);
    if (res.status === 429) {
        LAST_ERROR = "AO3 đang giới hạn số lượt truy cập (HTTP 429). Đợi vài phút rồi thử lại.";
        return null;
    }
    // During maintenance AO3 answers 418/503 with a "Request temporarily denied" page.
    var doc = res.status === 504 ? null : res.html();
    if (doc && isMaintenance(doc)) {
        LAST_ERROR = "AO3 đang bảo trì, hãy thử lại sau.";
        return null;
    }
    if (res.ok && doc && !isBlocked(doc)) return doc;
    if (!res.ok && res.status !== 403 && res.status !== 503) {
        LAST_ERROR = res.status === 404 ? "Không tìm thấy trang trên AO3 (404)." : "Không tải được AO3: HTTP " + res.status;
        return null;
    }

    var browser = Engine.newBrowser();
    var page = null;
    try {
        page = browser.launch(url, 30000);
        for (var i = 0; i < 12; i++) {
            if (!isBlocked(page) || (page && isMaintenance(page))) break;
            page = browser.html(2500);
        }
    } finally {
        browser.close();
    }
    if (!page || isBlocked(page)) {
        LAST_ERROR = "AO3 chặn truy cập (Cloudflare). Hãy mở AO3 bằng trình duyệt trong app rồi thử lại.";
        return null;
    }
    if (isMaintenance(page)) {
        LAST_ERROR = "AO3 đang bảo trì, hãy thử lại sau.";
        return null;
    }
    return page;
}

function loadError(fallback) {
    return Response.error(LAST_ERROR || fallback || "Không tải được AO3.");
}

// Explains why a work page has no #workskin (login-only work, deleted, adult gate...).
function workError(doc) {
    var flash = cleanText(doc.select("div.flash.notice, div.flash.error, div.flash.caution, p.caution").text());
    if (doc.select("#new_user_session_small, #new_user_session, form#loginform").size() > 0 || flash.toLowerCase().indexOf("registered users") >= 0) {
        return Response.error("Fic này chỉ dành cho thành viên AO3. Hãy đăng nhập AO3 bằng trình duyệt trong app vBook rồi thử lại.");
    }
    return Response.error(flash || "Không tìm thấy fic trên AO3 (có thể đã bị xoá hoặc ẩn).");
}

// A work blurb (li.work.blurb) on search, tag, user and home listings.
function parseWorkBlurb(el) {
    var a = firstEl(el, "h4.heading a[href^='/works/']");
    if (!a) return null;
    var name = cleanText(a.text());
    if (!name) return null;

    var authors = joinTags(el, "h4.heading a[rel='author']");
    var byline = authors.length ? authors.join(", ") : "Anonymous";
    var fandoms = joinTags(el, "h5.fandoms a.tag");
    var ratingEl = firstEl(el, "ul.required-tags span.rating");
    var rating = ratingEl ? cleanText(ratingEl.attr("title")) : "";
    var words = cleanText(el.select("dl.stats dd.words").text());
    var chapters = cleanText(el.select("dl.stats dd.chapters").text());
    var wipEl = firstEl(el, "ul.required-tags span.iswip");
    var complete = wipEl ? wipEl.attr("class").indexOf("complete-yes") >= 0 : /^(\d+)\/\1$/.test(chapters);

    var info = [byline];
    if (fandoms.length) info.push(fandoms.slice(0, 2).join(", ") + (fandoms.length > 2 ? "…" : ""));
    if (rating) info.push(rating);
    if (chapters) info.push(chapters + " ch");
    if (words) info.push(words + " words");

    return {
        name: name,
        link: "/works/" + getWorkId(a.attr("href")),
        cover: "",
        description: info.join(" • "),
        tag: complete ? "Complete" : "",
        host: BASE_URL
    };
}

function parseWorkList(doc) {
    var items = [];
    doc.select("li.work.blurb, li.bookmark.blurb").forEach(function (el) {
        var item = parseWorkBlurb(el);
        if (item) items.push(item);
    });
    return items;
}

function hasNextPage(doc) {
    return doc.select("ol.pagination li.next a, ol.pagination a[rel='next']").size() > 0;
}
