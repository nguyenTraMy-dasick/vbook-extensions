load('config.js');

function execute(query, page) {
    query = cleanText(query);
    page = parseInt(page || "1", 10) || 1;
    if (!query) return Response.success([], "");

    var url = BASE_URL + "/search/?ready=1&type=story&keywords=" +
        encodeURIComponent(query).replace(/%20/g, "+") + "&ppage=" + page;
    var doc = loadDoc(url, "div.z-list, #content_wrapper_inner");
    if (!doc) return siteError(null);

    var items = parseStoryList(doc);
    return Response.success(items, hasNextPage(doc) ? String(page + 1) : "");
}
