const fs = require('fs');
const path = require('path');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const run = (text, bold = false, color = '263746', size = 22) =>
  `<w:r><w:rPr>${bold ? '<w:b/>' : ''}<w:color w:val="${color}"/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
const p = (text, options = {}) => {
  const { bold = false, color = '263746', size = 22, before = 0, after = 100, align = 'left', border = false } = options;
  return `<w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:before="${before}" w:after="${after}"/>${border ? '<w:pBdr><w:bottom w:val="single" w:sz="10" w:space="5" w:color="22A699"/></w:pBdr>' : ''}</w:pPr>${run(text, bold, color, size)}</w:p>`;
};
const bullet = (text) => `<w:p><w:pPr><w:spacing w:after="70"/><w:ind w:left="360" w:hanging="220"/></w:pPr>${run('•  ' + text, false, '263746', 21)}</w:p>`;
const section = (title) => p(title.toUpperCase(), { bold: true, color: '087F75', size: 24, before: 150, after: 90, border: true });

const profiles = [
  {
    dir: '_cv_backend_build',
    output: 'CV_Nguyen_Minh_Khang_Backend_DotNet.docx',
    name: 'NGUYỄN MINH KHANG',
    role: 'LẬP TRÌNH VIÊN BACKEND .NET JUNIOR',
    contact: 'minhkhang.demo@example.com  |  0900 000 101  |  TP. Hồ Chí Minh',
    summary: 'Lập trình viên Backend .NET với hơn 1 năm kinh nghiệm thực hành qua dự án doanh nghiệp và đồ án cá nhân. Có khả năng xây dựng RESTful API bằng ASP.NET Core, thiết kế cơ sở dữ liệu PostgreSQL, triển khai xác thực JWT và đóng gói ứng dụng bằng Docker. Mong muốn phát triển hệ thống backend ổn định, dễ bảo trì và có kiểm thử.',
    skills: [
      'Ngôn ngữ và nền tảng: C#, .NET 8, ASP.NET Core Web API',
      'Dữ liệu: PostgreSQL, SQL, Entity Framework Core, LINQ',
      'API và bảo mật: RESTful API, JWT Authentication, Role-based Authorization',
      'Công cụ: Git, GitHub, Docker, Docker Compose, Postman, Swagger',
      'Kiểm thử: xUnit, Unit Testing cơ bản',
      'Kỹ năng mềm: làm việc nhóm, phân tích lỗi, đọc tài liệu tiếng Anh'
    ],
    experience: [
      'Backend Developer Intern — Công ty Công nghệ Sao Việt (06/2025–06/2026)',
      'Phát triển 18 RESTful API cho module người dùng, việc làm và hồ sơ bằng ASP.NET Core.',
      'Thiết kế bảng và truy vấn PostgreSQL; sử dụng Entity Framework Core để quản lý dữ liệu.',
      'Triển khai JWT Authentication và phân quyền theo vai trò người dùng.',
      'Viết Unit Test bằng xUnit cho các service quan trọng, đạt khoảng 70% phạm vi kiểm thử của module phụ trách.',
      'Phối hợp nhóm 4 thành viên qua Git; tham gia code review và xử lý lỗi từ log ứng dụng.'
    ],
    projects: [
      'Recruitment Management API — Dự án cá nhân',
      'Xây dựng backend quản lý tin tuyển dụng và hồ sơ ứng viên bằng ASP.NET Core Web API.',
      'Sử dụng PostgreSQL, Entity Framework Core, Swagger và JWT.',
      'Đóng gói API cùng cơ sở dữ liệu bằng Docker Compose và triển khai trên VPS.',
      'Kết quả: hoàn thiện luồng đăng nhập, phân quyền và quản lý hồ sơ; tài liệu hóa API bằng Swagger.'
    ],
    education: 'Đại học Công nghệ TP. Hồ Chí Minh — Công nghệ thông tin (2022–2026)',
    languages: 'Tiếng Anh: đọc hiểu tài liệu kỹ thuật; giao tiếp cơ bản.'
  },
  {
    dir: '_cv_frontend_build',
    output: 'CV_Tran_Gia_Han_Frontend.docx',
    name: 'TRẦN GIA HÂN',
    role: 'LẬP TRÌNH VIÊN FRONTEND JUNIOR',
    contact: 'giahan.demo@example.com  |  0900 000 202  |  TP. Hồ Chí Minh',
    summary: 'Lập trình viên Frontend định hướng xây dựng giao diện web thân thiện và tương thích trên nhiều thiết bị. Có kinh nghiệm thực hành với React, JavaScript và CSS qua đồ án cá nhân. Mong muốn phát triển chuyên sâu về trải nghiệm người dùng và thiết kế giao diện.',
    skills: [
      'Frontend: HTML5, CSS3, JavaScript, React, Vite',
      'Giao diện: Responsive Design, Ant Design, Figma cơ bản',
      'Tích hợp: sử dụng REST API từ phía giao diện, Axios',
      'Công cụ: Git, GitHub, Postman',
      'Kỹ năng mềm: giao tiếp, làm việc nhóm, chủ động học hỏi'
    ],
    experience: [
      'Frontend Developer Intern — Studio Web Ánh Dương (09/2025–03/2026)',
      'Xây dựng giao diện trang giới thiệu và trang quản lý nội dung bằng React.',
      'Chuyển thiết kế từ Figma thành giao diện responsive cho máy tính và điện thoại.',
      'Tích hợp API có sẵn để hiển thị danh sách sản phẩm và thông tin người dùng.',
      'Sử dụng Git để quản lý mã nguồn và phối hợp với hai thành viên trong nhóm.'
    ],
    projects: [
      'Website Portfolio Cá nhân',
      'Thiết kế giao diện bằng React, HTML và CSS; tối ưu hiển thị trên thiết bị di động.',
      'Xây dựng hiệu ứng chuyển trang và biểu mẫu liên hệ.',
      'Website Giới thiệu Cửa hàng',
      'Tạo giao diện danh mục sản phẩm, tìm kiếm phía trình duyệt và trang chi tiết sản phẩm.'
    ],
    education: 'Cao đẳng Kỹ thuật TP. Hồ Chí Minh — Thiết kế và lập trình Web (2023–2026)',
    languages: 'Tiếng Anh: đọc hiểu tài liệu giao diện ở mức cơ bản.'
  }
];

function writeFile(base, rel, data) {
  const target = path.join(base, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data, 'utf8');
}

for (const cv of profiles) {
  const base = path.join(process.cwd(), cv.dir);
  fs.mkdirSync(base, { recursive: true });
  const body = [
    p(cv.name, { bold: true, color: '17324D', size: 38, align: 'center', after: 50 }),
    p(cv.role, { bold: true, color: '087F75', size: 25, align: 'center', after: 80 }),
    p(cv.contact, { color: '526879', size: 20, align: 'center', after: 150 }),
    section('Mục tiêu nghề nghiệp'),
    p(cv.summary, { size: 21, after: 110 }),
    section('Kỹ năng'),
    ...cv.skills.map(bullet),
    section('Kinh nghiệm làm việc'),
    ...cv.experience.map((x, i) => i === 0 ? p(x, { bold: true, size: 22, after: 80 }) : bullet(x)),
    section('Dự án tiêu biểu'),
    ...cv.projects.map((x, i) => (i === 0 || (!x.includes(':') && x.length < 40)) ? p(x, { bold: true, size: 22, before: i ? 80 : 0, after: 70 }) : bullet(x)),
    section('Học vấn'),
    p(cv.education, { size: 21 }),
    section('Ngoại ngữ'),
    p(cv.languages, { size: 21 })
  ].join('');

  writeFile(base, '[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`);
  writeFile(base, '_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`);
  writeFile(base, 'word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`);
  writeFile(base, 'word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/><w:lang w:val="vi-VN"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`);
  writeFile(base, 'word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="950" w:bottom="850" w:left="950" w:header="360" w:footer="360" w:gutter="0"/></w:sectPr></w:body></w:document>`);
  writeFile(base, 'docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(cv.name)} - CV demo</dc:title><dc:creator>RecruitInsight AI Demo</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">2026-08-05T00:00:00Z</dcterms:created></cp:coreProperties>`);
  writeFile(base, 'docProps/app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Office Word</Application><AppVersion>16.0000</AppVersion></Properties>`);
  console.log(`${cv.dir}|${cv.output}`);
}
