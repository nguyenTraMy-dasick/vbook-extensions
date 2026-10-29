var BASE_URL = "https://www.asianfanfics.com";
try {
    if (DOMAIN) {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (error) {
}

// Story language filter (?language=xx). The site's UI language stays English (/htmx/browse/en/...).
var LANGUAGE_CODES = {
    "Tất cả": "",
    "English": "en",
    "中文": "zh",
    "日本語": "ja",
    "한국어": "ko",
    "Français": "fr",
    "Español": "es",
    "Português": "pt",
    "Bahasa Indonesia": "id",
    "Tiếng Việt": "vi",
    "ไทย": "th",
    "Filipino": "tl",
    "Bahasa Melayu": "ms"
};
var STORY_LANGUAGE = "en";
try {
    if (typeof LANGUAGE !== "undefined" && LANGUAGE_CODES.hasOwnProperty(String(LANGUAGE))) {
        STORY_LANGUAGE = LANGUAGE_CODES[String(LANGUAGE)];
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
    return url.replace(/^https?:\/\/(?:www\.)?asianfanfics\.com/i, BASE_URL);
}

function addParam(url, key, value) {
    if (value === "" || value === null || value === undefined) return url;
    return url + (url.indexOf("?") >= 0 ? "&" : "?") + key + "=" + encodeURIComponent(value);
}

function getStoryId(url) {
    var m = /\/story\/view\/(\d+)/.exec(String(url || ""));
    return m ? m[1] : "";
}

function firstEl(root, selector) {
    var els = root.select(selector);
    return els.size() > 0 ? els.get(0) : null;
}

function cleanText(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
}

var LAST_ERROR = "";

function getDoc(url) {
    LAST_ERROR = "";
    var res = fetch(url);
    if (!res.ok) {
        LAST_ERROR = res.status === 404 ? "Không tìm thấy trang trên Asianfanfics (404)." : "Không tải được Asianfanfics: HTTP " + res.status;
        return null;
    }
    return res.html();
}

// Chapters sit behind an "Are you over 18?" gate. Its "I am over 18" link
// (/htmx/story/verify_age) sets a cookie; afterwards the page loads normally.
function isAgeGate(doc) {
    return doc.select("a[href*='/htmx/story/verify_age']").size() > 0;
}

function getDocPastAgeGate(url) {
    var doc = getDoc(url);
    if (doc && isAgeGate(doc)) {
        fetch(BASE_URL + "/htmx/story/verify_age");
        doc = getDoc(url);
        if (doc && isAgeGate(doc)) {
            LAST_ERROR = "Không vượt qua được bước xác nhận 18+ của Asianfanfics.";
            return null;
        }
    }
    return doc;
}

function loadError(fallback) {
    return Response.error(LAST_ERROR || fallback || "Không tải được Asianfanfics.");
}

// Access labels shown as badges on story cards / story headers.
function lockLabel(badges) {
    for (var i = 0; i < badges.length; i++) {
        var b = badges[i].toLowerCase();
        if (b.indexOf("subscribers only") >= 0) return "Subscribers Only";
        if (b.indexOf("members only") >= 0) return "Members Only";
        if (b.indexOf("friends only") >= 0) return "Friends Only";
    }
    return "";
}

function badgeTexts(root) {
    var out = [];
    root.select("span[class*=uppercase]").forEach(function (s) {
        var t = cleanText(s.text());
        if (t) out.push(t);
    });
    return out;
}

function hasBadge(badges, word) {
    for (var i = 0; i < badges.length; i++) {
        if (badges[i].toLowerCase().indexOf(word) >= 0) return true;
    }
    return false;
}

// One <article> story card from the /htmx/browse/... listings.
function parseStoryCard(el) {
    var a = firstEl(el, "h3 a[href*='/story/view/']");
    if (!a) return null;
    var name = cleanText(a.text()).replace(/\s*★\s*$/, "");
    if (!name) return null;

    var badges = badgeTexts(el);
    var lock = lockLabel(badges);
    var authorEl = firstEl(el, "a[href^='/profile/u/']");
    var img = firstEl(el, "img");

    var stats = "";
    el.select("p").forEach(function (p) {
        var t = cleanText(p.text());
        if (!stats && / chapters? · /.test(t)) stats = t;
    });
    var info = [];
    if (lock) info.push("🔒 " + lock);
    if (authorEl) info.push(cleanText(authorEl.text()));
    var m = /([\d,]+) chapters?/.exec(stats);
    if (m) info.push(m[1] + " ch");
    var w = /([\d,]+) words/.exec(stats);
    if (w) info.push(w[1] + " words");

    return {
        name: name,
        link: a.attr("href"),
        cover: img ? img.attr("src") : "",
        description: info.join(" • "),
        tag: lock || (hasBadge(badges, "completed") ? "Completed" : ""),
        host: BASE_URL
    };
}

function parseStoryCards(doc) {
    var items = [];
    doc.select("article").forEach(function (el) {
        var item = parseStoryCard(el);
        if (item) items.push(item);
    });
    return items;
}

function hasNextPage(doc) {
    var found = false;
    doc.select("a[hx-get]").forEach(function (a) {
        if (a.text().indexOf("Next") >= 0) found = true;
    });
    return found;
}
