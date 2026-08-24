const fs = require("fs");
const path = require("path");
const { sequenceDrawio } = require("./generate_uc01_drawio");

const outputDir = path.join(__dirname, "..", "SO_DO_UML_THAM_KHAO", "DRAWIO");
fs.mkdirSync(outputDir, { recursive: true });

const createEditSave = sequenceDrawio({
  title: "UC-05A – Khởi tạo, chỉnh sửa và lưu CV trực tuyến",
  actors: ["Ứng viên", "CvBuilderPage", "localStorage", "cvBuilderService", "CvBuilderDocumentsController", "AppDbContext"],
  messages: [
    { from: 0, to: 1, text: "Mở /candidate/cv-builder" },
    { from: 1, to: 2, text: "Đọc bản nháp CV và thiết lập giao diện" },
    { from: 2, to: 1, text: "Bản nháp hoặc dữ liệu trống", return: true },
    { from: 1, to: 1, text: "Kiểm tra token đăng nhập" },
    { from: 1, to: 3, text: "getAll()" },
    { from: 3, to: 4, text: "GET /api/cv-builder-documents" },
    { from: 4, to: 5, text: "Tìm ứng viên theo tài khoản; đọc danh sách CV" },
    { from: 5, to: 4, text: "Danh sách CV sắp xếp theo mặc định và thời gian cập nhật", return: true },
    { from: 4, to: 3, text: "200 OK", return: true },
    { from: 3, to: 1, text: "Danh sách CV", return: true },

    { from: 0, to: 1, text: "Chọn CV trống hoặc nội dung mẫu" },
    { from: 1, to: 1, text: "Khởi tạo biểu mẫu và thiết lập mặc định" },
    { from: 0, to: 1, text: "Chọn một CV đã lưu" },
    { from: 1, to: 3, text: "getById(id)" },
    { from: 3, to: 4, text: "GET /api/cv-builder-documents/{id}" },
    { from: 4, to: 5, text: "Tìm CV theo id và mã ứng viên" },
    { from: 5, to: 4, text: "Nội dung và thiết lập CV", return: true },
    { from: 4, to: 1, text: "200 OK; chuẩn hóa và điền biểu mẫu", return: true },

    { from: 0, to: 1, text: "Nhập nội dung và tùy chỉnh cách trình bày" },
    { from: 1, to: 1, text: "Cập nhật bản xem trước" },
    { from: 1, to: 2, text: "Tự lưu values và settings sau 600 ms" },
    { from: 0, to: 1, text: "Chọn Lưu vào tài khoản" },
    { from: 1, to: 1, text: "Kiểm tra biểu mẫu và tên CV" },

    { from: 1, to: 2, text: "Lưu bản nháp trên thiết bị" },
    { from: 1, to: 0, text: "Yêu cầu đăng nhập tài khoản ứng viên", return: true },

    { from: 1, to: 3, text: "create(name, content, settings)" },
    { from: 3, to: 4, text: "POST /api/cv-builder-documents" },
    { from: 4, to: 5, text: "Xác định hoặc tạo hồ sơ ứng viên" },
    { from: 4, to: 4, text: "Kiểm tra tên, cấu trúc và giới hạn dữ liệu" },
    { from: 4, to: 5, text: "Kiểm tra ứng viên đã có CV hay chưa" },
    { from: 4, to: 5, text: "Thêm CV; đặt mặc định nếu là CV đầu tiên; SaveChangesAsync()" },
    { from: 5, to: 4, text: "CV đã tạo", return: true },
    { from: 4, to: 1, text: "201 Created + chi tiết CV", return: true },

    { from: 1, to: 3, text: "update(id, name, content, settings)" },
    { from: 3, to: 4, text: "PUT /api/cv-builder-documents/{id}" },
    { from: 4, to: 5, text: "Tìm CV theo id và mã ứng viên" },
    { from: 4, to: 4, text: "Kiểm tra tên, cấu trúc và giới hạn dữ liệu" },
    { from: 4, to: 5, text: "Cập nhật nội dung, thiết lập, thời gian; SaveChangesAsync()" },
    { from: 5, to: 4, text: "CV đã cập nhật", return: true },
    { from: 4, to: 1, text: "200 OK + chi tiết CV", return: true },

    { from: 1, to: 3, text: "getAll() để làm mới danh sách" },
    { from: 1, to: 2, text: "Cập nhật bản nháp trên thiết bị" },
    { from: 1, to: 0, text: "Thông báo lưu thành công", return: true },
    { from: 1, to: 2, text: "Giữ bản nháp trên thiết bị" },
    { from: 1, to: 0, text: "Thông báo không thể lưu vào tài khoản", return: true },
  ],
  fragments: [
    { start: 4, end: 9, operator: "opt", firstGuard: "[Đã đăng nhập tài khoản ứng viên]" },
    { start: 10, end: 17, operator: "alt", firstGuard: "[Chọn CV trống hoặc nội dung mẫu]", dividers: [{ after: 11, label: "[Chọn CV đã lưu]" }] },
    { start: 23, end: 39, operator: "alt", firstGuard: "[Chưa đăng nhập]", dividers: [
      { after: 24, label: "[Đã đăng nhập và tạo CV mới]" },
      { after: 32, label: "[Đã đăng nhập và cập nhật CV hiện có]" },
    ] },
    { start: 40, end: 44, operator: "alt", firstGuard: "[Lưu vào tài khoản thành công]", dividers: [{ after: 42, label: "[API hoặc máy chủ trả lỗi]" }] },
  ],
});

const manageExport = sequenceDrawio({
  title: "UC-05B – Quản lý và xuất CV trực tuyến",
  actors: ["Ứng viên", "CvBuilderPage", "cvBuilderService", "CvBuilderDocumentsController", "AppDbContext", "html2pdf.js/Trình duyệt"],
  messages: [
    { from: 0, to: 1, text: "Chọn Đặt mặc định" },
    { from: 1, to: 2, text: "setDefault(id)" },
    { from: 2, to: 3, text: "PUT /api/cv-builder-documents/{id}/default" },
    { from: 3, to: 4, text: "Tìm ứng viên và đọc toàn bộ CV thuộc tài khoản" },
    { from: 3, to: 3, text: "Kiểm tra CV được chọn tồn tại" },
    { from: 3, to: 4, text: "Đặt đúng một CV mặc định; SaveChangesAsync()" },
    { from: 4, to: 3, text: "Hoàn tất", return: true },
    { from: 3, to: 1, text: "200 OK", return: true },
    { from: 1, to: 2, text: "getAll() để làm mới danh sách" },
    { from: 1, to: 0, text: "Thông báo đặt mặc định thành công", return: true },
    { from: 3, to: 1, text: "404 Không tìm thấy CV", return: true },
    { from: 1, to: 0, text: "Thông báo không thể đặt CV mặc định", return: true },

    { from: 0, to: 1, text: "Xác nhận xóa CV đang mở" },
    { from: 1, to: 2, text: "remove(id)" },
    { from: 2, to: 3, text: "DELETE /api/cv-builder-documents/{id}" },
    { from: 3, to: 4, text: "Tìm CV theo id và mã ứng viên" },
    { from: 3, to: 4, text: "Remove(CV); SaveChangesAsync()" },
    { from: 3, to: 4, text: "Tìm CV cập nhật gần nhất còn lại" },
    { from: 3, to: 4, text: "Đặt CV đó làm mặc định; SaveChangesAsync()" },
    { from: 3, to: 1, text: "204 No Content", return: true },
    { from: 1, to: 1, text: "Khởi tạo trình soạn thảo mới" },
    { from: 1, to: 2, text: "getAll() để làm mới danh sách" },
    { from: 1, to: 0, text: "Thông báo xóa thành công", return: true },
    { from: 3, to: 1, text: "404 Không tìm thấy CV", return: true },
    { from: 1, to: 0, text: "Thông báo không thể xóa CV", return: true },

    { from: 0, to: 1, text: "Chọn tải CV dạng PDF" },
    { from: 1, to: 1, text: "Kiểm tra biểu mẫu và email hoặc số điện thoại" },
    { from: 1, to: 1, text: "Sao chép vùng xem trước và chuẩn hóa khổ A4" },
    { from: 1, to: 5, text: "Tạo PDF với html2canvas và jsPDF" },
    { from: 5, to: 0, text: "Tải tệp PDF xuống thiết bị", return: true },
    { from: 5, to: 1, text: "Phát sinh lỗi tạo tệp", return: true },
    { from: 1, to: 0, text: "Hiển thị thông báo lỗi", return: true },
  ],
  fragments: [
    { start: 0, end: 11, operator: "alt", firstGuard: "[CV tồn tại và thuộc sở hữu ứng viên]", dividers: [{ after: 9, label: "[Không tìm thấy hoặc không thuộc sở hữu]" }] },
    { start: 12, end: 24, operator: "alt", firstGuard: "[Tìm thấy CV và xóa thành công]", dividers: [{ after: 22, label: "[Không tìm thấy hoặc không thuộc sở hữu]" }] },
    { start: 17, end: 18, operator: "opt", firstGuard: "[CV bị xóa là CV mặc định và vẫn còn CV khác]" },
    { start: 25, end: 31, operator: "alt", firstGuard: "[Biểu mẫu hợp lệ và tạo PDF thành công]", dividers: [{ after: 29, label: "[Thiếu thông tin hoặc thư viện tạo PDF phát sinh lỗi]" }] },
  ],
});

fs.writeFileSync(path.join(outputDir, "UC05A_Sequence_Khoi_tao_chinh_sua_va_luu_CV.drawio"), createEditSave, "utf8");
fs.writeFileSync(path.join(outputDir, "UC05B_Sequence_Quan_ly_va_xuat_CV.drawio"), manageExport, "utf8");
console.log("Đã tạo hai Sequence Diagram UC05.");
