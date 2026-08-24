const fs = require("fs");
const path = require("path");
const outputDir = path.join(__dirname, "..", "SO_DO_UML_THAM_KHAO", "DRAWIO");
fs.mkdirSync(outputDir, { recursive: true });

const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function graph(title, pageHeight, build) {
  let id = 2;
  const background = [];
  const content = [];
  const vertex = (value, x, y, w, h, style, layer = content) => {
    const current = id++;
    layer.push(`<mxCell id="${current}" value="${esc(value)}" style="${style}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`);
    return current;
  };
  const action = (value, x, y, w = 220, h = 58) => vertex(value, x, y, w, h,
    "rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1;fontColor=#000000;fontFamily=Arial;fontSize=12;align=center;verticalAlign=middle;");
  const decision = (value, x, y, w = 140, h = 88) => vertex(value, x, y, w, h,
    "rhombus;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1;fontColor=#000000;fontFamily=Arial;fontSize=11;align=center;verticalAlign=middle;");
  const edge = (source, target, label = "", points = []) => {
    const pointXml = points.length ? `<Array as="points">${points.map(([x, y]) => `<mxPoint x="${x}" y="${y}"/>`).join("")}</Array>` : "";
    content.push(`<mxCell id="${id++}" value="${esc(label)}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;strokeColor=#000000;strokeWidth=1;fontColor=#000000;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="${source}" target="${target}"><mxGeometry relative="1" as="geometry">${pointXml}</mxGeometry></mxCell>`);
  };
  const start = (x, y) => vertex("", x, y, 24, 24, "ellipse;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;");
  const end = (x, y) => {
    const outer = vertex("", x, y, 28, 28, "ellipse;html=1;aspect=fixed;fillColor=#ffffff;strokeColor=#000000;strokeWidth=2;");
    vertex("", x + 7, y + 7, 14, 14, "ellipse;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;");
    return outer;
  };
  vertex(title, 60, 20, 1080, 42, "text;html=1;align=center;verticalAlign=middle;fontSize=20;fontStyle=1;fontFamily=Arial;fontColor=#000000;");
  vertex("Ứng viên", 30, 85, 330, pageHeight - 125, "swimlane;html=1;horizontal=1;startSize=42;fillColor=#ffffff;swimlaneFillColor=#ffffff;strokeColor=#000000;fontStyle=1;fontFamily=Arial;fontSize=12;", background);
  vertex("Giao diện tạo CV", 360, 85, 440, pageHeight - 125, "swimlane;html=1;horizontal=1;startSize=42;fillColor=#ffffff;swimlaneFillColor=#ffffff;strokeColor=#000000;fontStyle=1;fontFamily=Arial;fontSize=12;", background);
  vertex("Hệ thống và cơ sở dữ liệu", 800, 85, 370, pageHeight - 125, "swimlane;html=1;horizontal=1;startSize=42;fillColor=#ffffff;swimlaneFillColor=#ffffff;strokeColor=#000000;fontStyle=1;fontFamily=Arial;fontSize=12;", background);
  build({ action, decision, edge, start, end });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="app.diagrams.net" agent="Codex" version="24.7.17"><diagram id="activity" name="Page-1"><mxGraphModel grid="1" gridSize="10" page="1" pageWidth="1200" pageHeight="${pageHeight}" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${background.join("")}${content.join("")}</root></mxGraphModel></diagram></mxfile>`;
}

const createFlow = graph("Biểu đồ hoạt động – Khởi tạo, chỉnh sửa và lưu CV trực tuyến", 1840, ({ action, decision, edge, start, end }) => {
  const s = start(185, 145);
  const open = action("Mở chức năng tạo CV trực tuyến", 85, 205, 225, 56);
  const load = action("Tải bản nháp trên thiết bị và danh sách CV trong tài khoản", 455, 315, 250, 66);
  const source = decision("Chọn nguồn CV?", 125, 430);
  const newCv = action("Chọn CV trống hoặc nội dung mẫu", 80, 560, 240, 58);
  const selected = action("Chọn CV đã lưu", 90, 665, 220, 54);
  const read = action("Kiểm tra quyền sở hữu và tải CV", 875, 655, 220, 62);
  const normalize = action("Chuẩn hóa dữ liệu và hiển thị bản xem trước", 465, 785, 230, 62);
  const edit = action("Nhập nội dung CV theo năm nhóm thông tin", 80, 910, 240, 62);
  const style = action("Tùy chỉnh mẫu, màu chữ, phông chữ, khung và thứ tự", 455, 1025, 250, 70);
  const draft = action("Cập nhật xem trước và tự lưu bản nháp trên thiết bị", 460, 1145, 240, 62);
  const save = decision("Lưu vào tài khoản?", 130, 1260);
  const keepLocal = action("Giữ bản nháp trên thiết bị", 80, 1395, 240, 54);
  const login = decision("Đã đăng nhập?", 510, 1380);
  const requireLogin = action("Yêu cầu đăng nhập; bản nháp vẫn được giữ", 450, 1515, 260, 62);
  const validate = action("Kiểm tra biểu mẫu, tên CV, tài khoản, quyền sở hữu và giới hạn dữ liệu", 850, 1380, 270, 78);
  const persist = action("Tạo mới hoặc cập nhật CV; tự đặt CV đầu tiên làm mặc định", 855, 1515, 260, 72);
  const result = action("Tải lại danh sách và thông báo kết quả", 465, 1635, 230, 58);
  const done = end(570, 1740);

  edge(s, open); edge(open, load); edge(load, source);
  edge(source, newCv, "[CV trống hoặc mẫu]"); edge(source, selected, "[CV đã lưu]");
  edge(newCv, normalize); edge(selected, read); edge(read, normalize, "[Tìm thấy và đúng chủ sở hữu]");
  edge(normalize, edit); edge(edit, style); edge(style, draft); edge(draft, save);
  edge(save, keepLocal, "[Không]"); edge(keepLocal, done, "[Kết thúc phiên chỉnh sửa]", [[200, 1700], [570, 1700]]);
  edge(save, login, "[Có]"); edge(login, requireLogin, "[Chưa đăng nhập]");
  edge(requireLogin, done); edge(login, validate, "[Đã đăng nhập]");
  edge(validate, persist, "[Hợp lệ]"); edge(validate, requireLogin, "[Không thể lưu]", [[825, 1419], [825, 1546]]);
  edge(persist, result); edge(result, done);
});

const manageFlow = graph("Biểu đồ hoạt động – Quản lý và xuất CV trực tuyến", 1780, ({ action, decision, edge, start, end }) => {
  const s = start(185, 145);
  const open = action("Mở danh sách CV trong tài khoản", 85, 205, 225, 56);
  const list = action("Xác thực ứng viên và tải các CV thuộc tài khoản", 855, 315, 260, 68);
  const chooseCv = action("Chọn một CV", 100, 440, 200, 52);
  const operation = decision("Chọn thao tác?", 510, 545);

  const openCv = action("Tải nội dung và thiết lập của CV", 845, 690, 260, 62);
  const show = action("Mở CV trong trình soạn thảo", 465, 800, 230, 56);
  const endOpen = end(570, 900);

  const setDefault = action("Bỏ trạng thái mặc định của các CV khác và đặt CV đã chọn làm mặc định", 845, 965, 270, 78);
  const endDefault = end(965, 1085);

  const remove = action("Xóa CV đã chọn", 870, 1160, 220, 56);
  const replacement = decision("CV bị xóa là CV mặc định?", 905, 1260, 150, 92);
  const selectLatest = action("Đặt CV cập nhật gần nhất làm mặc định", 845, 1395, 270, 62);
  const refresh = action("Khởi tạo trình soạn thảo và tải lại danh sách CV", 455, 1500, 250, 66);
  const endDelete = end(570, 1610);

  const validatePdf = action("Kiểm tra biểu mẫu và thông tin liên hệ", 445, 1160, 270, 62);
  const makePdf = action("Tạo tệp PDF khổ A4 từ bản xem trước", 445, 1280, 270, 62);
  const download = action("Tải CV xuống thiết bị", 85, 1410, 225, 54);
  const endPdf = end(185, 1510);

  edge(s, open); edge(open, list); edge(list, chooseCv); edge(chooseCv, operation);
  edge(operation, openCv, "[Mở CV]"); edge(openCv, show, "[Đúng chủ sở hữu]"); edge(show, endOpen);
  edge(operation, setDefault, "[Đặt mặc định]", [[760, 589], [760, 1004]]); edge(setDefault, endDefault);
  edge(operation, remove, "[Xóa]", [[780, 589], [780, 1188]]); edge(remove, replacement);
  edge(replacement, selectLatest, "[Có và vẫn còn CV khác]"); edge(replacement, refresh, "[Không hoặc không còn CV khác]", [[800, 1306], [800, 1533]]);
  edge(selectLatest, refresh); edge(refresh, endDelete);
  edge(operation, validatePdf, "[Xuất PDF]"); edge(validatePdf, makePdf, "[Có email hoặc số điện thoại]");
  edge(makePdf, download, "[Tạo tệp thành công]"); edge(download, endPdf);
});

fs.writeFileSync(path.join(outputDir, "UC05A_Activity_Khoi_tao_chinh_sua_va_luu_CV.drawio"), createFlow, "utf8");
fs.writeFileSync(path.join(outputDir, "UC05B_Activity_Quan_ly_va_xuat_CV.drawio"), manageFlow, "utf8");
console.log("Đã tạo hai Activity Diagram UC05 đã tách luồng.");
