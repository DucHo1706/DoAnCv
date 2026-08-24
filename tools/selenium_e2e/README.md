# Selenium E2E cho RecruitInsightAI

Tool này thao tác trực tiếp trên Chrome/Edge như người dùng: đăng ký ứng viên, tải CV, nộp hồ sơ, bật quyền tìm kiếm, HR lưu Talent Pool, đăng lại tin, Admin duyệt và đọc dashboard. Tool không gọi API nghiệp vụ để tạo dữ liệu.

Mỗi lần chạy lưu ảnh lỗi, browser log, lỗi HTTP quan sát được, manifest và `report.json` tại `.local/selenium-e2e/<run-id>/`. Toàn bộ dữ liệu được ghi nhãn `synthetic_web_e2e` trong báo cáo; nhãn và ground truth không được chèn vào nội dung CV gửi cho AI.

## Cài đặt

```powershell
Python\venv\Scripts\python.exe -m pip install -r tools\selenium_e2e\requirements.txt
Copy-Item tools\selenium_e2e\.env.example tools\selenium_e2e\.env
```

Điền tài khoản kiểm thử vào `.env`. Tệp này bị `.gitignore` loại bỏ. Không đặt credential trong mã nguồn, tham số dòng lệnh hay WORK_LOG.

## Kiểm tra không ghi dữ liệu

```powershell
Python\venv\Scripts\python.exe tools\selenium_e2e\run.py doctor
Python\venv\Scripts\python.exe tools\selenium_e2e\run.py fixtures
Python\venv\Scripts\python.exe tools\selenium_e2e\run.py job-cv-fixtures
Python\venv\Scripts\python.exe tools\selenium_e2e\run.py audit-job-scores
```

`fixtures` tạo ma trận 15 CV chi tiết cho cùng một job benchmark, tối thiểu 900 từ/CV: 3 mức quan hệ CV–JD × 5 tình huống bằng chứng. Mỗi CV dùng một bố cục riêng trong 15 dạng DOCX/PDF, gồm nhiều bảng, ô gộp, hai cột, PDF text và PDF scan rõ/nhiễu/lệch. Manifest ghi `match_scenario`, `case_type` và điểm offline kỳ vọng để phát hiện batch bị thiên lệch trước khi nộp.

Các định dạng được xen kẽ ngay từ đầu batch. `E2E_SUBMIT_TIMEOUT_SECONDS` mặc định 180 giây vì PDF scan phải qua OCR; timeout này độc lập với thời gian chờ trang thông thường.

`audit-job-scores` đọc snapshot đã lưu theo từng `JobID`, đối chiếu với checkpoint 20 CV/job và tổng hợp phân bố điểm, extraction, bằng chứng tiêu chí, trạng thái phân tích sâu, Ngôn từ, STAR, phỏng vấn và red flag. Lệnh không gọi lại AI, không ghi database và không đưa tên/email/CV/đoạn trích vào report. Backend phải hỗ trợ bộ lọc `GET /api/Recruitment/hr/applications?jobId=...`; tool sẽ dừng nếu API trả lẫn hồ sơ của job khác.

`job-cv-fixtures` sinh ma trận 20 CV cho mỗi tin trong catalog. Hai mươi CV của cùng một tin có nội dung, tài khoản và bố cục khác nhau; bao phủ 20 tổng trọng số dự kiến: `0, 6, 8, 9, 12, 14, 15, 17, 20, 21, 23, 26, 29, 35, 41, 50, 55, 70, 85, 100`. Đây là nhãn kiểm thử nằm ngoài CV, không phải điểm AI được gán sẵn. Điểm thực tế vẫn do hệ thống tính từ tài liệu đã nộp.

Nếu Selenium Manager không tự tìm được driver, đặt `E2E_DRIVER_PATH` tới `chromedriver.exe` hoặc `msedgedriver.exe` tương ứng với `E2E_BROWSER`; không cần chép driver vào repository.

## Chạy qua giao diện có ghi dữ liệu

Chỉ bật `E2E_ALLOW_WRITES=true` sau khi kiểm tra đúng URL. Với URL không phải localhost phải xác nhận thêm `E2E_ALLOW_REMOTE_WRITES=true`.

```powershell
Python\venv\Scripts\python.exe tools\selenium_e2e\run.py seed-applications
Python\venv\Scripts\python.exe tools\selenium_e2e\run.py create-jobs
Python\venv\Scripts\python.exe tools\selenium_e2e\run.py seed-job-applications
Python\venv\Scripts\python.exe tools\selenium_e2e\run.py candidate-search
Python\venv\Scripts\python.exe tools\selenium_e2e\run.py repost
Python\venv\Scripts\python.exe tools\selenium_e2e\run.py dashboard
Python\venv\Scripts\python.exe tools\selenium_e2e\run.py portal-audit
```

- `seed-applications`: đăng ký 15 tài khoản ứng viên và nộp 15 CV qua modal ứng tuyển.
- `create-jobs`: HR tạo tối đa 24 tin IT chi tiết bằng form thật; mỗi tin có 8 tiêu chí cấu trúc tổng 100%. Nếu bật `E2E_APPROVE_CREATED_JOBS`, Admin đăng nhập và duyệt tiếp trên giao diện.
- `seed-job-applications`: đọc đúng `JobID` đã lưu bởi `create-jobs`, đăng ký 20 ứng viên riêng và nộp 20 CV khác nhau vào mỗi tin bằng giao diện thật. Mặc định mỗi lượt chỉ chạy một tin, dừng 5 giây giữa hai hồ sơ và ghi checkpoint sau từng CV; giữ nguyên `E2E_RUN_ID` rồi chạy lại để chuyển sang tin kế tiếp.
- `candidate-search`: ứng viên bật ba quyền riêng tư, sau đó HR tìm và lưu Talent Pool với taxonomy thật từ hệ thống.
- `repost`: HR chọn tin hết hạn, kiểm tra mô tả/yêu cầu được sao chép đủ rồi gửi duyệt; nếu có tài khoản Admin thì duyệt tiếp qua UI.
- `dashboard`: đọc chỉ số trong ngày của HR và Admin, không thay đổi dữ liệu.
- `portal-audit`: đăng nhập HR/Admin, mở toàn bộ route trong menu ở desktop, tablet và mobile; ghi thời gian tải, cảnh báo API và tràn ngang cấp trang. Lệnh chỉ đọc, không yêu cầu bật quyền ghi dữ liệu.
- `all`: chạy nối tiếp toàn bộ luồng; nên dùng sau khi từng kịch bản riêng đã đạt.

Đặt `E2E_JOB_COUNT` từ 1 đến 24. Nếu muốn tự xem và duyệt danh sách chờ duyệt, đặt `E2E_APPROVE_CREATED_JOBS=false`; lệnh `create-jobs` khi đó chỉ cần tài khoản HR. Luồng này không gọi seeder và không ghi SQL trực tiếp.

Thứ tự chạy ma trận lớn:

1. Chạy `create-jobs` với một `E2E_RUN_ID` cố định.
2. Duyệt các tin trên giao diện Admin nếu `E2E_APPROVE_CREATED_JOBS=false`.
3. Giữ nguyên `E2E_RUN_ID` và chạy `seed-job-applications` nhiều lần. `E2E_APPLICATION_JOB_BATCH_SIZE=1` là cấu hình an toàn; có thể tăng nhưng không nên tạo 480 tác vụ AI đồng thời.

Khi backend và AI/router đã kiểm tra khả năng xử lý đồng thời, có thể đặt `E2E_APPLICATION_WORKERS=3` và tăng `E2E_APPLICATION_JOB_BATCH_SIZE`. Mỗi worker dùng một trình duyệt và chỉ xử lý các job được phân riêng; checkpoint được khóa khi ghi. Giới hạn cứng là 4 worker để không vô tình tạo tải quá lớn trên máy local.

`job-progress.json` lưu `JobID` thật của phản hồi tạo tin; tool không tìm theo tiêu đề vì hệ thống có thể có nhiều đợt tuyển dụng trùng vị trí. `job-application-progress.json` lưu checkpoint và trạng thái từng hồ sơ. Manifest lưu mức bao phủ tiêu chí dự kiến riêng với kết quả AI để phục vụ đối chiếu sai lệch OCR, taxonomy hoặc mô hình.

Nếu lượt chạy bị gián đoạn, giữ nguyên `E2E_RUN_ID`. Tool sẽ thử đăng nhập tài khoản đã tồn tại thay vì tạo tên mới. Không xóa dữ liệu tự động vì thao tác xóa có thể làm mất dữ liệu ngoài phạm vi kiểm thử.

Mật khẩu ứng viên kiểm thử không được ghi vào checkpoint. Nếu tiếp tục một lượt cũ nhưng không còn mật khẩu đã dùng, đặt `E2E_CANDIDATE_BATCH_TAG` thành một mã lô mới (ví dụ `resume02`). Các hồ sơ đã hoàn tất vẫn được bỏ qua, còn hồ sơ chưa hoàn tất dùng tài khoản mới; không cần xóa tài khoản hoặc dữ liệu cũ.

## Chạy ma trận lớn mà không dùng chung quota Gemini

Local và VPS có thể đang dùng cùng Google project/API key, vì vậy không nên gọi Gemini cho toàn bộ 480 hồ sơ kiểm thử. Khởi động **riêng Python local** với `GEMINI_ENABLED=false` để toàn bộ luồng OCR, timeline, taxonomy và chấm tiêu chí cấu trúc vẫn chạy, còn các phần sinh bởi LLM được ghi rõ là fallback cục bộ:

```powershell
$env:GEMINI_ENABLED='false'
Python\venv\Scripts\python.exe Python\main.py
```

Biến này không sửa hoặc xóa API key. Sau khi tạo đủ dataset, khởi động lại Python local không đặt biến trên và chỉ chạy Gemini cho tập CV đại diện. Không dùng kết quả fallback để tuyên bố độ chính xác của Gemini.
