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

// Cloudflare challenge / "verify you are human" pages.
function isBlocked(doc) {
    var title = cleanText(doc.select("title").text()).toLowerCase();
    if (title.indexOf("just a moment") >= 0 || title.indexOf("attention required") >= 0) return true;
    return doc.select("#challenge-form, #challenge-running, #cf-wrapper, .cf-turnstile, #turnstile-wrapper").size() > 0;
}

// Plain fetch first; when Cloudflare blocks it, retry in the app's headless browser,
// which can pass the JS challenge.
function loadDoc(url, readySelector) {
    var res = fetch(url);
    if (res.ok) {
        var doc = res.html();
        if (!isBlocked(doc)) return doc;
    } else if (res.status !== 403 && res.status !== 503 && res.status !== 429) {
        return null;
    }

    var browser = Engine.newBrowser();
    var page = null;
    try {
        page = browser.launch(url, 30000);
        for (var i = 0; i < 8; i++) {
            if (page && !isBlocked(page) && (!readySelector || page.select(readySelector).size() > 0)) break;
            page = browser.html(2500);
        }
    } finally {
        browser.close();
    }
    if (!page || isBlocked(page)) return null;
    return page;
}

function siteError(doc, fallback) {
    if (doc) {
        var warn = cleanText(doc.select(".gui_warning, .gui_normal, #content_wrapper_inner .panel").text());
        if (warn) return Response.error(warn);
    }
    return Response.error(fallback || "Không tải được trang FanFiction.net (có thể bị Cloudflare chặn, hãy mở trang bằng trình duyệt trong app rồi thử lại).");
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
