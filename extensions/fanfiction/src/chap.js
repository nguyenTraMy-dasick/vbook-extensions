load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    if (!/\/s\/\d+\/\d+/.test(url)) return Response.error("Link chương không hợp lệ: " + url);
    if (!/\/$/.test(url) && /\/s\/\d+\/\d+$/.test(url)) url += "/";

    var doc = loadDoc(url);
    if (!doc) return siteError(null);

    var content = firstEl(doc, "#storytext");
    if (!content) return siteError(doc, "Không tìm thấy nội dung chương.");
    content.select("script, style, noscript").remove();

    var title = "";
    var selected = firstEl(doc, "#chap_select option[selected]");
    if (selected) title = cleanText(selected.text());

    return Response.success(content.html(), title);
}
