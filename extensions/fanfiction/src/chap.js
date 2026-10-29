load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    var m = /\/s\/(\d+)\/(\d+)/.exec(url);
    if (!m) return Response.error("Link chương không hợp lệ: " + url);

    var page = loadStoryPage(m[1], m[2]);
    if (!page) return siteError(null);
    var doc = page.doc;

    var content = firstEl(doc, page.mobile ? "#storycontent" : "#storytext");
    if (!content) return siteError(doc, "Không tìm thấy nội dung chương.");
    content.select("script, style, noscript").remove();

    var title = "";
    if (page.mobile) {
        title = mobileChapterTitle(doc);
    } else {
        var selected = firstEl(doc, "#chap_select option[selected]");
        if (selected) title = cleanText(selected.text());
    }
    return Response.success(content.html(), title);
}
