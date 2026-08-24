const fs = require("fs");
const path = require("path");

const outputDir = path.join(__dirname, "..", "SO_DO_UML_THAM_KHAO", "DRAWIO");
fs.mkdirSync(outputDir, { recursive: true });

const esc = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

let id = 2;
const cells = [];
const add = (xml) => cells.push(xml);

const vertex = (value, x, y, w, h, style) => {
  const current = id++;
  add(`<mxCell id="${current}" value="${esc(value)}" style="${style}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`);
  return current;
};

const action = (value, x, y, w = 180, h = 54) => vertex(
  value, x, y, w, h,
  "rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1;fontColor=#000000;fontFamily=Arial;fontSize=12;align=center;verticalAlign=middle;",
);

const decision = (value, x, y, w = 130, h = 82) => vertex(
  value, x, y, w, h,
  "rhombus;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1;fontColor=#000000;fontFamily=Arial;fontSize=11;align=center;verticalAlign=middle;",
);

const edge = (source, target, label = "", points = []) => {
  const pointXml = points.length
    ? `<Array as="points">${points.map(([x, y]) => `<mxPoint x="${x}" y="${y}"/>`).join("")}</Array>`
    : "";
  add(`<mxCell id="${id++}" value="${esc(label)}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;strokeColor=#000000;strokeWidth=1;fontColor=#000000;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="${source}" target="${target}"><mxGeometry relative="1" as="geometry">${pointXml}</mxGeometry></mxCell>`);
};

vertex("3.2.7.4 Biểu đồ hoạt động – Tạo, duyệt và công khai tin tuyển dụng", 80, 20, 1240, 42,
  "text;html=1;align=center;verticalAlign=middle;fontSize=20;fontStyle=1;fontFamily=Arial;fontColor=#000000;");

// Activity partitions: three vertical columns for an A4 portrait thesis page.
vertex("Nhà tuyển dụng", 40, 85, 380, 1900,
  "swimlane;html=1;horizontal=1;startSize=42;fillColor=#ffffff;swimlaneFillColor=#ffffff;strokeColor=#000000;strokeWidth=1;fontStyle=1;fontFamily=Arial;fontSize=12;");
vertex("Hệ thống", 420, 85, 560, 1900,
  "swimlane;html=1;horizontal=1;startSize=42;fillColor=#ffffff;swimlaneFillColor=#ffffff;strokeColor=#000000;strokeWidth=1;fontStyle=1;fontFamily=Arial;fontSize=12;");
vertex("Quản trị viên", 980, 85, 380, 1900,
  "swimlane;html=1;horizontal=1;startSize=42;fillColor=#ffffff;swimlaneFillColor=#ffffff;strokeColor=#000000;strokeWidth=1;fontStyle=1;fontFamily=Arial;fontSize=12;");

const start = vertex("", 218, 145, 24, 24,
  "ellipse;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;");
const enter = action("Nhập thông tin tin tuyển dụng và bộ tiêu chí", 125, 205, 210, 62);
const uiValid = decision("Dữ liệu giao diện hợp lệ?", 165, 315, 130, 82);
const showUiError = action("Hiển thị lỗi và yêu cầu chỉnh sửa", 115, 445, 230, 50);

const validate = action("Xác thực tài khoản; kiểm tra nhà tuyển dụng, vị trí công việc, mức lương và bộ tiêu chí", 575, 445, 250, 76);
const businessValid = decision("Dữ liệu nghiệp vụ hợp lệ?", 635, 570, 130, 82);
const return400 = action("Trả lỗi 400; không tạo tin", 475, 700, 190, 50);
const savePending = action("Lưu tin ở trạng thái Chờ phê duyệt và lưu bộ tiêu chí đánh giá", 720, 695, 210, 62);
const notifyAdmin = action("Thông báo quản trị viên có tin chờ phê duyệt", 595, 825, 210, 58);

const review = action("Mở chi tiết JD và bộ tiêu chí", 1065, 950, 210, 58);
const choose = decision("Quyết định xử lý?", 1105, 1065, 130, 82);
const rejectReason = action("Nhập lý do từ chối", 1075, 1200, 190, 50);

const publish = action("Cập nhật trạng thái Đang hoạt động và thời điểm phê duyệt", 485, 1335, 215, 70);
const reject = action("Cập nhật trạng thái Đã từ chối và lý do từ chối", 735, 1335, 215, 70);
const notifyRecruiter = action("Thông báo kết quả cho nhà tuyển dụng và ghi nhật ký hoạt động", 585, 1490, 230, 76);
const publicJob = action("Hiển thị tin trong danh sách việc làm công khai", 585, 1640, 230, 62);
const endPublished = vertex("", 686, 1770, 28, 28,
  "ellipse;html=1;aspect=fixed;fillColor=#ffffff;strokeColor=#000000;strokeWidth=2;");
vertex("", 693, 1777, 14, 14, "ellipse;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;");
const endRejected = vertex("", 886, 1648, 28, 28,
  "ellipse;html=1;aspect=fixed;fillColor=#ffffff;strokeColor=#000000;strokeWidth=2;");
vertex("", 893, 1655, 14, 14, "ellipse;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;");

edge(start, enter);
edge(enter, uiValid);
edge(uiValid, validate, "[Hợp lệ]", [[700, 356]]);
edge(uiValid, showUiError, "[Không hợp lệ]");
edge(showUiError, enter, "[Chỉnh sửa]", [[85, 470], [85, 236]]);
edge(validate, businessValid);
edge(businessValid, savePending, "[Hợp lệ]");
edge(businessValid, return400, "[Không hợp lệ]");
edge(return400, enter, "[Nhập lại]", [[450, 725], [380, 725], [380, 236]]);
edge(savePending, notifyAdmin);
edge(notifyAdmin, review, "[Thông báo thành công hoặc lỗi đã được ghi log]");
edge(review, choose);
edge(choose, publish, "[Phê duyệt và tin đang Chờ phê duyệt]", [[1030, 1106], [1030, 1300], [592, 1300]]);
edge(choose, rejectReason, "[Từ chối]");
edge(rejectReason, reject, "[Lý do khác rỗng và tin đang Chờ phê duyệt]", [[1170, 1295], [842, 1295]]);
edge(rejectReason, choose, "[Lý do rỗng]", [[1300, 1225], [1300, 1106]]);
edge(publish, notifyRecruiter, "[Duyệt thành công]");
edge(reject, notifyRecruiter, "[Từ chối thành công]");
edge(notifyRecruiter, publicJob, "[Trạng thái: Đang hoạt động]");
edge(publicJob, endPublished);
edge(notifyRecruiter, endRejected, "[Trạng thái: Đã từ chối]");

const pageWidth = 1400;
const pageHeight = 2040;
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="app.diagrams.net" modified="2026-08-10T00:00:00.000Z" agent="Codex" version="24.7.17" type="device"><diagram id="uc01-activity" name="Page-1"><mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${pageWidth}" pageHeight="${pageHeight}" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join("")}</root></mxGraphModel></diagram></mxfile>`;

const output = path.join(outputDir, "UC01_Activity_Tao_duyet_va_cong_khai_tin_tuyen_dung.drawio");
fs.writeFileSync(output, xml, "utf8");
console.log(`Đã tạo ${output}`);
