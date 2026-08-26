var BASE_URL = "https://archiveofourown.org";

function execute(key, page) {
    var currentPage = parseInt(page || "1", 10);

    var url =
        BASE_URL +
        "/works/search?work_search%5Bquery%5D=" +
        encodeURIComponent(key) +
        "&page=" +
        currentPage;

    var response = fetch(url);

    if (!response.ok) {
        return Response.error(
            "AO3 search failed: HTTP " + response.status
        );
    }

    var doc = response.html();

    var works = doc.select("li.work.blurb");
    var result = [];

    works.forEach(function(work) {
        var titleEl =
            work.select("h4.heading a[href^='/works/']").first();

        if (!titleEl) return;

        var name = titleEl.text().trim();
        var link = titleEl.attr("href");

        var authorEl =
            work.select("a[rel='author']").first();

        var author = authorEl
            ? authorEl.text().trim()
            : "Anonymous";

        var fandomEl =
            work.select("h5.fandoms").first();

        var fandom = fandomEl
            ? fandomEl.text().trim()
            : "";

        var description = author;

        if (fandom) {
            description += " • " + fandom;
        }

        result.push({
            name: name,
            link: link,
            host: BASE_URL,
            cover: "",
            description: description
        });
    });

    var next = null;

    var nextEl =
        doc.select("ol.pagination li.next a").first();

    if (nextEl) {
        next = String(currentPage + 1);
    }

    return Response.success(result, next);
}