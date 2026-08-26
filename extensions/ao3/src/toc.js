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
    var fetchUrl = addAdultParam(url);

    var response = fetch(fetchUrl);

    if (!response.ok) {
        return Response.error(
            "Cannot load AO3 TOC: HTTP " +
            response.status
        );
    }

    var doc = response.html();

    var result = [];

    var options =
        doc.select("select#selected_id option");

    options.forEach(function(option) {
        var chapterId =
            option.attr("value");

        if (!chapterId) return;

        var name =
            option.text().trim();

        result.push({
            name: name,
            url: "/chapters/" + chapterId,
            host: BASE_URL
        });
    });

    /*
     * Nếu không có dropdown thì đây thường
     * là one-shot / single chapter work.
     */
    if (result.length === 0) {
        var workMatch =
            url.match(/\/works\/(\d+)/);

        if (!workMatch) {
            return Response.error(
                "Cannot determine AO3 work ID"
            );
        }

        var title =
            doc.select(
                "#workskin > .preface > h2.title"
            ).first();

        result.push({
            name: title
                ? title.text().trim()
                : "Chapter 1",
            url: "/works/" + workMatch[1],
            host: BASE_URL
        });
    }

    return Response.success(result);
}