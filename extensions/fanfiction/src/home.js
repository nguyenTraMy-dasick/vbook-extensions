function execute() {
    return Response.success([
        { title: "Just In", input: "/j/0/0/0/", script: "list.js" },
        { title: "Harry Potter", input: "/book/Harry-Potter/", script: "list.js" },
        { title: "Naruto", input: "/anime/Naruto/", script: "list.js" },
        { title: "Pokémon", input: "/game/Pok%C3%A9mon/", script: "list.js" },
        { title: "Supernatural", input: "/tv/Supernatural/", script: "list.js" },
        { title: "Star Wars", input: "/movie/Star-Wars/", script: "list.js" }
    ]);
}
