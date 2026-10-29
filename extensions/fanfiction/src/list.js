load('config.js');

// input: a site path — fandom (/book/Harry-Potter/), crossover, Just In (/j/...),
// or author page (/u/123/Name).
function execute(input, page) {
    page = parseInt(page || "1", 10) || 1;
    var url = normalizeUrl(input || "/j/0/0/0/");

    var isJustIn = /\/j\//.test(url);
    var isAuthor = /\/u\/\d+/.test(url);
    if (isJustIn || isAuthor) {
        if (page > 1) return Response.success([], "");
    } else {
        if (url.indexOf("srt=") < 0) {
            url += (url.indexOf("?") >= 0 ? "&" : "?&") + "srt=1&r=10";
        }
        url += "&p=" + page;
    }

    var doc = loadDoc(url);
    if (!doc) return siteError(null);

    // Author pages list the author's own stories in #st_inside, favourites elsewhere.
    var selector = isAuthor && doc.select("#st_inside div.z-list").size() > 0 ? "#st_inside div.z-list" : "div.z-list";
    var items = parseStoryList(doc, selector);
    var next = (!isJustIn && !isAuthor && hasNextPage(doc)) ? String(page + 1) : "";
    return Response.success(items, next);
}
