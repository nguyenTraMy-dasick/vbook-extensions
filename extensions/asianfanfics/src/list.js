load('config.js');

// input: an htmx listing path, e.g. /htmx/browse/en/latest or /htmx/browse/en/tag/romance
function execute(input, page) {
    page = parseInt(page || "1", 10) || 1;
    var url = normalizeUrl(input || "/htmx/browse/en/latest");
    url = addParam(url, "page", String(page));
    url = addParam(url, "language", STORY_LANGUAGE);

    var doc = getDoc(url);
    if (!doc) return loadError();
    return Response.success(parseStoryCards(doc), hasNextPage(doc) ? String(page + 1) : "");
}
