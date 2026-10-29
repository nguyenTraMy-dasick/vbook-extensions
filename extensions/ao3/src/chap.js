load('config.js');

function notesBlock(root, selector, label) {
    var html = "";
    root.select(selector).forEach(function (el) {
        var inner = el.html();
        if (cleanText(el.text())) html += "<blockquote><p><b>" + label + "</b></p>" + inner + "</blockquote>";
    });
    return html;
}

function execute(url) {
    url = normalizeUrl(url);
    if (!getWorkId(url) && !/\/chapters\/\d+/.test(url)) return Response.error("Link chương không hợp lệ: " + url);

    var doc = loadDoc(adultUrl(url), "#chapters");
    if (!doc) return loadError();
    if (doc.select("#chapters").size() === 0) return workError(doc);

    var title = "";
    var before = "";
    var after = "";
    var content = null;

    // Multi-chapter work: #chapters > div.chapter > [preface, div.userstuff.module, end notes].
    // Note: chapter summary/notes are also .userstuff, so pick the article block explicitly.
    var chapter = firstEl(doc, "#chapters > div.chapter");
    if (chapter) {
        content = firstEl(chapter, "div.userstuff[role=article]") || firstEl(chapter, "div.userstuff.module");
        var titleEl = firstEl(chapter, "div.chapter.preface h3.title");
        if (titleEl) title = cleanText(titleEl.text());
        if (SHOW_AUTHOR_NOTES) {
            before = notesBlock(chapter, "div.chapter.preface div.summary blockquote.userstuff", "Chapter Summary") +
                notesBlock(chapter, "div.chapter.preface div.notes:not(.end) blockquote.userstuff", "Notes");
            after = notesBlock(chapter, "div.end.notes blockquote.userstuff", "Notes");
        }
    } else {
        // Single-chapter work: #chapters > div.userstuff, notes in the work preface/afterword.
        content = firstEl(doc, "#chapters > div.userstuff") || firstEl(doc, "#chapters div.userstuff");
        if (SHOW_AUTHOR_NOTES) {
            before = notesBlock(doc, "#workskin > div.preface div.notes:not(.end) blockquote.userstuff", "Notes");
            after = notesBlock(doc, "#workskin div.afterword div.end.notes blockquote.userstuff", "Notes");
        }
    }

    if (!content) return Response.error("Không tìm thấy nội dung chương.");
    content.select("h3.landmark, script, style, noscript").remove();

    var html = before + content.html() + after;
    if (!cleanText(html)) return Response.error("Chương này không có nội dung.");
    return Response.success(html, title);
}
