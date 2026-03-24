const BASE_URL = "https://huongkhilau.com";

// Tìm kiếm truyện
async function search(keyword) {
  const url = `${BASE_URL}/?s=${encodeURIComponent(keyword)}`;
  const $ = await vbook.fetch(url);

  const results = [];
  $(".book-item, .story-item, article").each((i, el) => {
    const title = $(el).find("h3 a, .title a, a").first().text().trim();
    const href = $(el).find("a").first().attr("href");
    const cover = $(el).find("img").attr("src") || "";
    const status = $(el).find(".status, .trang-thai").text().trim();

    if (title && href) {
      results.push({
        title,
        url: href,
        cover,
        status,
      });
    }
  });

  return results;
}

// Lấy thông tin truyện (trang truyện)
async function getBookInfo(url) {
  const $ = await vbook.fetch(url);

  // Lấy tiêu đề
  const title = $("h1").first().text().trim();

  // Lấy ảnh bìa
  const cover = $("img[alt='" + title + "'], .book-cover img, .story-cover img")
    .first().attr("src") || "";

  // Lấy tác giả
  const author = $("a[href*='/tac-gia/'], .author a").first().text().trim()
    || $("*:contains('Tác giả')").next().text().trim();

  // Lấy mô tả
  const description = $(".description, .gioi-thieu, .tom-tat").text().trim()
    || $("p").first().text().trim();

  // Lấy danh sách chương từ ul.chapter-list hoặc table
  const chapters = [];
  $("ul li a[href*='/chuong-'], .chapter-list a, table a[href*='/chuong-']").each((i, el) => {
    const chapterTitle = $(el).text().trim();
    const chapterUrl = $(el).attr("href");
    if (chapterTitle && chapterUrl) {
      chapters.push({ title: chapterTitle, url: chapterUrl });
    }
  });

  return { title, cover, author, description, chapters };
}

// Lấy nội dung một chương
async function getChapter(url) {
  const $ = await vbook.fetch(url);

  // Tiêu đề chương
  const title = $("h1, h2, .chapter-title").first().text().trim();

  // Nội dung — thường nằm trong div.chapter-content hoặc article
  const content = $(".chapter-content, .content, article .text, #chapter-content")
    .html() || $("article").html() || "";

  return { title, content };
}

// Lấy danh sách thể loại (categories)
async function getCategories() {
  const categories = [
    { title: "Cổ Đại", url: `${BASE_URL}/the-loai/co-dai` },
    { title: "Hiện Đại", url: `${BASE_URL}/the-loai/hien-dai` },
    { title: "Xuyên Không", url: `${BASE_URL}/the-loai/xuyen-khong` },
    { title: "Ngược Tâm", url: `${BASE_URL}/the-loai/nguoc` },
    { title: "Ngọt Sủng", url: `${BASE_URL}/the-loai/ngot-sung` },
    { title: "Điền Văn", url: `${BASE_URL}/the-loai/dien-van` },
    { title: "Trọng Sinh", url: `${BASE_URL}/the-loai/trong-sinh` },
    { title: "Huyền Huyễn", url: `${BASE_URL}/the-loai/huyen-huyen` },
    { title: "Đồng Nhân", url: `${BASE_URL}/the-loai/dong-nhan` },
    { title: "Bí Ẩn", url: `${BASE_URL}/the-loai/bi-an` },
  ];
  return categories;
}

// Lấy danh sách truyện theo thể loại hoặc trang chủ
async function getBookList(url) {
  const $ = await vbook.fetch(url);
  const books = [];

  // Selector dựa trên cấu trúc homepage (thẻ a dẫn đến slug truyện với ảnh)
  $("a[href^='https://huongkhilau.com/']:not([href*='/the-loai']):not([href*='/thanh-vien']):not([href*='/login'])").each((i, el) => {
    const href = $(el).attr("href");
    const img = $(el).find("img").attr("src");
    const title = $(el).find("img").attr("alt") || $(el).attr("title") || $(el).text().trim();

    // Chỉ lấy link truyện (có ảnh bìa)
    if (img && title && href && !href.includes("/chuong-")) {
      books.push({ title, url: href, cover: img });
    }
  });

  // Lấy link trang kế
  const nextPage = $("a:contains('Trang sau'), .pagination .next").attr("href") || null;

  return { books, nextPage };
}

module.exports = {
  search,
  getBookInfo,
  getChapter,
  getCategories,
  getBookList,
};
