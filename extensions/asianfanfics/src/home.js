function execute() {
    var B = "/htmx/browse/en/";
    return Response.success([
        { title: "Mới cập nhật", input: B + "latest", script: "list.js" },
        { title: "Mới đăng", input: B + "newest", script: "list.js" },
        { title: "Thịnh hành", input: B + "trending", script: "list.js" },
        { title: "Nổi bật", input: B + "featured", script: "list.js" },
        { title: "Nhiều lượt xem", input: B + "views", script: "list.js" },
        { title: "Nhiều theo dõi", input: B + "favorited", script: "list.js" },
        { title: "Nhiều bình luận", input: B + "commented", script: "list.js" },
        { title: "Hoàn thành", input: B + "completed", script: "list.js" },
        { title: "Oneshot", input: B + "one-shots", script: "list.js" }
    ]);
}
