const fs = require("fs");
const path = require("path");

const outputDir = path.join(__dirname, "..", "SO_DO_UML_THAM_KHAO", "DRAWIO");
fs.mkdirSync(outputDir, { recursive: true });

const esc = (value) => String(value)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

let id = 2;
const cells = [];
const add = (xml) => cells.push(xml);
const vertex = (value, x, y, w, h, style) => {
  const current = id++;
  add(`<mxCell id="${current}" value="${esc(value)}" style="${style}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`);
  return current;
};
const action = (value, x, y, w = 210, h = 58) => vertex(value, x, y, w, h,
  "rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1;fontColor=#000000;fontFamily=Arial;fontSize=12;align=center;verticalAlign=middle;");
const decision = (value, x, y, w = 140, h = 88) => vertex(value, x, y, w, h,
  "rhombus;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1;fontColor=#000000;fontFamily=Arial;fontSize=11;align=center;verticalAlign=middle;");
const edge = (source, target, label = "", points = []) => {
  const pointXml = points.length
    ? `<Array as="points">${points.map(([x, y]) => `<mxPoint x="${x}" y="${y}"/>`).join("")}</Array>` : "";
  add(`<mxCell id="${id++}" value="${esc(label)}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;strokeColor=#000000;strokeWidth=1;fontColor=#000000;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="${source}" target="${target}"><mxGeometry relative="1" as="geometry">${pointXml}</mxGeometry></mxCell>`);
};
const finalNode = (x, y) => {
  const outer = vertex("", x, y, 28, 28,
    "ellipse;html=1;aspect=fixed;fillColor=#ffffff;strokeColor=#000000;strokeWidth=2;");
  vertex("", x + 7, y + 7, 14, 14,
    "ellipse;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;");
  return outer;
};

vertex("Biểu đồ hoạt động – Tạo và quản lý CV trực tuyến", 80, 20, 1240, 42,
  "text;html=1;align=center;verticalAlign=middle;fontSize=20;fontStyle=1;fontFamily=Arial;fontColor=#000000;");

vertex("Ứng viên", 40, 85, 370, 2180,
  "swimlane;html=1;horizontal=1;startSize=42;fillColor=#ffffff;swimlaneFillColor=#ffffff;strokeColor=#000000;strokeWidth=1;fontStyle=1;fontFamily=Arial;fontSize=12;");
vertex("Giao diện tạo CV", 410, 85, 480, 2180,
  "swimlane;html=1;horizontal=1;startSize=42;fillColor=#ffffff;swimlaneFillColor=#ffffff;strokeColor=#000000;strokeWidth=1;fontStyle=1;fontFamily=Arial;fontSize=12;");
vertex("Hệ thống và cơ sở dữ liệu", 890, 85, 470, 2180,
  "swimlane;html=1;horizontal=1;startSize=42;fillColor=#ffffff;swimlaneFillColor=#ffffff;strokeColor=#000000;strokeWidth=1;fontStyle=1;fontFamily=Arial;fontSize=12;");

const start = vertex("", 210, 145, 24, 24,
  "ellipse;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;");
const openBuilder = action("Mở chức năng tạo CV trực tuyến", 115, 205, 220, 56);
const loadDraft = action("Tải bản nháp trên thiết bị; nếu đã đăng nhập thì tải danh sách CV trong tài khoản", 525, 315, 250, 76);
const source = decision("Chọn nguồn khởi tạo CV?", 150, 435, 140, 88);
const blankOrSample = action("Chọn CV trống hoặc điền nội dung mẫu", 105, 565, 230, 58);
const savedCv = action("Chọn một CV đã lưu", 105, 675, 230, 54);
const loadSaved = action("Kiểm tra quyền sở hữu và tải nội dung, thiết lập của CV", 1000, 665, 250, 70);
const normalize = action("Chuẩn hóa dữ liệu và hiển thị bản xem trước", 525, 790, 250, 62);
const edit = action("Nhập thông tin cá nhân, kinh nghiệm, học vấn, dự án, kỹ năng và chứng chỉ", 100, 910, 240, 76);
const customize = action("Tùy chỉnh mẫu, màu chữ, phông chữ, cỡ chữ, khung và thứ tự các mục", 515, 1025, 270, 76);
const autoSave = action("Cập nhật bản xem trước và tự lưu bản nháp trên thiết bị", 530, 1145, 240, 62);
const operation = decision("Chọn thao tác quản lý?", 150, 1260, 140, 88);

const validateSave = action("Kiểm tra biểu mẫu và tên CV", 535, 1385, 230, 58);
const loggedIn = decision("Đã đăng nhập tài khoản ứng viên?", 580, 1490, 140, 88);
const localOnly = action("Lưu bản nháp trên thiết bị và yêu cầu đăng nhập tài khoản ứng viên", 505, 1625, 260, 62);
const saveAccount = action("Xác định hoặc khởi tạo hồ sơ ứng viên; kiểm tra quyền sở hữu và giới hạn dữ liệu", 995, 1510, 260, 70);
const persist = action("Tạo mới hoặc cập nhật CV; CV đầu tiên được đặt làm mặc định", 995, 1635, 260, 76);
const refresh = action("Tải lại danh sách CV và thông báo lưu thành công", 520, 1765, 260, 62);

const setDefault = action("Đặt CV đang mở làm CV mặc định", 980, 1330, 270, 58);
const deleteCv = action("Xóa CV đang mở; nếu là CV mặc định thì chọn CV cập nhật gần nhất thay thế", 965, 1845, 285, 84);
const operationFailure = action("Thông báo lỗi và giữ nguyên nội dung đang chỉnh sửa", 505, 1865, 270, 58);
const resetEditor = action("Khởi tạo lại trình soạn thảo và tải lại danh sách CV", 520, 1955, 270, 62);

const validatePdf = action("Kiểm tra biểu mẫu và yêu cầu có email hoặc số điện thoại", 470, 2070, 300, 66);
const exportPdf = action("Tạo tệp PDF khổ A4 từ bản xem trước", 955, 2070, 270, 62);
const download = action("Tải CV xuống thiết bị", 115, 2100, 220, 54);

const endSave = finalNode(800, 1782);
const endDefault = finalNode(1285, 1345);
const endDelete = finalNode(800, 1972);
const endPdf = finalNode(210, 2205);

edge(start, openBuilder);
edge(openBuilder, loadDraft);
edge(loadDraft, source);
edge(source, blankOrSample, "[CV trống hoặc nội dung mẫu]");
edge(source, savedCv, "[CV đã lưu]");
edge(blankOrSample, normalize, "[Khởi tạo]");
edge(savedCv, loadSaved);
edge(loadSaved, normalize, "[Tìm thấy và thuộc sở hữu ứng viên]");
edge(normalize, edit);
edge(edit, customize);
edge(customize, autoSave);
edge(autoSave, operation);

edge(operation, validateSave, "[Lưu hoặc cập nhật]");
edge(validateSave, loggedIn);
edge(validateSave, edit, "[Dữ liệu không hợp lệ]", [[460, 1414], [460, 948]]);
edge(loggedIn, localOnly, "[Chưa đăng nhập]");
edge(localOnly, edit, "[Tiếp tục chỉnh sửa]", [[450, 1656], [450, 948]]);
edge(loggedIn, saveAccount, "[Đã đăng nhập]");
edge(saveAccount, persist, "[Dữ liệu hợp lệ]");
edge(saveAccount, operationFailure, "[Không thể lưu vào tài khoản]", [[940, 1545], [940, 1894]]);
edge(persist, refresh);
edge(refresh, endSave);

edge(operation, setDefault, "[Đặt mặc định và CV đã được lưu]", [[350, 1304], [350, 1300], [1115, 1300]]);
edge(setDefault, endDefault, "[Thuộc sở hữu ứng viên]");
edge(setDefault, operationFailure, "[Không tìm thấy hoặc không thuộc sở hữu]", [[1270, 1359], [1270, 1815], [640, 1815]]);

edge(operation, deleteCv, "[Xóa CV đã được lưu]", [[370, 1304], [370, 1887]]);
edge(deleteCv, resetEditor, "[Xóa thành công]");
edge(deleteCv, operationFailure, "[Không thể xóa]");
edge(resetEditor, endDelete);

edge(operation, validatePdf, "[Xuất PDF]", [[390, 1304], [390, 2103]]);
edge(validatePdf, exportPdf, "[Dữ liệu hợp lệ]");
edge(validatePdf, edit, "[Thiếu thông tin bắt buộc]", [[430, 2103], [430, 948]]);
edge(exportPdf, download, "[Tạo tệp thành công]");
edge(exportPdf, operationFailure, "[Không thể tạo tệp]", [[930, 2101], [930, 1894]]);
edge(download, endPdf);
edge(operationFailure, edit, "[Tiếp tục chỉnh sửa]", [[455, 1894], [455, 948]]);

const pageWidth = 1400;
const pageHeight = 2320;
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="app.diagrams.net" modified="2026-08-10T00:00:00.000Z" agent="Codex" version="24.7.17" type="device"><diagram id="uc05-activity" name="Page-1"><mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${pageWidth}" pageHeight="${pageHeight}" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join("")}</root></mxGraphModel></diagram></mxfile>`;

const output = path.join(outputDir, "UC05_Activity_Tao_va_quan_ly_CV_truc_tuyen.drawio");
fs.writeFileSync(output, xml, "utf8");
console.log(`Đã tạo ${output}`);
