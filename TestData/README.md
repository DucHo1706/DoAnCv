# Dữ liệu kiểm thử tin tuyển dụng IT

Seeder này chỉ chạy khi bật cấu hình `EnableTestJobSeed=true`, mặc định tắt.
Không bật trong môi trường production.

## Cách chạy local

PowerShell:

```powershell
$env:EnableTestJobSeed = "true"
dotnet run --project .\RecruitmentBackend\RecruitmentBackend\RecruitmentBackend.csproj
```

Seeder sẽ tạo 16 vị trí IT khác nhau, mỗi vị trí một tin, phân bổ cấp bậc và
luân phiên giữa Hà Nội, TP. Hồ Chí Minh, Đà Nẵng, Cần Thơ. Tất cả tin bắt đầu ở trạng
thái `Pending`, có mô tả, yêu cầu, kỹ năng, mức lương và 5 tiêu chí đa dạng có
tổng trọng số 100%; Admin sẽ tự duyệt trên giao diện.

Tin test mới dùng hậu tố nội bộ trong mã bản ghi, còn mã hiển thị trên giao diện
được tạo từ phần GUID trung tính nên không lộ marker kỹ thuật. Chạy lại không tạo
bản ghi trùng. Fixture cũ dùng prefix nội bộ và có
marker `[TEST-DATA-IT]` được chuyển sang `Closed` để không còn là
bộ dữ liệu đang mở; không xóa bản ghi hay ứng viên liên quan. Dữ liệu
được tạo trực tiếp trong cơ sở dữ liệu local hiện cấu hình, vì vậy cần kiểm tra
connection string trước khi bật cờ.
