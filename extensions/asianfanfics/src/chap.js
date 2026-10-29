load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    if (!getStoryId(url)) return Response.error("Link chương không hợp lệ: " + url);

    var doc = getDocPastAgeGate(url);
    if (!doc) return loadError();

    var meta = firstEl(doc, "#storyViewMeta");
    var title = meta ? cleanText(meta.attr("data-chapter-title")) : "";

    // The chapter body is loaded by htmx from /htmx/chapter/<id>/<token>.
    var frag = firstEl(doc, "[hx-get^='/htmx/chapter/']");
    if (!frag) {
        var text = cleanText(doc.select("main").text());
        if (/subscribe to read/i.test(text)) {
            return Response.error("🔒 Chương này dành cho người đăng ký theo dõi (Subscribers Only). Hãy đăng nhập Asianfanfics trong trình duyệt của vBook và bấm Subscribe truyện, rồi thử lại.");
        }
        if (/log ?in|members only|friends only/i.test(text)) {
            return Response.error("🔒 Truyện này yêu cầu đăng nhập Asianfanfics (Members/Friends Only). Hãy đăng nhập trong trình duyệt của vBook rồi thử lại.");
        }
        return Response.error("Không tìm thấy nội dung chương.");
    }

    var body = getDoc(normalizeUrl(frag.attr("hx-get")));
    if (!body) return loadError("Không tải được nội dung chương, hãy thử lại.");
    var content = firstEl(body, "#user-submitted-body") || firstEl(body, "body");
    content.select("script, style, noscript").remove();

    return Response.success(content.html(), title);
}
