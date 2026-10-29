load('config.js');

function execute(url) {
    var id = getStoryId(normalizeUrl(url));
    if (!id) return Response.error("Link Asianfanfics không hợp lệ: " + url);

    var storyUrl = BASE_URL + "/story/view/" + id;
    var doc = getDocPastAgeGate(storyUrl);
    if (!doc) return loadError();

    var header = firstEl(doc, "main header");
    var titleEl = header ? firstEl(header, "h1") : null;
    if (!titleEl) return Response.error("Không tìm thấy truyện (có thể đã bị xoá hoặc chuyển sang riêng tư).");

    var badges = badgeTexts(header);
    var lock = lockLabel(badges);
    var authors = [];
    var authorLinks = header.select("a[href^='/profile/u/']");
    authorLinks.forEach(function (a) {
        authors.push(cleanText(a.text()));
    });

    var lines = [];
    if (lock) lines.push("🔒 " + lock + " — cần đăng nhập Asianfanfics (và đăng ký theo dõi truyện) để đọc.");
    var stats = [];
    header.select("p span").forEach(function (s) {
        var t = cleanText(s.text());
        if (t && /\d/.test(t)) stats.push(t);
    });
    if (stats.length) lines.push(stats.join(" · "));
    var lang = firstEl(header, "a[href*='language=']");
    if (lang) lines.push(cleanText(lang.text()));
    doc.select("main details p").forEach(function (p) {
        var t = cleanText(p.text());
        if (t.indexOf("Characters:") === 0) lines.push(t);
    });
    var dates = cleanText(header.select("p:has(time)").text());
    if (dates) lines.push(dates);

    var tags = [];
    header.select("a[href^='/browse/tag/']").forEach(function (a) {
        var m = /^\/browse\/tag\/([^?\/]+)/.exec(a.attr("href"));
        if (m) tags.push({ title: cleanText(a.text()), input: "/htmx/browse/en/tag/" + m[1], script: "list.js" });
    });
    if (tags.length) lines.push("Tags: " + tags.map(function (t) { return t.title; }).join(", "));

    // The description ("Foreword") is loaded separately by htmx.
    var description = "";
    var foreword = firstEl(doc, "[hx-get^='/htmx/story/" + id + "/']");
    if (foreword) {
        var fdoc = getDoc(normalizeUrl(foreword.attr("hx-get")));
        var descEl = fdoc ? firstEl(fdoc, "#story-description") : null;
        if (descEl) description = descEl.html();
    }

    // Covers are on two hosts: photo.asianfanfics.com/story_cover/<id>_<hash>.jpg (older)
    // and story-images.asianfanfics.com/story-cover-<id>-<hash>.webp (newer).
    var cover = "";
    var html = doc.html();
    var covers = [
        new RegExp("https?://photo\\.asianfanfics\\.com/story_cover/" + id + "_[A-Za-z0-9]+\\.\\w+"),
        new RegExp("https?://story-images\\.asianfanfics\\.com/story-cover-" + id + "-[A-Za-z0-9]+\\.\\w+"),
        new RegExp("https?://story-images\\.asianfanfics\\.com/story-cover-thumb-" + id + "-[A-Za-z0-9]+\\.\\w+")
    ];
    for (var ci = 0; ci < covers.length && !cover; ci++) {
        var cm = covers[ci].exec(html);
        if (cm) cover = cm[0];
    }

    var suggests = [];
    authorLinks.forEach(function (a) {
        suggests.push({ title: "Truyện khác của " + cleanText(a.text()), input: a.attr("href"), script: "author.js" });
    });

    return Response.success({
        name: cleanText(titleEl.text()).replace(/\s*★\s*$/, ""),
        author: authors.join(", ") || "Unknown",
        cover: cover,
        host: BASE_URL,
        description: description,
        detail: lines.join("<br>"),
        url: storyUrl,
        type: "novel",
        format: "novel",
        ongoing: !hasBadge(badges, "completed"),
        tags: tags,
        suggests: suggests
    });
}
