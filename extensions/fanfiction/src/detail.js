load('config.js');

function execute(url) {
    var id = getStoryId(normalizeUrl(url));
    if (!id) return Response.error("Link FanFiction.net không hợp lệ: " + url);

    var storyUrl = BASE_URL + "/s/" + id + "/1/";
    var doc = loadDoc(storyUrl);
    if (!doc) return siteError(null);

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
    var fandom = fandomEl ? cleanText(fandomEl.text()) : "";

    var lines = [];
    if (fandom) lines.push("Fandom: " + fandom);
    var parts = stats.split(" - ");
    for (var i = 0; i < parts.length; i++) {
        var p = cleanText(parts[i]);
        if (!p || p.indexOf("id:") === 0) continue;
        lines.push(p.replace("Rated: Fiction", "Rated:"));
    }

    var rated = /Rated:\s*Fiction\s+(\S+)/.exec(stats);
    var genres = [];
    if (fandomEl) {
        genres.push({ title: fandom, input: fandomEl.attr("href"), script: "list.js" });
    }
    var suggests = [];
    if (authorEl) {
        suggests.push({ title: "Truyện khác của " + author, input: authorEl.attr("href"), script: "list.js" });
    }

    return Response.success({
        name: titleEl ? cleanText(titleEl.text()) : "",
        author: author,
        cover: cover,
        host: BASE_URL,
        description: summaryEl ? summaryEl.html() : "",
        detail: lines.join("<br>"),
        url: storyUrl,
        type: "novel",
        format: "novel",
        ongoing: stats.indexOf("Status: Complete") < 0,
        nsfw: rated ? rated[1] === "M" : false,
        locale: "en",
        genres: genres,
        suggests: suggests
    });
}
