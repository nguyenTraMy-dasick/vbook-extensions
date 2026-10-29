load('config.js');

function execute(query, page) {
    query = cleanText(query);
    page = parseInt(page || "1", 10) || 1;
    if (!query) return Response.success([], "");

    var url = BASE_URL + "/works/search?work_search%5Bquery%5D=" +
        encodeURIComponent(query) + "&page=" + page;
    var doc = loadDoc(url, "ol.work.index, #main");
    if (!doc) return loadError();

    return Response.success(parseWorkList(doc), hasNextPage(doc) ? String(page + 1) : "");
}
