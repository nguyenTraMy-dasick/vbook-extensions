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

// Every real FanFiction.net page (story, list, search, error) is server-rendered inside
// #content_wrapper_inner. Cloudflare challenge pages are not, and their text is
// localized to the phone's language, so checking titles like "Just a moment" is unreliable.
function isRealPage(doc) {
    return !!doc && doc.select("#content_wrapper_inner").size() > 0;
}

var LAST_ERROR = "";
var BROWSER_MODE_KEY = "ffn_browser_until";
var LAST_PAGE_KEY = "ffn_last_page";
var CF_MESSAGE = "FanFiction.net đang bật xác minh Cloudflare. Hãy mở fanfiction.net bằng trình duyệt trong vBook (biểu tượng quả địa cầu ở trang extension/truyện), chờ qua bước \"Verify you are human\", rồi quay lại thử lại.";

function nowMs() {
    return new Date().getTime();
}

function browserModeActive() {
    try {
        return Number(cacheStorage.getItem(BROWSER_MODE_KEY) || 0) > nowMs();
    } catch (e) {
        return false;
    }
}

function setBrowserMode(on) {
    try {
        if (on) cacheStorage.setItem(BROWSER_MODE_KEY, String(nowMs() + 15 * 60 * 1000));
        else cacheStorage.removeItem(BROWSER_MODE_KEY);
    } catch (e) {
    }
}

// detail, toc and chap 1 all load the same /s/ID/1/ page in a row; keep the last one
// for a short time so opening a story costs one request instead of three.
function cachedPage(url) {
    try {
        var raw = cacheStorage.getItem(LAST_PAGE_KEY);
        if (!raw) return null;
        var o = JSON.parse(raw);
        if (o.u !== url || nowMs() - o.t > 120000) return null;
        var doc = Html.parse(o.h);
        return isRealPage(doc) ? doc : null;
    } catch (e) {
        return null;
    }
}

function rememberPage(url, doc) {
    if (!/\/s\/\d+\/\d+\/$/.test(url)) return;
    try {
        cacheStorage.setItem(LAST_PAGE_KEY, JSON.stringify({ u: url, t: nowMs(), h: doc.html() }));
    } catch (e) {
    }
}

// Load a page in the app's headless browser, which can run Cloudflare's JS check.
function browserLoad(url) {
    var browser = Engine.newBrowser();
    var page = null;
    try {
        page = browser.launch(url, 30000);
        for (var i = 0; i < 12 && !isRealPage(page); i++) {
            page = browser.html(2500);
        }
    } finally {
        browser.close();
    }
    return isRealPage(page) ? page : null;
}

// Plain fetch first. When Cloudflare answers instead of FanFiction.net, use the headless
// browser, and keep using it for 15 minutes so later requests skip the doomed fetch.
function loadDoc(url) {
    LAST_ERROR = "";
    var cached = cachedPage(url);
    if (cached) return cached;

    var viaBrowser = browserModeActive();
    if (!viaBrowser) {
        var res = fetch(url);
        if (res.ok) {
            var doc = res.html();
            if (isRealPage(doc)) {
                rememberPage(url, doc);
                return doc;
            }
        } else if (res.status === 404) {
            LAST_ERROR = "Không tìm thấy trang trên FanFiction.net (404).";
            return null;
        } else if (res.status === 504 && !res.url) {
            LAST_ERROR = "Không kết nối được FanFiction.net, kiểm tra mạng rồi thử lại.";
            return null;
        }
    }

    var page = browserLoad(url);
    if (page) {
        if (!viaBrowser) setBrowserMode(true);
        rememberPage(url, page);
        return page;
    }
    if (viaBrowser) setBrowserMode(false);
    LAST_ERROR = CF_MESSAGE;
    return null;
}

function siteError(doc, fallback) {
    if (doc) {
        var warn = cleanText(doc.select(".gui_warning, .gui_normal").text());
        if (warn) return Response.error(warn);
    }
    return Response.error(LAST_ERROR || fallback || CF_MESSAGE);
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
