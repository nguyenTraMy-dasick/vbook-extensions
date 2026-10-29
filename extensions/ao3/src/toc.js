load('config.js');

function execute(url) {
    var id = getWorkId(normalizeUrl(url));
    if (!id) return Response.error("Link AO3 không hợp lệ: " + url);

    var chapters = [];

    // The chapter index page lists every chapter with its posting date.
    var nav = loadDoc(adultUrl(BASE_URL + "/works/" + id + "/navigate"), "ol.chapter.index");
    if (nav) {
        nav.select("ol.chapter.index li").forEach(function (li) {
            var a = firstEl(li, "a");
            if (!a || !a.attr("href")) return;
            chapters.push({
                name: cleanText(a.text()),
                url: a.attr("href"),
                description: cleanText(li.select("span.datetime").text()).replace(/[()]/g, ""),
                host: BASE_URL
            });
        });
    }
    if (chapters.length > 0) return Response.success(chapters);

    // Fallback: the chapter dropdown on the work page, or a single-chapter work.
    var doc = loadDoc(adultUrl(BASE_URL + "/works/" + id), "#workskin");
    if (!doc) return loadError();
    if (doc.select("#workskin").size() === 0) return workError(doc);

    var select = firstEl(doc, "select#selected_id");
    if (select) {
        select.select("option").forEach(function (opt) {
            var chapterId = opt.attr("value");
            if (!chapterId) return;
            chapters.push({
                name: cleanText(opt.text()),
                url: "/works/" + id + "/chapters/" + chapterId,
                host: BASE_URL
            });
        });
    }
    if (chapters.length === 0) {
        var title = firstEl(doc, "#workskin h2.title");
        chapters.push({
            name: title ? cleanText(title.text()) : "Chapter 1",
            url: "/works/" + id,
            host: BASE_URL
        });
    }
    return Response.success(chapters);
}
