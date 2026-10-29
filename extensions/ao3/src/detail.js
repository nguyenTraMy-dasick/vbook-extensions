load('config.js');

// Links like /chapters/123 carry no work id; the chapter page links back to its work.
function resolveWorkId(url) {
    var id = getWorkId(url);
    if (id) return id;
    var m = /\/chapters\/(\d+)/.exec(url);
    if (!m) return "";
    var doc = loadDoc(adultUrl(BASE_URL + "/chapters/" + m[1]), "#workskin");
    if (!doc) return "";
    var found = "";
    doc.select("ul.work.navigation a[href*='/works/'], #chapters a[href*='/works/']").forEach(function (a) {
        if (!found) found = getWorkId(a.attr("href"));
    });
    return found;
}

function dd(meta, cls) {
    return firstEl(meta, "dd." + cls);
}

function execute(url) {
    url = normalizeUrl(url);
    var id = resolveWorkId(url);
    if (!id) return loadError("Link AO3 không hợp lệ: " + url);

    var workUrl = BASE_URL + "/works/" + id;
    var doc = loadDoc(adultUrl(workUrl), "#workskin");
    if (!doc) return loadError();
    if (doc.select("#workskin").size() === 0) return workError(doc);

    var preface = firstEl(doc, "#workskin div.preface");
    var titleEl = firstEl(doc, "#workskin h2.title");
    var authors = joinTags(doc, "#workskin h3.byline a[rel='author']");
    var author = authors.length ? authors.join(", ") : cleanText(doc.select("#workskin h3.byline").text()) || "Anonymous";
    var summaryEl = preface ? firstEl(preface, "div.summary blockquote.userstuff") : null;

    var meta = firstEl(doc, "dl.work.meta") || doc;
    var lines = [];
    function addTags(label, cls) {
        var el = dd(meta, cls);
        if (!el) return [];
        var tags = joinTags(el, "a.tag");
        if (tags.length) lines.push(label + ": " + tags.join(", "));
        return tags;
    }
    var ratings = addTags("Rating", "rating");
    addTags("Warnings", "warning");
    addTags("Category", "category");
    addTags("Fandom", "fandom");
    addTags("Relationships", "relationship");
    addTags("Characters", "character");
    addTags("Tags", "freeform");

    var language = dd(meta, "language");
    if (language) lines.push("Language: " + cleanText(language.text()));
    var series = dd(meta, "series");
    if (series) {
        series.select("span.position").forEach(function (s) {
            lines.push("Series: " + cleanText(s.text()));
        });
    }

    var stats = firstEl(meta, "dl.stats") || meta;
    var chaptersText = "";
    ["published", "status", "words", "chapters", "kudos", "bookmarks", "hits"].forEach(function (cls) {
        var v = firstEl(stats, "dd." + cls);
        var k = firstEl(stats, "dt." + cls);
        if (!v) return;
        var value = cleanText(v.text());
        if (cls === "chapters") chaptersText = value;
        lines.push((k ? cleanText(k.text()).replace(/:$/, "") : cls) + ": " + value);
    });

    var ongoing = true;
    var cm = /^(\d+)\/(\d+|\?)$/.exec(chaptersText);
    if (cm && cm[2] !== "?" && cm[1] === cm[2]) ongoing = false;

    var genres = [];
    var fandomEl = dd(meta, "fandom");
    if (fandomEl) {
        fandomEl.select("a.tag").forEach(function (a) {
            genres.push({ title: cleanText(a.text()), input: a.attr("href"), script: "list.js" });
        });
    }

    var tags = [];
    ["relationship", "character", "freeform"].forEach(function (cls) {
        var el = dd(meta, cls);
        if (!el) return;
        el.select("a.tag").forEach(function (a) {
            if (tags.length < 40) tags.push({ title: cleanText(a.text()), input: a.attr("href"), script: "list.js" });
        });
    });

    var suggests = [];
    doc.select("#workskin h3.byline a[rel='author']").forEach(function (a) {
        var href = a.attr("href").replace(/\/pseuds\/.*$/, "");
        suggests.push({ title: "Fic khác của " + cleanText(a.text()), input: href + "/works", script: "list.js" });
    });
    if (series) {
        series.select("a[href^='/series/']").forEach(function (a) {
            suggests.push({ title: "Series: " + cleanText(a.text()), input: a.attr("href"), script: "list.js" });
        });
    }

    var rating = ratings.join(" ");
    return Response.success({
        name: titleEl ? cleanText(titleEl.text()) : "",
        author: author,
        cover: "",
        host: BASE_URL,
        description: summaryEl ? summaryEl.html() : "",
        detail: lines.join("<br>"),
        url: workUrl,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        nsfw: rating.indexOf("Explicit") >= 0 || rating.indexOf("Mature") >= 0,
        genres: genres,
        tags: tags,
        suggests: suggests
    });
}
