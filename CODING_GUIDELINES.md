# QUY CHUẨN VIẾT CODE DỰ ÁN KHÓA LUẬN (CODING GUIDELINES)

Đây là bộ quy tắc bắt buộc áp dụng cho toàn bộ dự án nhằm đảm bảo mã nguồn dễ đọc, dễ hiểu và dễ bảo trì.

## 1. Hạn chế sử dụng Cú pháp viết tắt (Shorthand)
- **Toán tử ba ngôi (`? :`):** Hạn chế sử dụng nếu logic phức tạp. Thay vào đó, hãy sử dụng cấu trúc `if-else` rõ ràng.
  - *Không khuyến khích:* `string msg = isActive ? "Mở" : "Khóa";`
  - *Khuyến khích:*
    ```csharp
    string msg;
    if (isActive == true) {
        msg = "Mở";
    } else {
        msg = "Khóa";
    }
    ```

## 2. Truy vấn Database (Entity Framework Core)
- Tránh lạm dụng `.AnyAsync()` kết hợp với biểu thức Lambda dài dòng nếu chỉ để kiểm tra tồn tại theo ID.
- Dùng `.FindAsync(id)` để tìm đối tượng cụ thể, sau đó kiểm tra `if (obj == null)` sẽ trực quan hơn rất nhiều.
- Tránh gộp quá nhiều bước `.Select()`, `.Where()`, `.Include()` vào cùng một chuỗi nếu nó gây khó đọc. Hãy ngắt ra thành từng biến trung gian hoặc dùng vòng lặp `foreach`.

## 3. Kiến trúc các lớp (Architecture)
- **Controller:** Tuyệt đối không gọi `AppDbContext` tại đây. Controller chỉ làm 3 việc: Nhận Request -> Gọi Service -> Trả Response.
- **Service:** Nơi chứa 100% logic xử lý nghiệp vụ, kiểm tra điều kiện và thao tác với Database.

## 4. Đặt tên biến (Naming Convention)
- Đặt tên biến rõ nghĩa, tiếng Anh hoặc tiếng Việt nhất quán. 
- Không đặt tên viết tắt đánh đố (Ví dụ: dùng `category` thay vì `c`, dùng `existingPosition` thay vì `exists`).

## 5. Kết quả trả về (Return Types)
- Các hàm Service nên trả về cấu trúc Tuple `(bool IsSuccess, string Message, object Data)` để Controller dễ dàng bóc tách và phản hồi cho Frontend.