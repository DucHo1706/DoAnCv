const fs = require("fs");
const path = require("path");

const outputDir = path.join(__dirname, "..", "SO_DO_UML_THAM_KHAO");
fs.mkdirSync(outputDir, { recursive: true });

const esc = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const wrap = (text, max = 28) => {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > max && line) {
      lines.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines;
};

const textBlock = (x, y, text, options = {}) => {
  const { anchor = "middle", size = 14, weight = 500, color = "#0F172A", max = 30, lineHeight = 18 } = options;
  const lines = wrap(text, max);
  return `<text x="${x}" y="${y - ((lines.length - 1) * lineHeight) / 2}" text-anchor="${anchor}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${esc(line)}</tspan>`).join("")}</text>`;
};

const marker = `<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#334155"/></marker><marker id="returnArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#64748B"/></marker></defs>`;

function save(name, content) {
  fs.writeFileSync(path.join(outputDir, name), content, "utf8");
}

function activitySvg(title, lanes, steps, decisions = []) {
  const width = 1500;
  const laneWidth = width / lanes.length;
  const height = 180 + steps.length * 120;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${marker}<rect width="100%" height="100%" fill="#FFFFFF"/><text x="750" y="48" text-anchor="middle" font-family="Arial" font-size="25" font-weight="700" fill="#0F172A">${esc(title)}</text>`;
  lanes.forEach((lane, index) => {
    const x = index * laneWidth;
    svg += `<rect x="${x}" y="75" width="${laneWidth}" height="${height - 95}" fill="${index % 2 ? "#F8FAFC" : "#FFFFFF"}" stroke="#CBD5E1"/><rect x="${x}" y="75" width="${laneWidth}" height="54" fill="#EFF6FF" stroke="#CBD5E1"/>${textBlock(x + laneWidth / 2, 107, lane, { size: 16, weight: 700, max: 24 })}`;
  });
  const points = [];
  steps.forEach((step, index) => {
    const x = step.lane * laneWidth + laneWidth / 2;
    const y = 170 + index * 112;
    points.push({ x, y });
    if (step.type === "start" || step.type === "end") {
      svg += `<circle cx="${x}" cy="${y}" r="${step.type === "start" ? 13 : 17}" fill="${step.type === "start" ? "#2563EB" : "#FFFFFF"}" stroke="#2563EB" stroke-width="3"/>${step.type === "end" ? `<circle cx="${x}" cy="${y}" r="10" fill="#2563EB"/>` : ""}`;
    } else if (step.type === "decision") {
      svg += `<polygon points="${x},${y - 34} ${x + 70},${y} ${x},${y + 34} ${x - 70},${y}" fill="#FFF7ED" stroke="#F59E0B" stroke-width="2"/>${textBlock(x, y + 4, step.text, { size: 12, weight: 650, max: 18, lineHeight: 14 })}`;
    } else {
      svg += `<rect x="${x - 125}" y="${y - 34}" width="250" height="68" rx="12" fill="#FFFFFF" stroke="#2563EB" stroke-width="2"/>${textBlock(x, y + 4, step.text, { size: 13, weight: 600, max: 27, lineHeight: 16 })}`;
    }
    if (index > 0) {
      const previous = points[index - 1];
      svg += `<path d="M ${previous.x} ${previous.y + 38} L ${previous.x} ${y - 55} L ${x} ${y - 55} L ${x} ${y - 38}" fill="none" stroke="#334155" stroke-width="2" marker-end="url(#arrow)"/>`;
    }
  });
  for (const decision of decisions) {
    const from = points[decision.from];
    const to = points[decision.to];
    const offset = decision.offset || 145;
    svg += `<path d="M ${from.x + 70} ${from.y} L ${from.x + offset} ${from.y} L ${from.x + offset} ${to.y} L ${to.x + 130} ${to.y}" fill="none" stroke="#DC2626" stroke-width="2" marker-end="url(#arrow)"/>${textBlock(from.x + offset / 2 + 25, from.y - 10, decision.label, { size: 12, weight: 700, color: "#DC2626", max: 14 })}`;
  }
  return svg + `</svg>`;
}

function sequenceSvg(title, actors, messages, alternatives = []) {
  const width = Math.max(1500, actors.length * 205 + 100);
  const actorGap = (width - 120) / (actors.length - 1);
  const height = 190 + messages.length * 72 + alternatives.length * 70;
  const xs = actors.map((_, index) => 60 + index * actorGap);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${marker}<rect width="100%" height="100%" fill="#FFFFFF"/><text x="${width / 2}" y="42" text-anchor="middle" font-family="Arial" font-size="25" font-weight="700" fill="#0F172A">${esc(title)}</text>`;
  actors.forEach((actor, index) => {
    svg += `<rect x="${xs[index] - 80}" y="70" width="160" height="56" rx="8" fill="#EFF6FF" stroke="#2563EB" stroke-width="2"/>${textBlock(xs[index], 103, actor, { size: 13, weight: 700, max: 20, lineHeight: 15 })}<line x1="${xs[index]}" y1="126" x2="${xs[index]}" y2="${height - 35}" stroke="#94A3B8" stroke-width="2" stroke-dasharray="7 6"/>`;
  });
  messages.forEach((message, index) => {
    const y = 165 + index * 70;
    const from = xs[message.from];
    const to = xs[message.to];
    const isReturn = message.return === true;
    if (!isReturn) {
      svg += `<rect x="${to - 6}" y="${y - 8}" width="12" height="36" fill="#DBEAFE" stroke="#2563EB" stroke-width="1.5"/>`;
    }
    if (from === to) {
      svg += `<path d="M ${from} ${y} H ${from + 72} V ${y + 30} H ${from + 7}" fill="none" stroke="#334155" stroke-width="2" marker-end="url(#arrow)"/>${textBlock(from + 84, y + 6, `${index + 1}. ${message.text}`, { anchor: "start", size: 12, weight: 600, max: 30, lineHeight: 14 })}`;
    } else {
      svg += `<line x1="${from}" y1="${y}" x2="${to}" y2="${y}" stroke="${isReturn ? "#64748B" : "#334155"}" stroke-width="2" ${isReturn ? 'stroke-dasharray="7 5"' : ""} marker-end="url(#${isReturn ? "returnArrow" : "arrow"})"/>${textBlock((from + to) / 2, y - 12, `${index + 1}. ${message.text}`, { size: 12, weight: 600, max: 34, lineHeight: 14 })}`;
    }
  });
  alternatives.forEach((alt, index) => {
    const y = 150 + (alt.after + 1) * 70 + index * 64;
    svg += `<rect x="38" y="${y}" width="${width - 76}" height="52" fill="#FFF7ED" fill-opacity="0.72" stroke="#F59E0B" stroke-width="2"/><path d="M 38 ${y} H 112 L 96 ${y + 25} H 38 Z" fill="#F59E0B"/>${textBlock(68, y + 17, "alt", { size: 12, weight: 800, color: "#FFFFFF", max: 6 })}${textBlock(122, y + 30, `[điều kiện] ${alt.text}`, { anchor: "start", size: 12, weight: 650, max: 125 })}`;
  });
  return svg + `</svg>`;
}

save("01_Activity_UC01_Tao_va_duyet_tin.svg", activitySvg(
  "UC-01 – Tạo, duyệt và công khai tin tuyển dụng",
  ["Nhà tuyển dụng", "Backend", "Quản trị viên", "Thông báo"],
  [
    { lane: 0, type: "start" },
    { lane: 1, text: "Xác thực Recruiter và tải danh mục được phép" },
    { lane: 0, text: "Nhập JD, lương, số lượng và hạn nộp" },
    { lane: 0, text: "Chọn lĩnh vực, vị trí, cấp bậc và chi nhánh" },
    { lane: 0, text: "Khai báo tiêu chí ASK, trọng số và mức bắt buộc" },
    { lane: 0, type: "decision", text: "Dữ liệu phía giao diện hợp lệ?" },
    { lane: 1, text: "Kiểm tra quyền chi nhánh, hạn nộp và khoảng lương" },
    { lane: 1, text: "Kiểm tra tiêu chí và tổng trọng số" },
    { lane: 1, type: "decision", text: "Dữ liệu nghiệp vụ hợp lệ?" },
    { lane: 1, text: "Bắt đầu giao dịch dữ liệu" },
    { lane: 1, text: "Lưu JobPosting = Pending và JobCriteria" },
    { lane: 1, type: "decision", text: "Lưu thành công?" },
    { lane: 1, text: "Commit giao dịch và ghi AuditLog" },
    { lane: 3, text: "Thông báo Admin có tin chờ duyệt" },
    { lane: 2, text: "Xem đầy đủ JD và bộ tiêu chí" },
    { lane: 2, type: "decision", text: "Phê duyệt?" },
    { lane: 2, text: "Nhập lý do nếu từ chối" },
    { lane: 1, text: "Cập nhật Published hoặc Rejected" },
    { lane: 1, text: "Lưu người duyệt, thời điểm, lý do và AuditLog" },
    { lane: 3, text: "Thông báo kết quả cho nhà tuyển dụng" },
    { lane: 1, type: "decision", text: "Published?" },
    { lane: 1, text: "Đưa tin vào danh sách việc làm công khai" },
    { lane: 0, type: "end" },
  ],
  [
    { from: 5, to: 2, label: "Không: sửa dữ liệu", offset: 165 },
    { from: 8, to: 2, label: "Không: trả lỗi", offset: 185 },
    { from: 11, to: 9, label: "Không: rollback", offset: 175 },
    { from: 20, to: 22, label: "Không công khai", offset: 170 },
  ]
));

save("02_Activity_UC04_Tu_choi_Talent_Pool.svg", activitySvg(
  "UC-04 – Từ chối hồ sơ và cập nhật Talent Pool",
  ["Nhà tuyển dụng", "Backend", "Cơ sở dữ liệu", "Thông báo"],
  [
    { lane: 0, type: "start" },
    { lane: 0, text: "Chọn hồ sơ và nhập lý do từ chối" },
    { lane: 1, text: "Kiểm tra quyền và trạng thái đơn" },
    { lane: 1, type: "decision", text: "Được phép?" },
    { lane: 2, text: "Cập nhật Application = Rejected" },
    { lane: 2, text: "Tạo/cập nhật TalentPoolCandidate" },
    { lane: 2, text: "Lưu Interaction và AuditLog" },
    { lane: 3, text: "Gửi email và thông báo ứng viên" },
    { lane: 0, type: "end" },
  ],
  [{ from: 3, to: 1, label: "Không", offset: 170 }]
));

save("03_Sequence_UC02_Nop_CV_AI.svg", sequenceSvg(
  "UC-02 – Nộp hồ sơ và đánh giá CV bằng AI",
  ["CandidatePage", "RecruitmentController", "ApplicationService", "SQL Server", "AI Service", "FastAPI/OCR/Gemini", "NotificationHub"],
  [
    { from: 0, to: 1, text: "POST hồ sơ và phương thức chọn CV" },
    { from: 1, to: 2, text: "ApplyAsync(request, accountId)" },
    { from: 2, to: 3, text: "Kiểm tra tin, ứng viên và nộp trùng" },
    { from: 2, to: 2, text: "Kiểm tra định dạng, chữ ký và nội dung tệp" },
    { from: 2, to: 3, text: "Lưu CV và Application trạng thái Applied" },
    { from: 2, to: 4, text: "Yêu cầu trích xuất và đánh giá" },
    { from: 4, to: 5, text: "Phân tích CV, JD và tiêu chí" },
    { from: 5, to: 4, text: "FitScore, bằng chứng hoặc lỗi dữ liệu", return: true },
    { from: 4, to: 3, text: "Lưu AIEvaluation và trạng thái" },
    { from: 2, to: 6, text: "Phát thông báo kết quả" },
    { from: 1, to: 0, text: "Trả kết quả tiếp nhận", return: true },
  ],
  [{ after: 7, text: "Thành công: lưu điểm | OCR không đủ: Chưa thể đánh giá | AI_ERROR: giữ hồ sơ và hiển thị lỗi" }]
));

save("04_Sequence_UC01_Tao_va_duyet_tin.svg", sequenceSvg(
  "UC-01 – Tạo tin và phê duyệt tin tuyển dụng",
  ["RecruiterPage", "JobController", "JobService", "SQL Server", "AdminPage", "Notification/Audit"],
  [
    { from: 0, to: 1, text: "GET danh mục và chi nhánh được phân quyền" },
    { from: 1, to: 2, text: "LoadCreateOptions(accountId)" },
    { from: 2, to: 3, text: "Đọc Category, Position, JobLevel, Branch" },
    { from: 3, to: 0, text: "Trả dữ liệu tạo tin", return: true },
    { from: 0, to: 0, text: "Nhập JD, tiêu chí ASK và kiểm tra giao diện" },
    { from: 0, to: 1, text: "POST JobPosting và JobCriteria" },
    { from: 1, to: 2, text: "CreateJobAsync(request, accountId)" },
    { from: 2, to: 2, text: "Xác thực Recruiter, quyền chi nhánh và dữ liệu" },
    { from: 2, to: 2, text: "Kiểm tra tiêu chí, trọng số, lương và deadline" },
    { from: 2, to: 3, text: "BEGIN TRANSACTION" },
    { from: 2, to: 3, text: "INSERT JobPosting(Status=Pending)" },
    { from: 2, to: 3, text: "INSERT toàn bộ JobCriteria" },
    { from: 2, to: 3, text: "COMMIT hoặc ROLLBACK" },
    { from: 2, to: 5, text: "Ghi AuditLog và thông báo Admin" },
    { from: 1, to: 0, text: "Trả kết quả tạo tin", return: true },
    { from: 4, to: 1, text: "GET chi tiết tin chờ duyệt" },
    { from: 1, to: 3, text: "Đọc JobPosting và JobCriteria" },
    { from: 3, to: 4, text: "Trả đầy đủ JD và tiêu chí", return: true },
    { from: 4, to: 1, text: "PUT phê duyệt hoặc từ chối kèm lý do" },
    { from: 1, to: 2, text: "ReviewJobAsync(jobId, decision)" },
    { from: 2, to: 3, text: "Cập nhật status, ApprovedBy/At, RejectReason" },
    { from: 2, to: 5, text: "Ghi AuditLog và thông báo Recruiter" },
    { from: 1, to: 4, text: "Trả trạng thái mới", return: true },
  ],
  [
    { after: 8, text: "Dữ liệu không hợp lệ hoặc ngoài quyền chi nhánh: trả 400/403, không mở giao dịch" },
    { after: 12, text: "Lỗi lưu tiêu chí: rollback toàn bộ JobPosting và JobCriteria" },
    { after: 19, text: "Phê duyệt: Published và công khai | Từ chối: bắt buộc lý do, Rejected và không công khai" },
  ]
));

save("05_Sequence_UC03_Xep_hang_so_sanh.svg", sequenceSvg(
  "UC-03 – Xếp hạng và so sánh ứng viên",
  ["RankingPage", "ComparisonController", "ComparisonService", "SQL Server"],
  [
    { from: 0, to: 1, text: "Chọn tin và bộ lọc" },
    { from: 1, to: 2, text: "GetRankingAsync(jobId, filters)" },
    { from: 2, to: 3, text: "Đọc Application, CV và AIEvaluation" },
    { from: 3, to: 2, text: "Danh sách trong phạm vi phụ trách", return: true },
    { from: 2, to: 2, text: "Lọc và sắp xếp theo FitScore" },
    { from: 2, to: 0, text: "Trả bảng xếp hạng", return: true },
    { from: 0, to: 1, text: "Chọn từ hai ứng viên để so sánh" },
    { from: 1, to: 2, text: "CompareAsync(applicationIds)" },
    { from: 2, to: 3, text: "Đọc tiêu chí, điểm và bằng chứng" },
    { from: 2, to: 0, text: "Trả ma trận so sánh", return: true },
  ],
  [{ after: 6, text: "Không đủ hai hồ sơ hoặc AI chưa hoàn tất: từ chối so sánh và giải thích trạng thái" }]
));

save("06_Sequence_UC04_Tu_choi_Talent_Pool.svg", sequenceSvg(
  "UC-04 – Từ chối hồ sơ và cập nhật Talent Pool",
  ["RecruiterPage", "RecruitmentController", "ApplicationService", "SQL Server", "Notification/Email", "SignalR"],
  [
    { from: 0, to: 1, text: "Gửi ApplicationId, lý do và ghi chú" },
    { from: 1, to: 2, text: "RejectApplicationAsync" },
    { from: 2, to: 3, text: "Kiểm tra quyền và trạng thái đơn" },
    { from: 2, to: 3, text: "Begin transaction" },
    { from: 2, to: 3, text: "Cập nhật Application = Rejected" },
    { from: 2, to: 3, text: "Upsert TalentPoolCandidate" },
    { from: 2, to: 3, text: "Thêm Interaction và AuditLog; commit" },
    { from: 2, to: 4, text: "Gửi thông báo và email" },
    { from: 2, to: 5, text: "Phát trạng thái mới" },
    { from: 1, to: 0, text: "Trả kết quả xử lý", return: true },
  ],
  [{ after: 6, text: "Nếu gửi email lỗi: giữ kết quả từ chối đã commit, ghi log lỗi và cho phép gửi lại" }]
));

save("07_Activity_UC05_Tao_quan_ly_CV.svg", activitySvg(
  "UC-05 – Tạo và quản lý CV trực tuyến",
  ["Ứng viên", "CvBuilderPage", "Backend API", "Cơ sở dữ liệu", "Trang việc làm"],
  [
    { lane: 0, type: "start" },
    { lane: 1, text: "Tải bản nháp cục bộ và danh sách CV tài khoản" },
    { lane: 0, type: "decision", text: "Chọn nguồn CV?" },
    { lane: 0, text: "CV trống, nội dung mẫu hoặc CV đã lưu" },
    { lane: 1, text: "Chuẩn hóa dữ liệu cũ và các danh sách null" },
    { lane: 0, text: "Nhập cá nhân, kinh nghiệm, học vấn, dự án, chứng chỉ" },
    { lane: 1, text: "Giữ toàn bộ trường của năm bước trong form" },
    { lane: 0, text: "Tùy chỉnh mẫu, màu, font, cỡ chữ, khung và thứ tự" },
    { lane: 1, text: "Cập nhật bản xem trước A4" },
    { lane: 1, text: "Tự lưu Content và Settings vào localStorage" },
    { lane: 0, type: "decision", text: "Chọn thao tác?" },
    { lane: 0, text: "Lưu mới hoặc cập nhật CV" },
    { lane: 1, text: "Kiểm tra họ tên, tên CV và dữ liệu bắt buộc" },
    { lane: 2, text: "Xác thực Candidate và quyền sở hữu" },
    { lane: 2, text: "Kiểm tra kiểu và giới hạn ContentJson/SettingsJson" },
    { lane: 3, text: "Insert/Update CvBuilderDocument" },
    { lane: 0, text: "Mở, đổi tên, sửa hoặc xóa CV" },
    { lane: 0, type: "decision", text: "Đặt mặc định?" },
    { lane: 3, text: "Bỏ mặc định CV khác và đặt CV đã chọn" },
    { lane: 0, type: "decision", text: "Xuất PDF?" },
    { lane: 1, text: "Sao chép preview, bỏ zoom/khung và chuẩn hóa A4" },
    { lane: 1, text: "Kết xuất và tải PDF; dọn vùng render tạm" },
    { lane: 4, text: "Mở chi tiết việc làm và danh sách CV" },
    { lane: 0, text: "Chọn CV mặc định, CV đã lưu hoặc tệp mới" },
    { lane: 2, text: "Kiểm tra CV thuộc đúng Candidate" },
    { lane: 2, text: "Chuyển CV sang UC-02 để ứng tuyển và đánh giá" },
    { lane: 0, type: "end" },
  ],
  [
    { from: 12, to: 5, label: "Thiếu dữ liệu", offset: 165 },
    { from: 17, to: 16, label: "Lỗi: giữ trạng thái", offset: 170 },
    { from: 24, to: 23, label: "Không thuộc quyền", offset: 175 },
  ]
));

save("08_Sequence_UC05_Tao_luu_su_dung_CV.svg", sequenceSvg(
  "UC-05 – Tạo, lưu và sử dụng CV trực tuyến",
  ["CvBuilderPage", "CvBuilderService", "CvBuilderController", "AppDbContext", "SQL Server", "JobDetail/Apply"],
  [
    { from: 0, to: 0, text: "loadDraft(): đọc Content và Settings từ localStorage" },
    { from: 0, to: 1, text: "GET /cv-builder-documents" },
    { from: 1, to: 2, text: "GetMyDocuments(accountId)" },
    { from: 2, to: 3, text: "Tìm Candidate theo tài khoản" },
    { from: 3, to: 4, text: "SELECT tài liệu thuộc CandidateId" },
    { from: 4, to: 0, text: "Trả danh sách CV", return: true },
    { from: 0, to: 0, text: "Nhập năm bước; normalize và tự lưu localStorage" },
    { from: 0, to: 0, text: "Cập nhật template, settings và preview A4" },
    { from: 0, to: 1, text: "POST/PUT name, ContentJson, SettingsJson" },
    { from: 1, to: 2, text: "Create/Update document" },
    { from: 2, to: 2, text: "Xác thực Candidate, ownership và giới hạn JSON" },
    { from: 2, to: 3, text: "Add/Update CvBuilderDocument" },
    { from: 3, to: 4, text: "INSERT/UPDATE và SaveChanges" },
    { from: 4, to: 0, text: "Trả tài liệu đã lưu", return: true },
    { from: 0, to: 1, text: "PUT /set-default/{id}" },
    { from: 1, to: 2, text: "SetDefaultDocument(accountId, id)" },
    { from: 2, to: 4, text: "Transaction: bỏ cờ cũ, đặt IsDefault=true" },
    { from: 0, to: 0, text: "Clone preview, reset zoom/frame và html2pdf.save()" },
    { from: 5, to: 2, text: "GET /candidate-cvs" },
    { from: 2, to: 4, text: "SELECT CV thuộc CandidateId" },
    { from: 4, to: 5, text: "Trả CV mặc định và CV đã lưu", return: true },
    { from: 5, to: 2, text: "POST apply với SavedCvId/default/file mới" },
    { from: 2, to: 4, text: "Kiểm tra ownership và tải nội dung tệp" },
    { from: 2, to: 4, text: "Tạo CandidateCV/Application và gọi UC-02" },
  ],
  [
    { after: 8, text: "Chưa đăng nhập hoặc validation lỗi: giữ localStorage, không gọi API lưu tài khoản" },
    { after: 12, text: "API lưu lỗi: không xóa bản nháp; thông báo người dùng thử lại" },
    { after: 21, text: "SavedCvId không thuộc Candidate hoặc tệp không tồn tại: từ chối và yêu cầu chọn CV khác" },
  ]
));

console.log(`Generated 8 SVG files in ${outputDir}`);
