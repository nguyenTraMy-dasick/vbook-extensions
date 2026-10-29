load('config.js');

// input: /profile/u/<name>. The stories tab loads its list from /htmx/profile/<id>/stories.
function execute(input, page) {
    page = parseInt(page || "1", 10) || 1;
    var profile = normalizeUrl(input).replace(/\/stories\/?$/, "").replace(/\/+$/, "");
    var doc = getDoc(profile + "/stories");
    if (!doc) return loadError();

    var frag = firstEl(doc, "[hx-get*='/htmx/profile/'][hx-get*='/stories']");
    if (!frag) return Response.success([], "");
    var url = normalizeUrl(frag.attr("hx-get"));
    if (page > 1) url = addParam(url, "page", String(page));

    var list = getDoc(url);
    if (!list) return loadError();
    return Response.success(parseStoryCards(list), hasNextPage(list) ? String(page + 1) : "");
}
