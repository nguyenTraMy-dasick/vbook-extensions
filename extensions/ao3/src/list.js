load('config.js');

// input: an AO3 listing path — tag works (/tags/X/works), user works, or a search URL.
function execute(input, page) {
    page = parseInt(page || "1", 10) || 1;
    var url = normalizeUrl(input || "/works/search?work_search%5Bquery%5D=&work_search%5Bsort_column%5D=revised_at");
    url = url.replace(/([?&])page=\d+&?/, "$1").replace(/[?&]$/, "");
    url = addParam(url, "page=" + page);

    var doc = loadDoc(url, "li.work.blurb, #main");
    if (!doc) return loadError();

    return Response.success(parseWorkList(doc), hasNextPage(doc) ? String(page + 1) : "");
}
