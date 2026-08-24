from __future__ import annotations

import json
import math
import textwrap
from pathlib import Path

from docx import Document
from fpdf import FPDF
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "test_data" / "cv_layout_corpus"
FONT = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")

BASE = {
    "name": "Nguyễn Minh Anh",
    "email": "minhanh.layout@example.com",
    "phone": "0901234567",
    "skills": ["ASP.NET Core", "SQL Server", "Docker", "Git"],
}

PROFILES = [
    {"name": "Nguyễn Minh Anh", "email": "backend01@example.test", "phone": "0901000001", "skills": ["C#", "ASP.NET Core", "SQL Server", "Docker"], "role": "Backend Developer", "summary": "Xây dựng API ổn định cho hệ thống tuyển dụng.", "action": "Phát triển 18 REST API và giảm 25% thời gian phản hồi.", "education": "Kỹ sư Công nghệ thông tin"},
    {"name": "Trần Hoàng Nam", "email": "devops02@example.test", "phone": "0901000002", "skills": ["Linux", "Docker", "Kubernetes", "Terraform", "AWS"], "role": "DevOps Engineer", "summary": "Tự động hóa triển khai và giám sát hạ tầng.", "action": "Xây dựng CI/CD, giảm thời gian phát hành từ 40 xuống 12 phút.", "education": "Cử nhân Mạng máy tính"},
    {"name": "Lê Thu Hà", "email": "data03@example.test", "phone": "0901000003", "skills": ["Python", "SQL", "Power BI", "Pandas"], "role": "Data Analyst", "summary": "Phân tích dữ liệu kinh doanh và trực quan hóa chỉ số.", "action": "Tạo dashboard theo dõi 12 KPI cho bộ phận vận hành.", "education": "Cử nhân Hệ thống thông tin"},
    {"name": "Phạm Quang Huy", "email": "java04@example.test", "phone": "0901000004", "skills": ["Java", "Spring Boot", "PostgreSQL", "Redis"], "role": "Java Developer", "summary": "Phát triển dịch vụ giao dịch có khả năng mở rộng.", "action": "Tối ưu truy vấn và tăng thông lượng xử lý 30%.", "education": "BSc Computer Science"},
    {"name": "Võ Ngọc Mai", "email": "marketing05@example.test", "phone": "0901000005", "skills": ["SEO", "Content Marketing", "Google Analytics", "Facebook Ads"], "role": "Digital Marketing Executive", "summary": "Lập kế hoạch nội dung và đo lường hiệu quả chiến dịch.", "action": "Tăng 42% lượng truy cập tự nhiên trong sáu tháng.", "education": "Cử nhân Marketing"},
    {"name": "Đặng Gia Bảo", "email": "mobile06@example.test", "phone": "0901000006", "skills": ["Kotlin", "Android", "REST API", "Git"], "role": "Mobile Developer", "summary": "Phát triển ứng dụng Android chú trọng trải nghiệm người dùng.", "action": "Phát hành ba tính năng và giảm 35% tỷ lệ crash.", "education": "Kỹ sư Phần mềm"},
    {"name": "Bùi Thanh Trúc", "email": "media07@example.test", "phone": "0901000007", "skills": ["Content Strategy", "Social Media", "Figma", "Event Planning"], "role": "Multimedia Content Producer", "summary": "Sản xuất nội dung đa nền tảng và điều phối sự kiện.", "action": "Điều phối 8 sự kiện, bảo đảm tiến độ và ngân sách.", "education": "Cử nhân Truyền thông đa phương tiện"},
    {"name": "Huỳnh Quốc Việt", "email": "qa08@example.test", "phone": "0901000008", "skills": ["Manual Testing", "API Testing", "SQL", "Jira"], "role": "QA Engineer", "summary": "Kiểm thử chức năng và quản lý chất lượng phát hành.", "action": "Thiết kế 220 test case và phát hiện 47 lỗi trước phát hành.", "education": "Cử nhân Công nghệ thông tin"},
    {"name": "Ngô Bảo Châu", "email": "hr09@example.test", "phone": "0901000009", "skills": ["Recruitment", "Talent Acquisition", "Excel", "Labor Law"], "role": "HR Executive", "summary": "Tuyển dụng và vận hành quy trình nhân sự.", "action": "Tuyển đủ 24 vị trí và rút ngắn 20% thời gian tuyển.", "education": "Cử nhân Quản trị nhân lực"},
    {"name": "Đỗ Mỹ Linh", "email": "finance10@example.test", "phone": "0901000010", "skills": ["Accounting", "Excel", "Tax", "ERP"], "role": "Accountant", "summary": "Kiểm soát chứng từ và lập báo cáo tài chính.", "action": "Đối soát 1.200 chứng từ mỗi tháng với sai lệch dưới 0,5%.", "education": "Cử nhân Kế toán"},
    {"name": "Phan Tuấn Kiệt", "email": "frontend11@example.test", "phone": "0901000011", "skills": ["React", "TypeScript", "HTML", "CSS"], "role": "Frontend Developer", "summary": "Phát triển giao diện web dễ sử dụng và có khả năng truy cập.", "action": "Xây dựng 16 màn hình và cải thiện 28% tốc độ tải.", "education": "Cử nhân Kỹ thuật phần mềm"},
    {"name": "Dương Khánh An", "email": "security12@example.test", "phone": "0901000012", "skills": ["Cybersecurity", "Linux", "Networking", "Python"], "role": "Security Analyst", "summary": "Giám sát sự kiện an toàn thông tin và xử lý sự cố.", "action": "Phân tích 350 cảnh báo và xây dựng 12 playbook ứng phó.", "education": "Kỹ sư An toàn thông tin"},
    {"name": "Lý Minh Khang", "email": "cloud13@example.test", "phone": "0901000013", "skills": ["Azure", ".NET", "Microservices", "Kubernetes"], "role": "Cloud Engineer", "summary": "Thiết kế dịch vụ cloud và chuẩn hóa triển khai.", "action": "Di chuyển 6 dịch vụ và duy trì SLA 99,9%.", "education": "Kỹ sư Công nghệ thông tin"},
    {"name": "Mai Thảo Vy", "email": "design14@example.test", "phone": "0901000014", "skills": ["Figma", "User Research", "Design System", "Prototyping"], "role": "UI/UX Designer", "summary": "Nghiên cứu người dùng và thiết kế sản phẩm số.", "action": "Thực hiện 18 phỏng vấn và tăng 15% tỷ lệ hoàn thành tác vụ.", "education": "Cử nhân Thiết kế đồ họa"},
    {"name": "Tạ Đức Long", "email": "support15@example.test", "phone": "0901000015", "skills": ["Customer Support", "Excel", "Communication", "CRM"], "role": "Customer Support Specialist", "summary": "Hỗ trợ khách hàng và theo dõi chất lượng dịch vụ.", "action": "Xử lý 60 yêu cầu mỗi ngày với CSAT 94%.", "education": "Cử nhân Quản trị kinh doanh"},
]


def lines(overlap: bool = False, english: bool = False) -> list[str]:
    if english:
        return [
            BASE["name"], BASE["email"], BASE["phone"], "PROFESSIONAL SUMMARY",
            BASE["summary"],
            "I clarify the expected outcome, evidence source, review owner and acceptance criteria before implementation.",
            "I distinguish verified measurements from personal estimates and keep assumptions in the handover record.",
            "WORK EXPERIENCE",
            f'{BASE["role"]} | Sao Viet Solutions | Jan 2024 - Aug 2026',
            BASE["action"],
            "Owned requirements clarification, weekly progress tracking and risk escalation for four stakeholder groups.",
            "Built a reusable checklist and evidence log covering inputs, decisions, outputs and rollback conditions.",
            "Compared four weeks before and after the change; excluded externally blocked work from the reported result.",
            f'Associate {BASE["role"]} | Minh Long Services | Jan 2022 - Dec 2023',
            "Processed 36 representative cases each month and documented incomplete inputs before execution.",
            "Supported root-cause review, acceptance testing and handover documentation for recurring incidents.",
            "PROJECTS",
            f'Workflow standardization for {BASE["role"]} | Jan 2026 - Jun 2026',
            "Designed the pilot scope, baseline, validation dataset, review checklist and rollback plan.",
            "Delivered six controlled artifacts and presented limitations together with the measured outcome.",
            "Traceable handover project | Sep 2025 - Dec 2025",
            "Linked requirements, approvers, versions and decisions so the receiving team could audit changes.",
            "TECHNICAL SKILLS",
            *[
                f"{skill}: used in a documented task with an output artifact, review owner and at least 20 validation cases."
                for skill in BASE["skills"]
            ],
            "EDUCATION",
            f'{BASE["education"]} | 2018 - 2022',
            "Capstone included requirement analysis, implementation, controlled testing and a limitations section.",
            "CERTIFICATIONS",
            f'Foundation certificate for {BASE["role"]} | 2025 | synthetic benchmark record',
            "LANGUAGES",
            "English B2 self-declared; reading, writing and interview ability require independent verification.",
            "WORKING PRINCIPLES",
            "Use evidence-backed conclusions, document uncertainty and never treat an automated score as a hiring decision.",
        ]
    periods = ["01/2022 - 12/2023", "06/2023 - 06/2025"] if overlap else ["01/2022 - 12/2023", "01/2024 - 06/2025"]
    return [
        BASE["name"], BASE["email"], BASE["phone"], "MỤC TIÊU NGHỀ NGHIỆP",
        BASE["summary"],
        "Mục tiêu hai năm tới là chịu trách nhiệm trọn vẹn một đầu ra có tiêu chí nghiệm thu, dữ liệu đối chiếu và kế hoạch bàn giao rõ ràng.",
        "Tôi ưu tiên môi trường đánh giá dựa trên bằng chứng công việc; các con số trong CV là thông tin tự khai cần xác minh độc lập.",
        "TÓM TẮT NĂNG LỰC",
        f'Thế mạnh chính gồm {", ".join(BASE["skills"])} và khả năng phối hợp liên phòng ban theo mục tiêu đo lường được.',
        "Trước khi thực hiện, tôi làm rõ phạm vi, nguồn dữ liệu, người phê duyệt, rủi ro và điều kiện hoàn thành.",
        "Sau mỗi giai đoạn, tôi lưu quyết định, sai lệch và hành động cải tiến để nhóm có thể kiểm tra hoặc tái sử dụng.",
        "KINH NGHIỆM LÀM VIỆC",
        f'{BASE["role"]} | Công ty Sao Việt | {periods[0]}',
        BASE["action"],
        "Tiếp nhận trung bình 36 đầu việc mỗi tháng, phân loại mức ưu tiên và ghi nhận trường hợp thiếu đầu vào trước khi triển khai.",
        "Phối hợp bốn nhóm liên quan rà soát tiến độ hàng tuần, xác nhận thay đổi phạm vi và cập nhật người chịu trách nhiệm.",
        "Xây dựng checklist gồm điều kiện đầu vào, bước kiểm tra, kết quả kỳ vọng và phương án quay lui khi nghiệm thu không đạt.",
        "Đối chiếu dữ liệu bốn tuần trước và sau thay đổi; loại các trường hợp bị chờ do yếu tố bên ngoài khỏi phép đo.",
        f'{BASE["role"]} | Công ty Minh Long | {periods[1]}',
        "Chịu trách nhiệm làm rõ yêu cầu, lập kế hoạch thực hiện và báo cáo khối lượng, chất lượng, thời gian xử lý cùng rủi ro.",
        "Phân tích nguyên nhân gốc cho sáu nhóm lỗi lặp lại, thống nhất hành động phòng ngừa và theo dõi tới khi đóng vấn đề.",
        "Hướng dẫn hai thành viên mới bằng tài liệu thao tác, dữ liệu mẫu và phiên rà soát sau khi hoàn thành công việc.",
        "DỰ ÁN TIÊU BIỂU",
        f'Dự án chuẩn hóa quy trình {BASE["role"]} | 01/2026 - 06/2026',
        "Bối cảnh: đầu vào đến từ nhiều nguồn, định nghĩa hoàn thành chưa thống nhất và khó truy vết quyết định khi có sai lệch.",
        "Nhiệm vụ: xây dựng cách làm chung, thử nghiệm phạm vi nhỏ và trình bày cả kết quả lẫn giới hạn trước khi mở rộng.",
        f'Hành động: sử dụng {BASE["skills"][0]}, {BASE["skills"][1]} và {BASE["skills"][2]} để thiết kế luồng, dữ liệu kiểm tra và báo cáo kiểm soát.',
        "Kết quả: hoàn thành thử nghiệm trên 48 trường hợp, xác định bốn nhóm lỗi thường gặp và tạo sáu tài liệu bàn giao.",
        "Dự án cải thiện khả năng truy vết | 09/2025 - 12/2025",
        "Liên kết yêu cầu, người phê duyệt, phiên bản đầu ra và lịch sử quyết định để nhóm tiếp nhận có thể kiểm tra thay đổi.",
        "Chuẩn hóa năm loại tài liệu và giảm 14% trường hợp phải hỏi lại thông tin trong tập dữ liệu mô phỏng.",
        "KỸ NĂNG VÀ BẰNG CHỨNG",
        *[
            f"{skill}: đã sử dụng trong đầu việc có phạm vi, đầu ra, người rà soát và tối thiểu 20 trường hợp kiểm tra."
            for skill in BASE["skills"]
        ],
        "HỌC VẤN",
        f'{BASE["education"]} | 2018 - 2022',
        "Đồ án tốt nghiệp có khảo sát yêu cầu, thiết kế giải pháp, thử nghiệm có kiểm soát và trình bày giới hạn.",
        "CHỨNG CHỈ VÀ HỌC TẬP",
        f'Chứng nhận nền tảng {BASE["role"]} | 2025 | dữ liệu synthetic, không phải chứng chỉ thật.',
        f'Kế hoạch tự học tập trung vào {BASE["skills"][-1]} với bài tập tình huống và nhật ký tự đánh giá.',
        "NGOẠI NGỮ",
        "Tiếng Anh B2 tự khai: đọc tài liệu, viết email và trao đổi công việc; năng lực cần được kiểm tra độc lập.",
        "NGUYÊN TẮC LÀM VIỆC",
        "Phân biệt dữ kiện đã kiểm chứng, giả định đang dùng và ý kiến cá nhân; không xem điểm tự động là kết luận tuyển dụng.",
    ]


def pdf_text(path: Path, content: list[str], columns: bool = False, pages: int = 1, custom_heading: bool = False):
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=12)
    pdf.add_font("Arial", "", str(FONT))
    pdf.add_font("Arial", "B", str(FONT_BOLD))
    current = list(content)
    if custom_heading:
        current = ["HÀNH TRÌNH PHÁT TRIỂN"] + current
    if columns:
        wrapped_lines: list[tuple[str, bool]] = []
        for value in current:
            heading = value.isupper()
            width = 42 if heading else 58
            chunks = textwrap.wrap(value, width=width, break_long_words=False) or [""]
            wrapped_lines.extend((chunk, heading) for chunk in chunks)
            wrapped_lines.append(("", False))
        lines_per_column = 52
        lines_per_page = lines_per_column * 2
        for page_start in range(0, len(wrapped_lines), lines_per_page):
            pdf.add_page()
            page_lines = wrapped_lines[page_start:page_start + lines_per_page]
            for column_index in range(2):
                column_lines = page_lines[
                    column_index * lines_per_column:(column_index + 1) * lines_per_column
                ]
                x = 10 + column_index * 100
                y = 14
                for value, heading in column_lines:
                    pdf.set_xy(x, y)
                    pdf.set_font("Arial", "B" if heading else "", 8.5 if not heading else 9.5)
                    pdf.cell(92, 4.8, value)
                    y += 4.8
    else:
        chunks = []
        if pages > 1:
            chunk_size = math.ceil(len(current) / pages)
            chunks = [current[index:index + chunk_size] for index in range(0, len(current), chunk_size)]
        else:
            chunks = [current]
        for current_chunk in chunks:
            pdf.add_page()
            for value in current_chunk:
                pdf.set_x(pdf.l_margin)
                pdf.set_font("Arial", "B" if value.isupper() else "", 9 if not value.isupper() else 11)
                pdf.multi_cell(0, 5.2, value)
    pdf.output(str(path))


def docx_table(path: Path, nested: bool = False):
    document = Document()
    document.add_heading(BASE["name"], 0)
    document.add_paragraph(f'{BASE["email"]} | {BASE["phone"]}')
    content = lines()[3:]
    sections: list[tuple[str, list[str]]] = []
    current_heading = "THÔNG TIN"
    current_lines: list[str] = []
    for value in content:
        if value.isupper():
            if current_lines:
                sections.append((current_heading, current_lines))
            current_heading, current_lines = value, []
        else:
            current_lines.append(value)
    if current_lines:
        sections.append((current_heading, current_lines))
    table = document.add_table(rows=len(sections), cols=2)
    table.style = "Table Grid"
    for row, (heading, section_lines) in zip(table.rows, sections):
        row.cells[0].text = heading
        row.cells[1].text = "\n".join(section_lines)
    if nested:
        document.add_paragraph("THÀNH TỰU KHÁC")
        extra = document.add_table(rows=3, cols=3)
        extra.style = "Table Grid"
        values = (
            "Giai đoạn", "Vai trò", "Kết quả có nguồn",
            "2025", BASE["role"], BASE["action"],
            "2026", "Người phụ trách", "Hoàn tất 48 trường hợp và sáu tài liệu bàn giao",
        )
        for index, value in enumerate(values):
            extra.cell(index // 3, index % 3).text = value
    document.save(path)


def image_cv(path: Path, noisy: bool = False, two_columns: bool = False):
    content = lines()
    wrap_width = 46 if two_columns else 92
    wrapped_groups: list[tuple[str, bool]] = []
    for value in content:
        heading = value.isupper()
        chunks = textwrap.wrap(value, width=wrap_width, break_long_words=False) or [""]
        wrapped_groups.extend((chunk, heading) for chunk in chunks)
        wrapped_groups.append(("", False))
    column_count = 2 if two_columns else 1
    lines_per_column = math.ceil(len(wrapped_groups) / column_count)
    image_height = max(2339, 260 + lines_per_column * 38)
    image = Image.new("RGB", (1654, image_height), "#eef2f7" if noisy else "white")
    draw = ImageDraw.Draw(image)
    regular = ImageFont.truetype(str(FONT), 23 if noisy else 25)
    bold = ImageFont.truetype(str(FONT_BOLD), 30)
    header_name = ImageFont.truetype(str(FONT_BOLD), 46)
    header_contact = ImageFont.truetype(str(FONT), 34)
    draw.rectangle((60, 45, image.width - 60, 205), fill="white")
    draw.text((90, 65), BASE["name"], font=header_name, fill="#0f172a")
    draw.text((90, 135), f'{BASE["email"]}  |  {BASE["phone"]}', font=header_contact, fill="#111827")
    groups = []
    for column_index in range(column_count):
        start = column_index * lines_per_column
        groups.append((90 + column_index * 790, wrapped_groups[start:start + lines_per_column]))
    for x, group in groups:
        y = 230
        for value, heading in group:
            draw.text((x, y), value, font=bold if heading else regular, fill="#111827")
            y += 42 if heading else 34
    if noisy:
        for x in range(0, image.width, 130):
            draw.line((x, 220, x + 500, image.height), fill="#e2e8f0", width=2)
        image = image.rotate(2.2, expand=False, fillcolor="white")
    image.save(path, quality=90)


def scan_pdf(path: Path, image_path: Path):
    pdf = FPDF()
    pdf.add_page()
    pdf.image(str(image_path), x=0, y=0, w=210, h=297)
    pdf.output(str(path))


def main():
    global BASE
    OUTPUT.mkdir(parents=True, exist_ok=True)
    cases = []
    definitions = [
        ("01_pdf_single_vi.pdf", "PDF văn bản một cột", lambda p: pdf_text(p, lines())),
        ("02_pdf_two_columns_vi.pdf", "PDF văn bản hai cột", lambda p: pdf_text(p, lines(), columns=True)),
        ("03_pdf_multi_page.pdf", "PDF nhiều trang", lambda p: pdf_text(p, lines(), pages=3)),
        ("04_pdf_english.pdf", "PDF tiếng Anh", lambda p: pdf_text(p, lines(english=True))),
        ("05_pdf_bilingual.pdf", "PDF Việt-Anh", lambda p: pdf_text(p, lines() + lines(english=True))),
        ("06_pdf_overlap_timeline.pdf", "Timeline chồng lắp", lambda p: pdf_text(p, lines(overlap=True))),
        ("07_pdf_custom_heading.pdf", "Tiêu đề mục tự đặt", lambda p: pdf_text(p, lines(), custom_heading=True)),
        ("08_docx_table.docx", "DOCX dạng bảng", lambda p: docx_table(p)),
        ("09_docx_complex_table.docx", "DOCX nhiều bảng", lambda p: docx_table(p, nested=True)),
        ("10_image_clean.png", "Ảnh CV rõ nét", lambda p: image_cv(p)),
        ("11_image_two_columns.png", "Ảnh CV hai cột", lambda p: image_cv(p, two_columns=True)),
        ("12_image_noisy_rotated.png", "Ảnh lệch và có nhiễu", lambda p: image_cv(p, noisy=True)),
        ("13_pdf_scan_clean.pdf", "PDF scan không có text layer", None),
        ("14_pdf_dense_compact.pdf", "PDF dày nội dung", lambda p: pdf_text(p, lines() * 4, columns=True)),
        ("15_docx_english_table.docx", "DOCX bảng tiếng Anh", lambda p: docx_table(p, nested=True)),
    ]
    for index, (filename, description, generator) in enumerate(definitions):
        BASE = PROFILES[index]
        path = OUTPUT / filename
        if generator:
            generator(path)
        else:
            scan_source = OUTPUT / "_scan_source.png"
            image_cv(scan_source)
            scan_pdf(path, scan_source)
            scan_source.unlink(missing_ok=True)
        cases.append({
            "file": filename,
            "description": description,
            "expected_email": BASE["email"],
            "expected_phone": BASE["phone"],
            "expected_name": BASE["name"],
            "expected_role": BASE["role"],
            "expected_skills": BASE["skills"],
            "expected_is_cv": True,
        })
    invalid_path = OUTPUT / "16_pdf_not_a_cv.pdf"
    pdf_text(invalid_path, [
        "BIÊN BẢN HỌP VẬN HÀNH THÁNG 08/2026",
        "Cuộc họp rà soát tiến độ cung ứng thiết bị và lịch bảo trì văn phòng.",
        "Nội dung thảo luận gồm ngân sách điện nước, tình trạng phòng họp, kế hoạch kiểm kê và lịch giao hàng.",
        "Các bộ phận thống nhất cập nhật báo cáo trước thứ sáu, kiểm tra lại hóa đơn và xác nhận số lượng thiết bị còn thiếu.",
        "Tài liệu này là biên bản nội bộ, không chứa hồ sơ cá nhân, quá trình làm việc hoặc thông tin ứng tuyển.",
    ])
    cases.append({
        "file": invalid_path.name,
        "description": "PDF văn bản hợp lệ về định dạng nhưng không phải CV",
        "expected_email": "",
        "expected_phone": "",
        "expected_name": "",
        "expected_role": "",
        "expected_skills": [],
        "expected_is_cv": False,
    })
    (OUTPUT / "ground_truth.json").write_text(json.dumps(cases, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generated {len(cases)} cases in {OUTPUT}")


if __name__ == "__main__":
    main()
