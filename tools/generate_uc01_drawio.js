const fs = require("fs");
const path = require("path");

const outputDir = path.join(__dirname, "..", "SO_DO_UML_THAM_KHAO", "DRAWIO");
fs.mkdirSync(outputDir, { recursive: true });

const esc = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;");

function sequenceDrawio({ title, actors, messages, fragments = [] }) {
  const pageWidth = Math.max(1600, actors.length * 250 + 160);
  const top = 130;
  const step = 64;
  const pageHeight = Math.max(1100, top + messages.length * step + 170);
  const gap = (pageWidth - 180) / (actors.length - 1);
  const xs = actors.map((_, index) => 90 + index * gap);
  let id = 2;
  const cells = [];
  const fragmentCells = [];
  const add = (xml) => cells.push(xml);
  const addFragment = (xml) => fragmentCells.push(xml);

  add(`<mxCell id="${id++}" value="${esc(title)}" style="text;html=1;align=center;verticalAlign=middle;fontSize=20;fontStyle=1;fontFamily=Arial;fontColor=#000000;" vertex="1" parent="1"><mxGeometry x="80" y="25" width="${pageWidth - 160}" height="40" as="geometry"/></mxCell>`);

  actors.forEach((actor, index) => {
    const x = xs[index];
    add(`<mxCell id="${id++}" value="${esc(actor)}" style="rounded=0;whiteSpace=wrap;html=1;align=center;verticalAlign=middle;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1;fontStyle=0;fontSize=12;fontFamily=Arial;fontColor=#000000;" vertex="1" parent="1"><mxGeometry x="${x - 90}" y="80" width="180" height="46" as="geometry"/></mxCell>`);
    add(`<mxCell id="${id++}" value="" style="edgeStyle=none;html=1;endArrow=none;startArrow=none;strokeWidth=1;dashed=1;dashPattern=4 4;strokeColor=#000000;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${x}" y="126" as="sourcePoint"/><mxPoint x="${x}" y="${pageHeight - 60}" as="targetPoint"/></mxGeometry></mxCell>`);
  });

  fragments.forEach((fragment) => {
    const y = top + fragment.start * step - 25;
    const height = (fragment.end - fragment.start + 1) * step + 48;
    addFragment(`<mxCell id="${id++}" value="${esc(fragment.operator || "alt")}" style="swimlane;html=1;startSize=26;horizontal=1;rounded=0;fillColor=#ffffff;swimlaneFillColor=#ffffff;opacity=100;fillOpacity=100;strokeColor=#000000;strokeWidth=1;fontStyle=1;fontSize=11;fontFamily=Arial;fontColor=#000000;" vertex="1" parent="1"><mxGeometry x="45" y="${y}" width="${pageWidth - 90}" height="${height}" as="geometry"/></mxCell>`);
    if (fragment.firstGuard) {
      addFragment(`<mxCell id="${id++}" value="${esc(fragment.firstGuard)}" style="text;html=1;align=left;verticalAlign=middle;fontSize=11;fontStyle=2;fontFamily=Arial;fontColor=#000000;labelBackgroundColor=#ffffff;" vertex="1" parent="1"><mxGeometry x="55" y="${y + 27}" width="500" height="22" as="geometry"/></mxCell>`);
    }
    const dividers = fragment.dividers || (fragment.dividerAfter !== undefined
      ? [{ after: fragment.dividerAfter, label: fragment.elseLabel || "[else]" }]
      : []);
    dividers.forEach((divider) => {
      const dividerY = top + (divider.after + 1) * step - 8;
      addFragment(`<mxCell id="${id++}" value="" style="edgeStyle=none;html=1;endArrow=none;startArrow=none;strokeWidth=1;dashed=1;dashPattern=5 5;strokeColor=#000000;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="45" y="${dividerY}" as="sourcePoint"/><mxPoint x="${pageWidth - 45}" y="${dividerY}" as="targetPoint"/></mxGeometry></mxCell>`);
      addFragment(`<mxCell id="${id++}" value="${esc(divider.label)}" style="text;html=1;align=left;verticalAlign=middle;fontSize=11;fontStyle=2;fontFamily=Arial;fontColor=#000000;labelBackgroundColor=#ffffff;" vertex="1" parent="1"><mxGeometry x="55" y="${dividerY + 2}" width="500" height="22" as="geometry"/></mxCell>`);
    });
  });

  messages.forEach((message, index) => {
    const y = top + index * step + 26;
    const fromX = xs[message.from];
    const toX = xs[message.to];
    const label = `${index + 1}. ${message.text}`;
    if (!message.return && fromX !== toX) {
      add(`<mxCell id="${id++}" value="" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1;" vertex="1" parent="1"><mxGeometry x="${toX - 5}" y="${y - 7}" width="10" height="30" as="geometry"/></mxCell>`);
    }
    if (fromX === toX) {
      add(`<mxCell id="${id++}" value="${esc(label)}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;jettySize=auto;orthogonalLoop=1;loopDirection=1;endArrow=block;endFill=1;strokeColor=#000000;strokeWidth=1;fontColor=#000000;fontSize=11;fontFamily=Arial;align=left;verticalAlign=bottom;labelBackgroundColor=#ffffff;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${fromX}" y="${y}" as="sourcePoint"/><mxPoint x="${fromX}" y="${y + 38}" as="targetPoint"/><Array as="points"><mxPoint x="${fromX + 72}" y="${y}"/><mxPoint x="${fromX + 72}" y="${y + 38}"/></Array></mxGeometry></mxCell>`);
    } else {
      const dashed = message.return ? "dashed=1;dashPattern=6 6;endArrow=open;endFill=0;" : "endArrow=block;endFill=1;";
      add(`<mxCell id="${id++}" value="${esc(label)}" style="edgeStyle=none;rounded=0;html=1;${dashed}strokeColor=#000000;strokeWidth=1;fontColor=#000000;fontSize=11;fontFamily=Arial;align=center;verticalAlign=bottom;labelBackgroundColor=#ffffff;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${fromX}" y="${y}" as="sourcePoint"/><mxPoint x="${toX}" y="${y}" as="targetPoint"/></mxGeometry></mxCell>`);
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="app.diagrams.net" modified="2026-08-10T00:00:00.000Z" agent="Codex" version="24.7.17" type="device"><diagram id="uc01" name="Page-1"><mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${pageWidth}" pageHeight="${pageHeight}" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${fragmentCells.join("")}${cells.join("")}</root></mxGraphModel></diagram></mxfile>`;
}

const createJob = sequenceDrawio({
  title: "UC-01A – Nhà tuyển dụng tạo tin tuyển dụng chờ duyệt",
  actors: ["CreateJobPage", "JobsController", "JobService", "AppDbContext", "NotificationService"],
  messages: [
    { from: 0, to: 0, text: "Kiểm tra trường bắt buộc và lập CreateJobRequest" },
    { from: 0, to: 1, text: "POST /api/jobs (CreateJobRequest)" },
    { from: 1, to: 1, text: "Kiểm tra ModelState và lấy accountId" },
    { from: 1, to: 2, text: "CreatePendingJobAsync(request, accountId)" },
    { from: 2, to: 3, text: "Tìm Recruiter theo AccountID" },
    { from: 3, to: 2, text: "Recruiter hoặc null", return: true },
    { from: 2, to: 3, text: "FindAsync(PositionId)" },
    { from: 3, to: 2, text: "Position hoặc null", return: true },
    { from: 2, to: 2, text: "Phân tích SalaryRange; chuẩn hóa min/max" },
    { from: 2, to: 2, text: "Kiểm tra tiêu chí: có dữ liệu, tên không rỗng, tổng trọng số = 100" },
    { from: 2, to: 3, text: "Add JobPosting (Status = Pending)" },
    { from: 2, to: 3, text: "AddRange JobCriteria" },
    { from: 2, to: 3, text: "SaveChangesAsync()" },
    { from: 2, to: 3, text: "Đọc danh sách tài khoản Admin" },
    { from: 3, to: 2, text: "Danh sách Admin", return: true },
    { from: 2, to: 4, text: "CreateNotificationAsync cho từng Admin" },
    { from: 2, to: 1, text: "Trả JobID", return: true },
    { from: 1, to: 0, text: "200 OK và id tin", return: true },
    { from: 0, to: 0, text: "Điều hướng về /recruiter/jobs" },
    { from: 2, to: 1, text: "Phát sinh lỗi kiểm tra dữ liệu", return: true },
    { from: 1, to: 0, text: "400 Bad Request và thông báo lỗi", return: true },
  ],
  fragments: [
    { start: 10, end: 20, operator: "alt", firstGuard: "[Recruiter, Position và bộ tiêu chí hợp lệ]", dividers: [{ after: 18, label: "[Recruiter, Position hoặc bộ tiêu chí không hợp lệ]" }] },
    { start: 15, end: 15, operator: "loop", firstGuard: "[Mỗi tài khoản Admin]" },
  ],
});

const reviewJob = sequenceDrawio({
  title: "UC-01B – Quản trị viên xem xét, duyệt hoặc từ chối tin tuyển dụng",
  actors: ["JobApprovalDetailPage", "JobsController", "JobService", "AppDbContext", "NotificationService", "AuditLogService"],
  messages: [
    { from: 0, to: 1, text: "GET /api/jobs/{id}/review" },
    { from: 1, to: 2, text: "ReviewJobAsync(id, accountId, isAdmin = true)" },
    { from: 2, to: 3, text: "Đọc JobPosting, JobCriteria và dữ liệu liên quan" },
    { from: 3, to: 2, text: "Chi tiết tin", return: true },
    { from: 2, to: 1, text: "JobReviewDto", return: true },
    { from: 1, to: 0, text: "200 OK + đầy đủ JD và tiêu chí", return: true },
    { from: 0, to: 1, text: "POST /api/jobs/{id}/approve" },
    { from: 1, to: 3, text: "FindAsync(id) để lấy tiêu đề ghi log" },
    { from: 1, to: 2, text: "ApproveJobAndSyncAiAsync(id)" },
    { from: 2, to: 3, text: "FindAsync(id); kiểm tra Status = Pending" },
    { from: 2, to: 3, text: "Đặt Status = Published, ApprovedAt = hiện tại; SaveChangesAsync()" },
    { from: 2, to: 3, text: "Tìm Recruiter và Position" },
    { from: 2, to: 4, text: "Thông báo tin đã được phê duyệt cho Recruiter" },
    { from: 2, to: 1, text: "true", return: true },
    { from: 1, to: 5, text: "WriteLogAsync hành động phê duyệt" },
    { from: 1, to: 0, text: "200 OK", return: true },
    { from: 0, to: 1, text: "POST /api/jobs/{id}/reject (reason)" },
    { from: 1, to: 1, text: "Kiểm tra reason không rỗng" },
    { from: 1, to: 3, text: "FindAsync(id) để lấy tiêu đề ghi log" },
    { from: 1, to: 2, text: "RejectJobAsync(id, reason)" },
    { from: 2, to: 3, text: "FindAsync(id); kiểm tra Status = Pending" },
    { from: 2, to: 3, text: "Đặt Status = Rejected, RejectReason = reason; SaveChangesAsync()" },
    { from: 2, to: 3, text: "Tìm Recruiter và Position" },
    { from: 2, to: 4, text: "Thông báo tin bị từ chối cho Recruiter" },
    { from: 2, to: 1, text: "true", return: true },
    { from: 1, to: 5, text: "WriteLogAsync hành động từ chối" },
    { from: 1, to: 0, text: "200 OK", return: true },
    { from: 1, to: 0, text: "400/404: lý do trống, không tìm thấy tin hoặc tin không còn Pending", return: true },
  ],
  fragments: [
    { start: 6, end: 27, operator: "alt", firstGuard: "[Admin chọn phê duyệt và tin đang ở trạng thái Pending]", dividers: [
      { after: 15, label: "[Admin từ chối – bắt buộc nhập lý do]" },
      { after: 26, label: "[Yêu cầu không hợp lệ hoặc trạng thái tin đã thay đổi]" },
    ] },
  ],
});

const createAndReviewJob = sequenceDrawio({
  title: "UC-01 – Tạo và duyệt tin tuyển dụng",
  actors: [
    "CreateJobPage",
    "JobsController",
    "JobService",
    "AppDbContext",
    "NotificationService",
    "JobApprovalDetailPage",
    "AuditLogService",
  ],
  messages: [
    { from: 0, to: 0, text: "Kiểm tra trường bắt buộc và lập CreateJobRequest" },
    { from: 0, to: 1, text: "POST /api/jobs (CreateJobRequest)" },
    { from: 1, to: 1, text: "Kiểm tra ModelState và lấy accountId" },
    { from: 1, to: 2, text: "CreatePendingJobAsync(request, accountId)" },
    { from: 2, to: 3, text: "Tìm Recruiter theo AccountID" },
    { from: 2, to: 3, text: "FindAsync(PositionId)" },
    { from: 2, to: 2, text: "Phân tích SalaryRange và chuẩn hóa min/max" },
    { from: 2, to: 2, text: "Kiểm tra tiêu chí: có dữ liệu, tên không rỗng, tổng trọng số = 100" },
    { from: 2, to: 3, text: "Add JobPosting (Status = Pending)" },
    { from: 2, to: 3, text: "AddRange JobCriteria" },
    { from: 2, to: 3, text: "SaveChangesAsync()" },
    { from: 2, to: 3, text: "Đọc danh sách tài khoản Admin" },
    { from: 2, to: 4, text: "CreateNotificationAsync cho từng Admin" },
    { from: 2, to: 1, text: "Trả JobID", return: true },
    { from: 1, to: 0, text: "200 OK và id tin", return: true },
    { from: 0, to: 0, text: "Điều hướng về /recruiter/jobs" },
    { from: 2, to: 1, text: "Phát sinh lỗi kiểm tra dữ liệu", return: true },
    { from: 1, to: 0, text: "400 Bad Request và thông báo lỗi", return: true },

    { from: 5, to: 1, text: "GET /api/jobs/{id}/review" },
    { from: 1, to: 2, text: "ReviewJobAsync(id, accountId, isAdmin = true)" },
    { from: 2, to: 3, text: "Đọc JobPosting, JobCriteria và dữ liệu liên quan" },
    { from: 3, to: 2, text: "Chi tiết tin", return: true },
    { from: 2, to: 1, text: "JobReviewDto", return: true },
    { from: 1, to: 5, text: "200 OK + đầy đủ JD và tiêu chí", return: true },

    { from: 5, to: 1, text: "POST /api/jobs/{id}/approve" },
    { from: 1, to: 3, text: "FindAsync(id) để lấy tiêu đề ghi log" },
    { from: 1, to: 2, text: "ApproveJobAndSyncAiAsync(id)" },
    { from: 2, to: 3, text: "FindAsync(id); kiểm tra Status = Pending" },
    { from: 2, to: 3, text: "Đặt Status = Published, ApprovedAt = hiện tại; SaveChangesAsync()" },
    { from: 2, to: 3, text: "Tìm Recruiter và Position" },
    { from: 2, to: 4, text: "Thông báo tin đã được phê duyệt cho Recruiter" },
    { from: 2, to: 1, text: "true", return: true },
    { from: 1, to: 6, text: "WriteLogAsync hành động phê duyệt" },
    { from: 1, to: 5, text: "200 OK", return: true },

    { from: 5, to: 1, text: "POST /api/jobs/{id}/reject (reason)" },
    { from: 1, to: 1, text: "Kiểm tra reason không rỗng" },
    { from: 1, to: 3, text: "FindAsync(id) để lấy tiêu đề ghi log" },
    { from: 1, to: 2, text: "RejectJobAsync(id, reason)" },
    { from: 2, to: 3, text: "FindAsync(id); kiểm tra Status = Pending" },
    { from: 2, to: 3, text: "Đặt Status = Rejected, RejectReason = reason; SaveChangesAsync()" },
    { from: 2, to: 3, text: "Tìm Recruiter và Position" },
    { from: 2, to: 4, text: "Thông báo tin bị từ chối cho Recruiter" },
    { from: 2, to: 1, text: "true", return: true },
    { from: 1, to: 6, text: "WriteLogAsync hành động từ chối" },
    { from: 1, to: 5, text: "200 OK", return: true },

    { from: 1, to: 5, text: "400/404: yêu cầu không hợp lệ hoặc tin không còn Pending", return: true },
  ],
  fragments: [
    {
      start: 8,
      end: 17,
      operator: "alt",
      firstGuard: "[Recruiter, Position và bộ tiêu chí hợp lệ]",
      dividers: [{ after: 15, label: "[Recruiter, Position hoặc bộ tiêu chí không hợp lệ]" }],
    },
    { start: 12, end: 12, operator: "loop", firstGuard: "[Mỗi tài khoản Admin]" },
    {
      start: 24,
      end: 45,
      operator: "alt",
      firstGuard: "[Admin chọn phê duyệt và tin đang ở trạng thái Pending]",
      dividers: [
        { after: 33, label: "[Admin chọn từ chối, lý do khác rỗng và tin đang Pending]" },
        { after: 44, label: "[Tin không tồn tại, không còn Pending hoặc lý do từ chối rỗng]" },
      ],
    },
  ],
});

fs.writeFileSync(path.join(outputDir, "UC01A_Sequence_Tao_tin_cho_duyet.drawio"), createJob, "utf8");
fs.writeFileSync(path.join(outputDir, "UC01B_Sequence_Admin_duyet_tu_choi.drawio"), reviewJob, "utf8");
fs.writeFileSync(path.join(outputDir, "UC01_Sequence_Tao_va_duyet_tin_tuyen_dung.drawio"), createAndReviewJob, "utf8");

console.log(`Đã tạo các sơ đồ UC01 draw.io tại ${outputDir}`);

module.exports = { sequenceDrawio };
