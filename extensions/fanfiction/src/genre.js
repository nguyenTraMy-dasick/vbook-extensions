// Largest fandoms of each FanFiction.net category (taken from the category pages).
var FANDOMS = [
    ["Anime", "Naruto", "/anime/Naruto/"],
    ["Anime", "Inuyasha", "/anime/Inuyasha/"],
    ["Anime", "Hetalia", "/anime/Hetalia/"],
    ["Anime", "Bleach", "/anime/Bleach/"],
    ["Anime", "Fairy Tail", "/anime/Fairy-Tail/"],
    ["Anime", "Yu-Gi-Oh", "/anime/Yu-Gi-Oh/"],
    ["Book", "Harry Potter", "/book/Harry-Potter/"],
    ["Book", "Twilight", "/book/Twilight/"],
    ["Book", "Percy Jackson and the Olympians", "/book/Percy-Jackson-and-the-Olympians/"],
    ["Book", "Lord of the Rings", "/book/Lord-of-the-Rings/"],
    ["Book", "Hunger Games", "/book/Hunger-Games/"],
    ["Book", "Warriors", "/book/Warriors/"],
    ["Cartoon", "Avatar: Last Airbender", "/cartoon/Avatar-Last-Airbender/"],
    ["Cartoon", "Teen Titans", "/cartoon/Teen-Titans/"],
    ["Cartoon", "My Little Pony", "/cartoon/My-Little-Pony/"],
    ["Cartoon", "Miraculous: Tales of Ladybug & Cat Noir", "/cartoon/Miraculous-Tales-of-Ladybug-Cat-Noir/"],
    ["Cartoon", "Danny Phantom", "/cartoon/Danny-Phantom/"],
    ["Comic", "Batman", "/comic/Batman/"],
    ["Comic", "Homestuck", "/comic/Homestuck/"],
    ["Comic", "X-Men", "/comic/X-Men/"],
    ["Comic", "Spider-Man", "/comic/Spider-Man/"],
    ["Comic", "Marvel", "/comic/Marvel/"],
    ["Game", "Pokémon", "/game/Pok%C3%A9mon/"],
    ["Game", "Kingdom Hearts", "/game/Kingdom-Hearts/"],
    ["Game", "Sonic the Hedgehog", "/game/Sonic-the-Hedgehog/"],
    ["Game", "Final Fantasy VII", "/game/Final-Fantasy-VII/"],
    ["Game", "Legend of Zelda", "/game/Legend-of-Zelda/"],
    ["Game", "Dragon Age", "/game/Dragon-Age/"],
    ["Movie", "Star Wars", "/movie/Star-Wars/"],
    ["Movie", "Avengers", "/movie/Avengers/"],
    ["Movie", "Pirates of the Caribbean", "/movie/Pirates-of-the-Caribbean/"],
    ["Movie", "How to Train Your Dragon", "/movie/How-to-Train-Your-Dragon/"],
    ["TV", "Supernatural", "/tv/Supernatural/"],
    ["TV", "Glee", "/tv/Glee/"],
    ["TV", "Doctor Who", "/tv/Doctor-Who/"],
    ["TV", "Sherlock", "/tv/Sherlock/"],
    ["TV", "Once Upon a Time", "/tv/Once-Upon-a-Time/"],
    ["TV", "Buffy: The Vampire Slayer", "/tv/Buffy-The-Vampire-Slayer/"],
    ["Misc", "Wrestling", "/misc/Wrestling/"],
    ["Misc", "Vocaloid", "/misc/Vocaloid/"],
    ["Play", "Les Misérables", "/play/Les-Mis%C3%A9rables/"],
    ["Play", "Wicked", "/play/Wicked/"]
];

function execute() {
    var genres = [];
    for (var i = 0; i < FANDOMS.length; i++) {
        genres.push({
            title: FANDOMS[i][1] + " (" + FANDOMS[i][0] + ")",
            input: FANDOMS[i][2],
            script: "list.js"
        });
    }
    return Response.success(genres);
}
