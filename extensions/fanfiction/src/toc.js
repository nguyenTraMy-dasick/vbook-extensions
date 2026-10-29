load('config.js');

function execute(url) {
    var id = getStoryId(normalizeUrl(url));
    if (!id) return Response.error("Link FanFiction.net không hợp lệ: " + url);

    var doc = loadDoc(BASE_URL + "/s/" + id + "/1/", "#storytext");
    if (!doc) return siteError(null);
    if (doc.select("#storytext").size() === 0) return siteError(doc, "Không tìm thấy truyện (có thể đã bị xoá).");

    var chapters = [];
    // The chapter <select> appears twice (top and bottom); use the first one.
    var select = firstEl(doc, "#chap_select");
    if (select) {
        select.select("option").forEach(function (opt) {
            var num = opt.attr("value");
            if (!num) return;
            chapters.push({
                name: cleanText(opt.text()),
                url: "/s/" + id + "/" + num + "/",
                host: BASE_URL
            });
        });
    }

    if (chapters.length === 0) {
        var titleEl = firstEl(doc, "#profile_top b.xcontrast_txt");
        chapters.push({
            name: titleEl ? cleanText(titleEl.text()) : "Oneshot",
            url: "/s/" + id + "/1/",
            host: BASE_URL
        });
    }

    return Response.success(chapters);
}
