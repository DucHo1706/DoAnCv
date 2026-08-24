const fs = require("fs");
const path = require("path");

const outputRoot = path.join(process.cwd(), ".local", "devops-demo-cvs");
const esc = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const run = (text, bold = false, color = "263746", size = 22) => `<w:r><w:rPr>${bold ? "<w:b/>" : ""}<w:color w:val="${color}"/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
const paragraph = (text, options = {}) => {
  const { bold = false, color = "263746", size = 22, before = 0, after = 100, align = "left", border = false } = options;
  return `<w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:before="${before}" w:after="${after}"/>${border ? '<w:pBdr><w:bottom w:val="single" w:sz="10" w:space="5" w:color="2563EB"/></w:pBdr>' : ""}</w:pPr>${run(text, bold, color, size)}</w:p>`;
};
const bullet = (text) => `<w:p><w:pPr><w:spacing w:after="70"/><w:ind w:left="360" w:hanging="220"/></w:pPr>${run("•  " + text, false, "263746", 21)}</w:p>`;
const section = (title) => paragraph(title.toUpperCase(), { bold: true, color: "1D4ED8", size: 24, before: 150, after: 90, border: true });

const profiles = [
  {
    folder: "cv-devops-cao",
    file: "CV_01_Nguyen_Quoc_Bao_DevOps_Phu_Hop_Cao.docx",
    name: "NGUYỄN QUỐC BẢO",
    role: "KỸ SƯ DEVOPS",
    contact: "quocbao.devops.demo@gmail.com  |  0908 246 810  |  TP. Hồ Chí Minh",
    summary: "Kỹ sư DevOps có hơn 3 năm kinh nghiệm triển khai và vận hành hệ thống web trên AWS. Thành thạo Docker, GitLab CI, Linux và giám sát hệ thống; đã tham gia chuẩn hóa quy trình CI/CD và triển khai Kubernetes cho môi trường staging.",
    skills: [
      "DevOps: Docker, Docker Compose, Kubernetes, Nginx",
      "CI/CD: GitLab CI, GitHub Actions, Jenkins",
      "Cloud: AWS EC2, S3, RDS, CloudWatch",
      "Hệ điều hành: Ubuntu Linux, Bash Shell",
      "Giám sát: Prometheus, Grafana, ELK Stack",
      "Dữ liệu và công cụ: PostgreSQL, Redis, Git, Jira"
    ],
    experience: [
      "DevOps Engineer — Công ty Công nghệ Sao Nam (03/2023 – 08/2026)",
      "Thiết kế pipeline GitLab CI để tự động kiểm thử, đóng gói Docker image và triển khai ứng dụng lên môi trường staging và production.",
      "Vận hành 12 dịch vụ trên Ubuntu Linux và AWS EC2; theo dõi log, tài nguyên và cảnh báo bằng Prometheus, Grafana và CloudWatch.",
      "Triển khai Docker Compose cho môi trường phát triển và Kubernetes cho môi trường staging.",
      "Tối ưu quy trình phát hành, giảm thời gian triển khai trung bình từ 45 phút xuống còn 12 phút.",
      "Xây dựng tài liệu khôi phục sự cố và phối hợp với nhóm Backend xử lý lỗi API, database và reverse proxy Nginx."
    ],
    projects: [
      "Nền tảng tuyển dụng trực tuyến — DevOps Engineer (2025 – 2026)",
      "Đóng gói React, ASP.NET Core, FastAPI và SQL Server bằng Docker; cấu hình Nginx reverse proxy và HTTPS.",
      "Thiết lập GitHub Actions để build, kiểm thử và triển khai tự động lên VPS Ubuntu.",
      "Thiết lập sao lưu database định kỳ và giám sát trạng thái container.",
      "Hệ thống giám sát nội bộ — DevOps Engineer (2024)",
      "Triển khai Prometheus và Grafana; xây dựng dashboard CPU, RAM, dung lượng đĩa và tỷ lệ lỗi HTTP."
    ],
    education: "Đại học Công nghệ TP. Hồ Chí Minh — Kỹ thuật phần mềm (2019 – 2023)",
    certificates: ["AWS Certified Cloud Practitioner — 2024", "Linux Foundation: Introduction to Linux — 2023"],
    languages: "Tiếng Anh: TOEIC 760; đọc hiểu tài liệu kỹ thuật và trao đổi công việc."
  },
  {
    folder: "cv-devops-thap",
    file: "CV_02_Le_Thao_Vy_Thiet_Ke_Khong_Phu_Hop_DevOps.docx",
    name: "LÊ THẢO VY",
    role: "NHÂN VIÊN THIẾT KẾ ĐỒ HỌA",
    contact: "thaovy.design.demo@gmail.com  |  0912 357 924  |  TP. Hồ Chí Minh",
    summary: "Nhân viên thiết kế đồ họa định hướng phát triển nội dung hình ảnh cho mạng xã hội và chiến dịch truyền thông. Có kinh nghiệm sử dụng Photoshop, Illustrator và Canva; yêu thích sáng tạo hình ảnh thương hiệu.",
    skills: [
      "Thiết kế: Adobe Photoshop, Adobe Illustrator, Canva",
      "Nội dung: thiết kế bài đăng mạng xã hội, banner và ấn phẩm quảng cáo",
      "Công cụ: Figma cơ bản, Microsoft Office",
      "Kỹ năng mềm: giao tiếp, quản lý thời gian, làm việc nhóm"
    ],
    experience: [
      "Graphic Design Intern — Công ty Truyền thông Ánh Việt (01/2026 – 06/2026)",
      "Thiết kế hình ảnh cho Facebook, Instagram và các chương trình khuyến mãi.",
      "Chỉnh sửa hình ảnh sản phẩm và phối hợp với bộ phận nội dung để bảo đảm nhận diện thương hiệu.",
      "Hỗ trợ chuẩn bị banner và tài liệu cho các sự kiện nội bộ."
    ],
    projects: [
      "Bộ nhận diện thương hiệu cửa hàng cà phê — Dự án cá nhân",
      "Thiết kế logo, bảng màu, menu và 12 mẫu bài đăng mạng xã hội bằng Illustrator và Photoshop.",
      "Chiến dịch truyền thông mùa hè — Thành viên thiết kế",
      "Thực hiện banner quảng cáo và hình ảnh cho nội dung mạng xã hội."
    ],
    education: "Cao đẳng Mỹ thuật và Truyền thông — Thiết kế đồ họa (2023 – 2026)",
    certificates: ["Chứng nhận Adobe Photoshop cơ bản — 2025"],
    languages: "Tiếng Anh: giao tiếp cơ bản."
  }
];

function write(base, relative, content) {
  const target = path.join(base, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
}

for (const cv of profiles) {
  const base = path.join(outputRoot, cv.folder);
  const body = [
    paragraph(cv.name, { bold: true, color: "17324D", size: 38, align: "center", after: 50 }),
    paragraph(cv.role, { bold: true, color: "1D4ED8", size: 25, align: "center", after: 80 }),
    paragraph(cv.contact, { color: "526879", size: 20, align: "center", after: 150 }),
    section("Mục tiêu nghề nghiệp"), paragraph(cv.summary, { size: 21 }),
    section("Kỹ năng"), ...cv.skills.map(bullet),
    section("Kinh nghiệm làm việc"), ...cv.experience.map((item, index) => index === 0 ? paragraph(item, { bold: true, size: 22 }) : bullet(item)),
    section("Dự án tiêu biểu"), ...cv.projects.map((item, index) => index % 3 === 0 ? paragraph(item, { bold: true, size: 22 }) : bullet(item)),
    section("Học vấn"), paragraph(cv.education, { size: 21 }),
    section("Chứng chỉ"), ...cv.certificates.map(bullet),
    section("Ngoại ngữ"), paragraph(cv.languages, { size: 21 })
  ].join("");

  write(base, "[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>');
  write(base, "_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  write(base, "word/_rels/document.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
  write(base, "word/styles.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/><w:lang w:val="vi-VN"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>');
  write(base, "word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="950" w:bottom="850" w:left="950"/></w:sectPr></w:body></w:document>`);
  console.log(`${base}|${cv.file}`);
}
