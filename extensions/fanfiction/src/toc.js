load('config.js');

function chapterUrl(id, num) {
    return { url: "/s/" + id + "/" + num + "/", host: BASE_URL };
}

function execute(url) {
    var id = getStoryId(normalizeUrl(url));
    if (!id) return Response.error("Link FanFiction.net không hợp lệ: " + url);

    var page = loadStoryPage(id, 1);
    if (!page) return siteError(null);
    var doc = page.doc;
    var chapters = [];

    if (page.mobile) {
        if (doc.select("#storycontent").size() === 0) return siteError(doc, "Không tìm thấy truyện (có thể đã bị xoá).");
        // The mobile site only gives the chapter count, not the chapter titles.
        var count = mobileChapterCount(doc);
        var first = mobileChapterTitle(doc);
        for (var n = 1; n <= count; n++) {
            var c = chapterUrl(id, n);
            c.name = n === 1 && first ? first : "Chapter " + n;
            chapters.push(c);
        }
        return Response.success(chapters);
    }

    if (doc.select("#storytext").size() === 0) return siteError(doc, "Không tìm thấy truyện (có thể đã bị xoá).");
    // The chapter <select> appears twice (top and bottom); use the first one.
    var select = firstEl(doc, "#chap_select");
    if (select) {
        select.select("option").forEach(function (opt) {
            var num = opt.attr("value");
            if (!num) return;
            var ch = chapterUrl(id, num);
            ch.name = cleanText(opt.text());
            chapters.push(ch);
        });
    }
    if (chapters.length === 0) {
        var titleEl = firstEl(doc, "#profile_top b.xcontrast_txt");
        var one = chapterUrl(id, 1);
        one.name = titleEl ? cleanText(titleEl.text()) : "Oneshot";
        chapters.push(one);
    }
    return Response.success(chapters);
}
