load('config.js');

// Used when the /media page can't be loaded.
var FALLBACK_FANDOMS = [
    "Harry Potter - J. K. Rowling",
    "Marvel Cinematic Universe",
    "The Avengers (Marvel Movies)",
    "Supernatural (TV 2005)",
    "Sherlock (TV)",
    "Star Wars - All Media Types",
    "Naruto",
    "Haikyuu!!",
    "Shingeki no Kyojin | Attack on Titan",
    "One Piece",
    "Genshin Impact (Video Game)",
    "Minecraft (Video Game)",
    "Teen Wolf (TV)",
    "Doctor Who",
    "Good Omens (TV)",
    "Batman - All Media Types",
    "Percy Jackson and the Olympians & Related Fandoms - All Media Types",
    "Hetalia: Axis Powers",
    "Original Work"
];

function execute() {
    var genres = [];
    var seen = {};

    // /media lists every media category with its biggest fandoms.
    var doc = loadDoc(BASE_URL + "/media", "li.medium");
    if (doc) {
        doc.select("li.medium").forEach(function (medium) {
            var mediaName = cleanText(medium.select("h3 a").text());
            medium.select("ol.index a.tag, ol a.tag").forEach(function (a) {
                var title = cleanText(a.text());
                var href = a.attr("href");
                if (!title || !href || seen[href]) return;
                seen[href] = true;
                genres.push({
                    title: mediaName ? title + " (" + mediaName + ")" : title,
                    input: href,
                    script: "list.js"
                });
            });
        });
    }

    if (genres.length === 0) {
        for (var i = 0; i < FALLBACK_FANDOMS.length; i++) {
            genres.push({ title: FALLBACK_FANDOMS[i], input: tagWorksPath(FALLBACK_FANDOMS[i]), script: "list.js" });
        }
    }
    return Response.success(genres);
}
