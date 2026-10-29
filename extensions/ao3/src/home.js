var SEARCH = "/works/search?work_search%5Bquery%5D=&work_search%5Bsort_column%5D=";

function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: SEARCH + "revised_at", script: "list.js" },
        { title: "Nhiều kudos", input: SEARCH + "kudos_count", script: "list.js" },
        { title: "Nhiều lượt xem", input: SEARCH + "hits", script: "list.js" },
        { title: "Hoàn thành", input: SEARCH + "revised_at&work_search%5Bcomplete%5D=T", script: "list.js" }
    ]);
}
