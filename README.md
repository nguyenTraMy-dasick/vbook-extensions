# vBook Extensions

Extension cho app **vBook**: đọc fanfiction từ Archive of Our Own, FanFiction.net và Asianfanfics ngay trong app.

Tải app tại: https://vbookapp.com/

## Link extension

```
https://raw.githubusercontent.com/nguyenTraMy-dasick/vbook-extensions/main/plugin.json
```

## Source

| Name                        | Source URL                      |
| --------------------------- | ------------------------------- |
| Archive of Our Own (AO3)    | https://archiveofourown.org     |
| FanFiction.net              | https://www.fanfiction.net      |
| Asianfanfics                | https://www.asianfanfics.com    |

## Hướng dẫn cài đặt

1. Mở app vBook, vào mục **Phần mở rộng** (Extension).
2. Chọn **Quản lý Extension URL**.
3. Thêm link extension ở trên rồi lưu.
4. Quay lại danh sách extension, cài **Archive of Our Own**, **FanFiction.net** và/hoặc **Asianfanfics**.

Khi repo có bản mới (số `version` tăng), app sẽ hiện nút cập nhật cho extension đó.

## Lưu ý khi sử dụng

- **AO3**: fic chỉ dành cho thành viên cần đăng nhập AO3 bằng trình duyệt trong app trước. Có thể bật/tắt hiển thị ghi chú tác giả (Summary/Notes) trong phần cài đặt của extension.
- **FanFiction.net**: trang dùng Cloudflare; nếu bị chặn, extension sẽ tự mở trang bằng trình duyệt ẩn của app nên lần tải đầu có thể chậm hơn.
- **Asianfanfics**: truyện có nhãn 🔒 *Subscribers Only* / *Members Only* / *Friends Only* cần đăng nhập Asianfanfics (và bấm Subscribe truyện) bằng trình duyệt trong app mới đọc được. Extension tự xác nhận bước "Are you over 18?" khi mở chương. Có thể đổi ngôn ngữ truyện (mặc định English) trong phần cài đặt của extension.
- Có thể dán trực tiếp link truyện (`archiveofourown.org/works/...`, `fanfiction.net/s/...`, `asianfanfics.com/story/view/...`) vào app để mở bằng extension tương ứng.
