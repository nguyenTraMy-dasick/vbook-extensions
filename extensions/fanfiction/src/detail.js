load('config.js');

function desktopDetail(doc, storyUrl) {
    var top = firstEl(doc, "#profile_top");
    if (!top) return siteError(doc, "Không tìm thấy truyện (có thể đã bị xoá).");

    var titleEl = firstEl(top, "b.xcontrast_txt");
    var authorEl = firstEl(top, "a[href^='/u/']");
    var author = authorEl ? cleanText(authorEl.text()) : "";
    var summaryEl = firstEl(top, "div.xcontrast_txt");
    var stats = cleanText(top.select("span.xgray").text());

    var cover = coverUrl(firstEl(doc, "#img_large img"));
    if (!cover) cover = coverUrl(firstEl(top, "img.cimage"));

    // Breadcrumb: "Books > Harry Potter" or "X + Y Crossover".
    var crumbs = doc.select("#pre_story_links a");
    var fandomEl = crumbs.size() > 0 ? crumbs.get(crumbs.size() - 1) : null;

    var lines = [];
    if (fandomEl) lines.push("Fandom: " + cleanText(fandomEl.text()));
    var parts = stats.split(" - ");
    for (var i = 0; i < parts.length; i++) {
        var p = cleanText(parts[i]);
        if (!p || p.indexOf("id:") === 0) continue;
        lines.push(p.replace("Rated: Fiction", "Rated:"));
    }

    var rated = /Rated:\s*Fiction\s+(\S+)/.exec(stats);
    return buildDetail({
        name: titleEl ? cleanText(titleEl.text()) : "",
        authorEl: authorEl,
        author: author,
        cover: cover,
        description: summaryEl ? summaryEl.html() : "",
        lines: lines,
        complete: stats.indexOf("Status: Complete") >= 0,
        rating: rated ? rated[1] : "",
        fandomEl: fandomEl,
        url: storyUrl
    });
}

// m.fanfiction.net has no summary or cover on story pages, only title/author/stats.
function mobileDetail(doc, storyUrl) {
    var parts = mobileParts(doc);
    if (!parts || doc.select("#storycontent").size() === 0) return siteError(doc, "Không tìm thấy truyện (có thể đã bị xoá).");

    var titleEl = firstEl(parts.content, "div[align=center] b");
    var authorEl = firstEl(parts.content, "a[href^='/u/']");
    var fandomEl = null;
    var stats = "";
    if (parts.segs.length > 1) {
        var seg = Html.parse(parts.segs[1]);
        var links = seg.select("a[href^='/']");
        if (links.size() > 0) fandomEl = links.get(links.size() - 1);
        stats = cleanText(seg.select("body").text());
        var r = stats.indexOf("Rated:");
        if (r > 0) stats = stats.substring(r);
    }

    var lines = [];
    if (fandomEl) lines.push("Fandom: " + cleanText(fandomEl.text()));
    if (stats) lines.push(stats);
    lines.push("Chapters: " + mobileChapterCount(doc));

    var rated = /Rated:\s*([^,\s]+)/.exec(stats);
    return buildDetail({
        name: titleEl ? cleanText(titleEl.text()) : "",
        authorEl: authorEl,
        author: authorEl ? cleanText(authorEl.text()) : "",
        cover: "",
        description: stats,
        lines: lines,
        complete: /\bComplete\b/.test(stats),
        rating: rated ? rated[1] : "",
        fandomEl: fandomEl,
        url: storyUrl
    });
}

function buildDetail(d) {
    var genres = [];
    if (d.fandomEl) {
        genres.push({ title: cleanText(d.fandomEl.text()), input: d.fandomEl.attr("href"), script: "list.js" });
    }
    var suggests = [];
    if (d.authorEl) {
        suggests.push({ title: "Truyện khác của " + d.author, input: d.authorEl.attr("href"), script: "list.js" });
    }
    return Response.success({
        name: d.name,
        author: d.author,
        cover: d.cover,
        host: BASE_URL,
        description: d.description,
        detail: d.lines.join("<br>"),
        url: d.url,
        type: "novel",
        format: "novel",
        ongoing: !d.complete,
        nsfw: d.rating === "M",
        locale: "en",
        genres: genres,
        suggests: suggests
    });
}

function execute(url) {
    var id = getStoryId(normalizeUrl(url));
    if (!id) return Response.error("Link FanFiction.net không hợp lệ: " + url);

    var page = loadStoryPage(id, 1);
    if (!page) return siteError(null);

    var storyUrl = BASE_URL + "/s/" + id + "/1/";
    return page.mobile ? mobileDetail(page.doc, storyUrl) : desktopDetail(page.doc, storyUrl);
}
