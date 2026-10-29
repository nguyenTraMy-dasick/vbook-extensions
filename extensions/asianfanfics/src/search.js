load('config.js');

function execute(query, page) {
    query = cleanText(query);
    page = parseInt(page || "1", 10) || 1;
    if (!query) return Response.success([], "");

    var url = BASE_URL + "/htmx/browse/search?mount=1&q=" + encodeURIComponent(query) + "&page=" + page;
    var doc = getDoc(url);
    if (!doc) return loadError();
    return Response.success(parseStoryCards(doc), hasNextPage(doc) ? String(page + 1) : "");
}
