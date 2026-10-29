load('config.js');

var FALLBACK_TAGS = ["romance", "angst", "fluff", "comedy", "fantasy", "drama", "schoollife", "oneshot", "exo", "bts", "shinee", "seventeen", "nct", "blackpink", "twice", "straykids"];

function tagItem(title, slug) {
    return { title: title, input: "/htmx/browse/en/tag/" + slug, script: "list.js" };
}

function execute() {
    var genres = [];
    var seen = {};
    var doc = getDoc(BASE_URL + "/browse/popular-tags");
    if (doc) {
        doc.select("a[href^='/browse/tag/']").forEach(function (a) {
            var m = /^\/browse\/tag\/([^?\/]+)/.exec(a.attr("href"));
            if (!m || seen[m[1]]) return;
            seen[m[1]] = true;
            // Link text is "romance151,333": tag name followed by its story count in a <span>.
            var count = cleanText(a.select("span").text());
            var name = cleanText(a.text());
            if (count && name.lastIndexOf(count) === name.length - count.length) {
                name = cleanText(name.substring(0, name.length - count.length));
            }
            genres.push(tagItem(name || decodeURIComponent(m[1]), m[1]));
        });
    }
    if (genres.length === 0) {
        for (var i = 0; i < FALLBACK_TAGS.length; i++) genres.push(tagItem(FALLBACK_TAGS[i], FALLBACK_TAGS[i]));
    }
    return Response.success(genres);
}
