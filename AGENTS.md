# Quy tắc làm việc của dự án RecruitInsightAI

Các quy tắc này áp dụng cho toàn bộ workspace. Mục tiêu là giúp mọi phiên làm việc tiếp nối đúng ngữ cảnh, không lặp lại lỗi cũ và không tuyên bố hoàn thành khi chưa kiểm chứng.

## 1. Việc bắt buộc trước khi sửa code

1. Đọc toàn bộ `PROJECT_CONTEXT.md`.
2. Đọc ít nhất 10 mục gần nhất trong `WORK_LOG.md`.
3. Kiểm tra trạng thái Git và giữ nguyên mọi thay đổi không liên quan của người dùng.
4. Xác định mã công việc trong backlog, phạm vi frontend/backend/AI/database và tiêu chí hoàn thành.
5. Kiểm tra code thực tế trước khi tin vào mô tả trong báo cáo hoặc lịch sử chat.

## 2. Quy tắc trong khi thực hiện

- Không ghi mật khẩu, API key, token, chuỗi kết nối, SSH private key hoặc dữ liệu cá nhân nhạy cảm vào code, log, commit hay tài liệu. Giá trị nhạy cảm phải được thay bằng `[REDACTED]`.
- Không tự ý thay đổi credential, dữ liệu thật, firewall, DNS hoặc thao tác phá huỷ. Chỉ hỏi người dùng khi liên quan đến bảo mật, mất dữ liệu hoặc quyết định nghiệp vụ quan trọng chưa thể suy ra từ code.
- Giao diện người dùng phải thống nhất tiếng Việt có dấu; tên kỹ thuật chỉ giữ tiếng Anh khi cần giải thích thuật toán.
- Khi thay đổi API phải kiểm tra đồng thời backend, frontend, DTO, validation, phân quyền, trạng thái rỗng, trạng thái lỗi và khả năng tương thích dữ liệu cũ.
- Khi thay đổi schema phải tạo migration, kiểm tra khả năng nâng cấp dữ liệu hiện có và ghi rõ cách rollback.
- Không dùng dữ liệu giả/fallback để trình bày như kết quả AI thật. Nếu có fallback, UI và log phải phân biệt rõ.
- Không khẳng định độ chính xác AI, hiệu năng hoặc khả năng chịu tải nếu chưa có phép đo và dữ liệu kiểm thử tương ứng.
- Local, Git và VPS là ba trạng thái khác nhau. Không ghi “đã deploy” nếu chưa kiểm tra container, migration, health/API và trang HTTPS trên VPS.

## 3. Nhật ký bắt buộc sau mỗi thay đổi có ý nghĩa

Phải thêm một mục mới ở đầu phần `Nhật ký thực hiện` trong `WORK_LOG.md`, gồm:

- Thời gian và mã công việc.
- Mục tiêu và phạm vi.
- Quyết định nghiệp vụ/kỹ thuật quan trọng.
- File đã thêm/sửa/xóa.
- API, database/migration, cấu hình bị ảnh hưởng.
- Lệnh kiểm thử và kết quả thực tế.
- Trạng thái Git/commit và VPS.
- Hạn chế, lỗi còn lại và bước tiếp theo.

Không được sửa lịch sử cũ để che lỗi. Nếu thông tin cũ sai, thêm mục đính chính mới.

## 4. Cập nhật bộ nhớ dự án

- Nếu phát hiện mới làm thay đổi kiến trúc, nghiệp vụ, ưu tiên hoặc tiêu chí nghiệm thu, cập nhật `PROJECT_CONTEXT.md` ngay trong cùng task.
- Trạng thái công việc chỉ dùng: `CHƯA LÀM`, `ĐANG LÀM`, `ĐÃ XONG`, `BỊ CHẶN`, `TẠM HOÃN`.
- Chỉ đánh dấu `ĐÃ XONG` khi code đã được kiểm thử tương xứng với rủi ro.
- Mỗi quyết định thay đổi phải có ngày, lý do và tác động; không xóa quyết định cũ.

## 5. Chuẩn hoàn thành chung

Một thay đổi chỉ hoàn thành khi đáp ứng các phần có liên quan:

1. Nghiệp vụ đúng và không tạo luồng mâu thuẫn.
2. Phân quyền đúng vai trò Admin/HR/Ứng viên/Khách.
3. Validation và thông báo lỗi rõ bằng tiếng Việt.
4. Frontend không trắng trang, có loading/empty/error state phù hợp.
5. Backend trả status code và payload nhất quán.
6. AI phân biệt thành công, phân tích một phần, không đủ dữ liệu và lỗi dịch vụ.
7. Test liên quan đã chạy và kết quả được ghi vào `WORK_LOG.md`.
8. Tài liệu/báo cáo được cập nhật nếu thay đổi khác với mô tả khóa luận.
