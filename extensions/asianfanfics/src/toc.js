load('config.js');

function execute(url) {
    var id = getStoryId(normalizeUrl(url));
    if (!id) return Response.error("Link Asianfanfics không hợp lệ: " + url);

    var doc = getDocPastAgeGate(BASE_URL + "/story/view/" + id);
    if (!doc) return loadError();

    var chapters = [];
    var seen = {};
    // Table of Contents sidebar; data-toc-chapter="0" is the Foreword (story page itself).
    // Chapter numbers in URLs can skip (deleted chapters), so number them by position.
    doc.select("[data-toc-list] a[data-toc-chapter]").forEach(function (a) {
        var num = a.attr("data-toc-chapter");
        if (!num || num === "0" || seen[num]) return;
        seen[num] = true;
        var spans = a.select("span");
        var title = spans.size() > 1 ? cleanText(spans.get(1).text()) : cleanText(a.text());
        chapters.push({
            name: (chapters.length + 1) + ". " + title,
            url: a.attr("href"),
            host: BASE_URL
        });
    });

    if (chapters.length === 0) {
        return Response.error("Không tìm thấy danh sách chương (truyện có thể đã bị xoá hoặc chuyển sang riêng tư).");
    }
    return Response.success(chapters);
}
