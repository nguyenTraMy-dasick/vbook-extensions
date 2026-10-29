var BASE_URL = "https://www.fanfiction.net";
try {
    if (DOMAIN) {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (error) {
}

function normalizeUrl(url) {
    url = String(url || "").trim();
    if (!url) return BASE_URL;
    if (url.indexOf("//") === 0) url = "https:" + url;
    if (!/^https?:\/\//i.test(url)) {
        return BASE_URL + (url.charAt(0) === "/" ? "" : "/") + url;
    }
    return url.replace(/^https?:\/\/(?:www\.|m\.)?fanfiction\.net/i, BASE_URL);
}

function getStoryId(url) {
    var m = /\/s\/(\d+)/.exec(String(url || ""));
    return m ? m[1] : "";
}

function firstEl(root, selector) {
    var els = root.select(selector);
    return els.size() > 0 ? els.get(0) : null;
}

function cleanText(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
}

var M_BASE_URL = "https://m.fanfiction.net";

// Every real desktop page (story, list, search, error) is rendered inside
// #content_wrapper_inner; every mobile page has the div.t_head bar. Cloudflare challenge
// pages have neither, and their text is localized to the phone's language.
function isRealPage(doc) {
    return !!doc && doc.select("#content_wrapper_inner").size() > 0;
}

function isRealMobilePage(doc) {
    return !!doc && doc.select("div.t_head").size() > 0;
}

var LAST_ERROR = "";
var DIAG = [];
var MODE_KEY = "ffn_story_mode";
var LAST_PAGE_KEY = "ffn_last_page";
var CF_MESSAGE = "FanFiction.net đang chặn bằng Cloudflare. Thử mở fanfiction.net bằng trình duyệt trong vBook rồi quay lại thử lại.";

function nowMs() {
    return new Date().getTime();
}

function hostOf(url) {
    var m = /^https?:\/\/([^\/]+)/.exec(url);
    return m ? m[1] : url;
}

function describe(doc) {
    if (!doc) return "không có nội dung";
    var title = cleanText(doc.select("title").text());
    return title ? "\"" + title.substring(0, 50) + "\"" : "trang không có tiêu đề";
}

function tryFetch(url, isReal) {
    var res = fetch(url);
    if (res.ok) {
        var doc = res.html();
        if (isReal(doc)) return doc;
        DIAG.push("fetch " + hostOf(url) + " → " + res.status + " " + describe(doc));
        return null;
    }
    var cf = res.header("cf-mitigated");
    DIAG.push("fetch " + hostOf(url) + " → HTTP " + res.status + (cf ? " (cf-mitigated: " + cf + ")" : ""));
    return null;
}

// The app's headless browser can run Cloudflare's JavaScript check.
function tryBrowser(url, isReal) {
    var page = null;
    var browser = Engine.newBrowser();
    try {
        page = browser.launch(url, 15000);
        for (var i = 0; i < 6 && !isReal(page); i++) {
            page = browser.html(2500);
        }
    } catch (e) {
        DIAG.push("browser " + hostOf(url) + " lỗi: " + e);
    } finally {
        try {
            browser.close();
        } catch (e2) {
        }
    }
    if (isReal(page)) return page;
    DIAG.push("browser " + hostOf(url) + " → " + describe(page));
    return null;
}

function failWith(message) {
    LAST_ERROR = message + (DIAG.length ? "\n\nChi tiết: " + DIAG.join(" | ") : "");
    return null;
}

// Listing/search pages: desktop fetch, then headless browser.
function loadDoc(url) {
    LAST_ERROR = "";
    DIAG = [];
    var doc = tryFetch(url, isRealPage) || tryBrowser(url, isRealPage);
    return doc || failWith(CF_MESSAGE);
}

// Story pages (/s/ID/N/) are the most protected. Try, in order: desktop fetch, mobile
// fetch, desktop headless browser, mobile headless browser — starting with whichever
// worked last time (remembered for 30 minutes). Returns { doc, mobile } or null.
var STORY_METHODS = ["fetch", "mfetch", "browser", "mbrowser"];

function runStoryMethod(method, path) {
    if (method === "fetch") return tryFetch(BASE_URL + path, isRealPage);
    if (method === "mfetch") return tryFetch(M_BASE_URL + path, isRealMobilePage);
    if (method === "browser") return tryBrowser(BASE_URL + path, isRealPage);
    return tryBrowser(M_BASE_URL + path, isRealMobilePage);
}

function loadStoryPage(id, chapter) {
    LAST_ERROR = "";
    DIAG = [];
    var path = "/s/" + id + "/" + (chapter || 1) + "/";

    // detail, toc and chap 1 load the same page in a row: reuse it for 2 minutes.
    try {
        var raw = cacheStorage.getItem(LAST_PAGE_KEY);
        if (raw) {
            var c = JSON.parse(raw);
            if (c.p === path && nowMs() - c.t < 120000) {
                return { doc: Html.parse(c.h), mobile: c.m };
            }
        }
    } catch (e) {
    }

    var order = STORY_METHODS.slice();
    try {
        var saved = JSON.parse(cacheStorage.getItem(MODE_KEY) || "null");
        if (saved && saved.until > nowMs() && order.indexOf(saved.m) > 0) {
            order.splice(order.indexOf(saved.m), 1);
            order.unshift(saved.m);
        }
    } catch (e) {
    }

    for (var i = 0; i < order.length; i++) {
        var doc = runStoryMethod(order[i], path);
        if (!doc) continue;
        var mobile = order[i].charAt(0) === "m";
        try {
            cacheStorage.setItem(MODE_KEY, JSON.stringify({ m: order[i], until: nowMs() + 30 * 60 * 1000 }));
            cacheStorage.setItem(LAST_PAGE_KEY, JSON.stringify({ p: path, t: nowMs(), m: mobile, h: doc.html() }));
        } catch (e) {
        }
        return { doc: doc, mobile: mobile };
    }
    return failWith(CF_MESSAGE);
}

function siteError(doc, fallback) {
    if (doc) {
        var warn = cleanText(doc.select(".gui_warning").text());
        if (warn) return Response.error(warn);
    }
    return Response.error(LAST_ERROR || fallback || CF_MESSAGE);
}

// ---- mobile story page (m.fanfiction.net) helpers ----

// Header block of #content: "<b>Title</b> by <a>Author</a> <hr> crumbs + stats <hr> ... Chapter 1: Name".
function mobileParts(doc) {
    var content = firstEl(doc, "#content");
    if (!content) return null;
    var segs = content.html().split(/<hr[^>]*>/i);
    return { content: content, segs: segs };
}

function mobileChapterCount(doc) {
    var m = /Ch\s+\d+\s+of\s+(\d+)/.exec(cleanText(doc.select("body").text()));
    return m ? parseInt(m[1], 10) : 1;
}

function mobileChapterTitle(doc) {
    var parts = mobileParts(doc);
    if (!parts || parts.segs.length < 3) return "";
    var tail = parts.segs[parts.segs.length - 1];
    var i = tail.lastIndexOf("</span>");
    if (i >= 0) tail = tail.substring(i + 7);
    return cleanText(Html.parse(tail).select("body").text());
}

function coverUrl(img) {
    if (!img) return "";
    var src = img.attr("data-original") || img.attr("src");
    if (!src || src.indexOf("/static/images/") >= 0) return "";
    if (src.indexOf("//") === 0) src = "https:" + src;
    return src.replace(/\/image\/(\d+)\/75\/?$/, "/image/$1/180/");
}

// One story card (div.z-list) on search / fandom / Just In / author pages.
function parseStoryItem(el) {
    var a = firstEl(el, "a.stitle");
    if (!a) return null;
    var name = cleanText(a.text());
    var link = a.attr("href");
    if (!name || !link) return null;

    var authorEl = firstEl(el, "a[href^='/u/']");
    var author = authorEl ? cleanText(authorEl.text()) : "";
    var stats = cleanText(el.select(".xgray").text());

    var parts = stats.split(" - ");
    var info = [];
    var complete = false;
    for (var i = 0; i < parts.length; i++) {
        var p = cleanText(parts[i]);
        if (i === 0 && p.indexOf("Rated:") !== 0) info.push(p); // fandom on search pages
        else if (p.indexOf("Rated:") === 0) info.push(p.replace("Rated:", "").replace("Fiction", "").trim());
        else if (p.indexOf("Chapters:") === 0) info.push(p.replace("Chapters:", "").trim() + " ch");
        else if (p.indexOf("Words:") === 0) info.push(p.replace("Words:", "").trim() + " words");
        else if (p === "Complete") complete = true;
    }
    if (author) info.unshift(author);

    return {
        name: name,
        link: link,
        cover: coverUrl(firstEl(el, "img.cimage")),
        description: info.join(" • "),
        tag: complete ? "Complete" : "",
        host: BASE_URL
    };
}

function parseStoryList(doc, selector) {
    var items = [];
    doc.select(selector || "div.z-list").forEach(function (el) {
        var item = parseStoryItem(el);
        if (item) items.push(item);
    });
    return items;
}

function hasNextPage(doc) {
    var found = false;
    doc.select("center a").forEach(function (a) {
        if (a.text().indexOf("Next") >= 0) found = true;
    });
    return found;
}
