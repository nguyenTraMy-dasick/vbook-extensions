var BASE_URL = "https://archiveofourown.org";

function normalizeUrl(url) {
    if (!url) return "";

    if (url.indexOf("http") === 0) {
        return url;
    }

    return BASE_URL + url;
}

function addAdultParam(url) {
    if (url.indexOf("view_adult=true") >= 0) {
        return url;
    }

    return url +
        (url.indexOf("?") >= 0 ? "&" : "?") +
        "view_adult=true";
}

function execute(url) {
    url = normalizeUrl(url);
    url = addAdultParam(url);

    var response = fetch(url);

    if (!response.ok) {
        return Response.error(
            "Cannot load AO3 chapter: HTTP " +
            response.status
        );
    }

    var doc = response.html();

    /*
     * Multi-chapter / chapter URL.
     */
    var content =
        doc.select(
            "#chapters .chapter .userstuff"
        ).first();

    /*
     * Một số chapter page không cần .chapter
     * trong selector.
     */
    if (!content) {
        content =
            doc.select(
                "#chapters > .userstuff"
            ).first();
    }

    /*
     * Generic fallback.
     */
    if (!content) {
        content =
            doc.select(
                "#chapters .userstuff"
            ).first();
    }

    if (!content) {
        return Response.error(
            "Không tìm thấy nội dung chapter. " +
            "Fic có thể yêu cầu đăng nhập AO3."
        );
    }

    /*
     * Loại bỏ script/style nếu workskin
     * hoặc HTML của fic chứa chúng.
     */
    content.select(
        "script, style, noscript"
    ).remove();

    var html = content.html();

    if (!html) {
        return Response.error(
            "AO3 chapter content is empty"
        );
    }

    return Response.success(html);
}