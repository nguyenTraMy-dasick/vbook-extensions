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
    url = addAdultParam(url);

    var response = fetch(url);

    if (!response.ok) {
        return Response.error(
            "Cannot load AO3 work: HTTP " + response.status
        );
    }

    var doc = response.html();

    var titleEl =
        doc.select("#workskin > .preface > h2.title").first();

    if (!titleEl) {
        titleEl =
            doc.select("h2.title.heading").first();
    }

    if (!titleEl) {
        return Response.error(
            "Không tìm thấy truyện. Fic có thể yêu cầu đăng nhập AO3."
        );
    }

    var name = titleEl.text().trim();

    var authorEl =
        doc.select(
            "#workskin > .preface a[rel='author']"
        ).first();

    var author = authorEl
        ? authorEl.text().trim()
        : "Anonymous";

    var summaryEl =
        doc.select(
            "#workskin > .preface .summary blockquote"
        ).first();

    var description = summaryEl
        ? summaryEl.text().trim()
        : "";

    var detail = [];

    var rating =
        doc.select("dd.rating.tags").first();

    if (rating) {
        detail.push(
            "<b>Rating:</b> " +
            rating.text().trim()
        );
    }

    var fandom =
        doc.select("dd.fandom.tags").first();

    if (fandom) {
        detail.push(
            "<b>Fandom:</b> " +
            fandom.text().trim()
        );
    }

    var relationship =
        doc.select("dd.relationship.tags").first();

    if (relationship) {
        var text = relationship.text().trim();

        if (text) {
            detail.push(
                "<b>Relationships:</b> " + text
            );
        }
    }

    var character =
        doc.select("dd.character.tags").first();

    if (character) {
        var characterText =
            character.text().trim();

        if (characterText) {
            detail.push(
                "<b>Characters:</b> " +
                characterText
            );
        }
    }

    var freeform =
        doc.select("dd.freeform.tags").first();

    if (freeform) {
        var tags = freeform.text().trim();

        if (tags) {
            detail.push(
                "<b>Tags:</b> " + tags
            );
        }
    }

    var words =
        doc.select("dd.words").first();

    if (words) {
        detail.push(
            "<b>Words:</b> " +
            words.text().trim()
        );
    }

    var chapterInfo =
        doc.select("dd.chapters").first();

    var ongoing = true;

    if (chapterInfo) {
        var chapterText =
            chapterInfo.text().trim();

        detail.push(
            "<b>Chapters:</b> " +
            chapterText
        );

        var split =
            chapterText.split("/");

        if (
            split.length === 2 &&
            split[0].trim() === split[1].trim()
        ) {
            ongoing = false;
        }
    }

    var status =
        doc.select("dd.status").first();

    if (status) {
        detail.push(
            "<b>Status:</b> " +
            status.text().trim()
        );
    }

    return Response.success({
        name: name,
        cover: "",
        host: BASE_URL,
        author: author,
        description: description,
        detail: detail.join("<br>"),
        ongoing: ongoing
    });
}