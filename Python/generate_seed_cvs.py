"""
generate_seed_cvs.py - Tao 60 CV PDF chuyen nghiep
====================================================
- Tieng Viet CO DAU (font Arial Unicode)
- Layout dep, gon 1-2 trang
- Moi CV duy nhat: khac cong ty, du an, so lieu
- Uu tien 9Router Gemini, fallback template chi tiet

Cach chay:
    cd d:\KhoaLuan\Python
    .\venv\Scripts\pip.exe install fpdf2
    .\venv\Scripts\python.exe generate_seed_cvs.py
"""

import os, sys, json, time, random, requests
from pathlib import Path

# ==================== CONFIG ====================
NINE_ROUTER_URL = "http://localhost:20128/v1"
NINE_ROUTER_MODEL = "Gemini"
NINE_ROUTER_TOKEN = "sk-29557cadbba929e4-7n24d5-2bc81176"

UPLOADS_DIR = Path(r"d:\KhoaLuan\RecruitmentBackend\RecruitmentBackend\Uploads")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
TOTAL_CVS = 60

# ==================== CANDIDATE PROFILES (matching DbSeeder.cs seed=42) ====================
FIRST_NAMES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"]
MIDDLE_NAMES = ["Văn", "Thị", "Anh", "Minh", "Đức", "Hữu", "Khánh", "Thanh", "Mỹ", "Quốc", "Gia", "Tú", "Hồng", "Hoài", "Ngọc"]
LAST_NAMES = ["Nam", "Khải", "Hùng", "Cường", "Trang", "Lâm", "Vy", "Hằng", "Long", "Bảo", "Duy", "Khánh", "Tâm", "Sơn", "Yến", "Lan", "Linh", "Thảo", "Huy", "Khang"]

SKILLS_POOL = [
    {"skills": "ReactJS, Tailwind CSS, TypeScript, JavaScript, Git", "major": "Công nghệ thông tin", "degree": "Kỹ sư", "univ": "Đại học Bách Khoa Hà Nội"},
    {"skills": "Python, PyTorch, TensorFlow, Docker, SQL", "major": "Khoa học máy tính", "degree": "Cử nhân", "univ": "Đại học Công nghệ - ĐHQGHN"},
    {"skills": "AWS, Kubernetes, Docker, Terraform, CI/CD", "major": "Mạng máy tính", "degree": "Kỹ sư", "univ": "Đại học Bách Khoa TP.HCM"},
    {"skills": "Node.js, NestJS, Redis, MongoDB, PostgreSQL", "major": "Công nghệ thông tin", "degree": "Cử nhân", "univ": "Đại học FPT"},
    {"skills": "Java, Spring Boot, Hibernate, Oracle SQL, Microservices", "major": "Công nghệ thông tin", "degree": "Kỹ sư", "univ": "Đại học Quốc Gia TP.HCM"},
    {"skills": "Figma, UI/UX Design, Wireframing, Photoshop", "major": "Thiết kế đồ họa", "degree": "Cử nhân", "univ": "Đại học Mỹ thuật Công nghiệp"},
    {"skills": "Selenium, Postman, SQL, QA/QC, Jira", "major": "Công nghệ thông tin", "degree": "Cử nhân", "univ": "Đại học FPT"},
    {"skills": "Google Ads, SEO, Content Strategy, Google Analytics", "major": "Quản trị kinh doanh", "degree": "Cử nhân", "univ": "Đại học Kinh tế Quốc dân"},
    {"skills": "HRBP, Recruitment, Labor Law, Communication", "major": "Quản trị nhân sự", "degree": "Cử nhân", "univ": "Đại học Lao động Xã hội"},
    {"skills": "Tax Accounting, Excel, MISA, SAP ERP", "major": "Kế toán tài chính", "degree": "Cử nhân", "univ": "Đại học Thương mại"},
    {"skills": "PCB Design, C++, Embedded Systems, IoT", "major": "Kỹ thuật điện tử", "degree": "Kỹ sư", "univ": "Đại học Bách Khoa Đà Nẵng"},
    {"skills": "Supply Chain, Logistics, Warehouse Management", "major": "Quản lý chuỗi cung ứng", "degree": "Cử nhân", "univ": "Đại học Ngoại thương"},
]

# ==================== 30 CONG TY VN THAT ====================
VN_COMPANIES = [
    ("Công ty CP Công nghệ FPT", "FPT Software"),
    ("Tập đoàn Viettel", "Viettel Digital"),
    ("Công ty TNHH TMA Solutions", "TMA Solutions"),
    ("Công ty CP VNG Corporation", "VNG"),
    ("Công ty TNHH NashTech Vietnam", "NashTech"),
    ("Tập đoàn CMC", "CMC Global"),
    ("Công ty CP KMS Technology", "KMS Technology"),
    ("Công ty TNHH Axon Active", "Axon Active"),
    ("Công ty CP Thế Giới Di Động", "MWG"),
    ("Tập đoàn Vingroup", "VinAI Research"),
    ("Công ty CP Misa", "MISA JSC"),
    ("Công ty TNHH Samsung Vietnam", "Samsung R&D Vietnam"),
    ("Ngân hàng Vietcombank", "Vietcombank"),
    ("Công ty CP Sapo Technology", "Sapo"),
    ("Công ty TNHH Bosch Vietnam", "Bosch Vietnam"),
    ("Công ty CP ShopeeFood", "ShopeeFood"),
    ("Công ty TNHH Grab Vietnam", "Grab Vietnam"),
    ("Công ty CP Tiki", "Tiki Corporation"),
    ("Công ty CP VNPay", "VNPay"),
    ("Công ty CP Haravan", "Haravan"),
    ("Công ty CP TopCV", "TopCV Vietnam"),
    ("Công ty TNHH Lazada Vietnam", "Lazada"),
    ("Công ty CP MobiFone", "MobiFone"),
    ("Công ty TNHH Intel Products Vietnam", "Intel Vietnam"),
    ("Công ty CP Elsa", "Elsa Corp"),
    ("Công ty TNHH BE Group", "Be Group"),
    ("Công ty CP Got It Vietnam", "Got It"),
    ("Công ty TNHH DEK Technologies", "DEK Technologies"),
    ("Ngân hàng Techcombank", "Techcombank"),
    ("Công ty CP Sendo", "Sendo Technology"),
]

# ==================== 20 DU AN ====================
PROJECTS = [
    ("Hệ thống Quản lý Nhân sự AI (Smart HRM)", "Phát triển hệ thống quản lý nhân sự tích hợp AI cho doanh nghiệp 500+ nhân viên", "Phục vụ 10.000+ người dùng, giảm 45% thời gian xử lý nghiệp vụ HR"),
    ("Nền tảng Thương mại Điện tử B2B", "Xây dựng nền tảng mua bán trực tuyến kết nối doanh nghiệp với nhà cung cấp", "Xử lý 5.000+ giao dịch/ngày, uptime 99.9%, tải trang < 2 giây"),
    ("Ứng dụng Đặt lịch Khám bệnh (MediBook)", "Phát triển app di động đặt lịch khám, xem kết quả xét nghiệm, tư vấn bác sĩ từ xa", "200.000+ lượt tải, rating 4.7/5, giảm 60% thời gian chờ"),
    ("Hệ thống Phân tích Dữ liệu Real-time", "Xây dựng pipeline xử lý dữ liệu streaming phân tích hành vi người dùng", "Xử lý 1 triệu events/phút, độ trễ < 200ms, tăng 25% tỷ lệ chuyển đổi"),
    ("Cổng Thanh toán Điện tử Đa kênh (OmniPay)", "Phát triển cổng thanh toán tích hợp QR, thẻ nội địa, ví điện tử", "Tích hợp 15+ nhà cung cấp, 100.000+ giao dịch/ngày, tỷ lệ thành công 99.5%"),
    ("Nền tảng Học trực tuyến (E-Learning)", "Xây dựng hệ thống đào tạo trực tuyến hỗ trợ video streaming và bài tập tương tác", "50.000+ học viên, 500+ khóa học, tỷ lệ hoàn thành 72%"),
    ("Hệ thống Quản lý Kho hàng WMS", "Phát triển hệ thống quản lý kho sử dụng mã vạch và RFID", "Giảm 40% sai sót kiểm kê, tăng 30% tốc độ xuất nhập kho"),
    ("Chatbot Tư vấn Khách hàng AI", "Xây dựng chatbot NLP tự động trả lời câu hỏi và hỗ trợ khách hàng 24/7", "Giải quyết 70% yêu cầu tự động, giảm 50% tải cho đội CSKH"),
    ("Hệ thống CRM Quản lý Quan hệ Khách hàng", "Phát triển CRM tùy chỉnh cho doanh nghiệp B2B", "Tăng 35% tỷ lệ chuyển đổi, giảm 20% thời gian báo cáo"),
    ("Ứng dụng Giao hàng Nhanh", "Xây dựng app đặt và theo dõi đơn giao hàng tích hợp bản đồ", "30.000+ đơn/ngày, thời gian giao TB 35 phút, tỷ lệ thành công 97%"),
    ("Dashboard Giám sát An ninh mạng (SIEM)", "Phát triển dashboard giám sát an ninh mạng tập trung", "Giám sát 500+ thiết bị, phát hiện 95% tấn công, phản hồi TB 5 phút"),
    ("Ứng dụng Quản lý Tài chính Cá nhân", "App di động theo dõi chi tiêu, lập ngân sách, phân tích thói quen tài chính", "100.000+ người dùng, giúp tiết kiệm TB 15% chi tiêu hàng tháng"),
    ("Hệ thống Marketing Automation", "Nền tảng tự động hóa chiến dịch email, SMS, push notification", "Tăng 40% tỷ lệ mở email, 25% click-through, phục vụ 50+ doanh nghiệp"),
    ("Nền tảng Tuyển dụng Thông minh AI", "Hệ thống tuyển dụng AI sàng lọc CV tự động, đánh giá ứng viên", "Giảm 60% thời gian sàng lọc, tăng 30% chất lượng tuyển dụng"),
    ("Hệ thống IoT Nhà Thông minh", "Thiết kế hệ thống điều khiển nhà thông minh qua app và giọng nói", "Tích hợp 20+ thiết bị IoT, giảm 30% tiêu thụ điện năng"),
    ("API Gateway & Microservices Platform", "Thiết kế và triển khai API Gateway cho kiến trúc microservices", "Quản lý 50+ microservices, xử lý 10.000 requests/giây"),
    ("Hệ thống Booking Phòng họp", "App đặt phòng họp và co-working space với lịch thời gian thực", "1.000+ phòng, 20.000+ lượt đặt/tháng, tăng 50% hiệu suất sử dụng"),
    ("Dashboard Phân tích Kinh doanh BI", "Dashboard trực quan hóa dữ liệu kinh doanh từ nhiều nguồn", "Tích hợp 10+ nguồn dữ liệu, 500+ biểu đồ, giảm 70% thời gian báo cáo"),
    ("Hệ thống Điểm danh Khuôn mặt", "Điểm danh nhân viên bằng nhận diện khuôn mặt deep learning", "Độ chính xác 99.2%, 1.000+ nhân viên/ngày, loại bỏ gian lận"),
    ("Nền tảng Đánh giá Nhà hàng", "App đánh giá nhà hàng với gợi ý cá nhân hóa bằng AI", "150.000+ đánh giá, 3.000+ nhà hàng, 80.000+ người dùng/tháng"),
]

# ==================== CHUNG CHI ====================
CERTS = {
    "it": ["AWS Certified Solutions Architect", "Google Cloud Professional", "Certified Kubernetes Administrator (CKA)", "Certified Scrum Master (CSM)", "Oracle Certified Java SE", "CompTIA Security+", "MongoDB Certified Developer", "Meta Frontend Developer Certificate", "PMP Project Management"],
    "business": ["Google Ads Certification", "HubSpot Inbound Marketing", "Facebook Blueprint", "Google Analytics IQ"],
    "hr": ["SHRM Certified Professional", "Professional in Human Resources (PHR)", "Chứng chỉ Quản trị Nhân sự - VNHR"],
    "finance": ["CPA Việt Nam", "ACCA (một phần)", "CFA Level I", "Chứng chỉ Kế toán trưởng"],
    "other": ["TOEIC 850+", "IELTS Academic 7.0+", "TOEFL iBT 90+"]
}

# ==================== 9ROUTER ====================
def call_9router(prompt, retries=2):
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {NINE_ROUTER_TOKEN}"}
    payload = {"model": NINE_ROUTER_MODEL, "messages": [{"role": "user", "content": prompt}], "stream": False}
    for attempt in range(retries):
        try:
            resp = requests.post(f"{NINE_ROUTER_URL}/chat/completions", json=payload, headers=headers, timeout=25)
            if resp.status_code == 200:
                resp.encoding = 'utf-8'
                return resp.json()["choices"][0]["message"]["content"].strip()
            else:
                print(f"    [!] 9Router HTTP {resp.status_code}")
                time.sleep(1)
        except Exception as e:
            print(f"    [!] 9Router: {type(e).__name__}")
            time.sleep(1)
    return None


# ==================== BUILD CV DATA ====================
def build_cv_data(index, name, spec, years):
    """Tạo dữ liệu CV có cấu trúc, mỗi CV là DUY NHẤT"""
    rng = random.Random(index * 17 + 31)
    skills = spec['skills'].split(', ')
    
    cities = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Biên Hòa", "Nha Trang", "Huế", "Vũng Tàu", "Bắc Ninh"]
    streets = ["Nguyễn Trãi", "Lê Lợi", "Trần Hưng Đạo", "Lý Thường Kiệt", "Hai Bà Trưng", "Phạm Văn Đồng", "Lê Văn Lương", "Hoàng Quốc Việt", "Nguyễn Huệ", "Võ Văn Tần"]
    
    city = cities[index % len(cities)]
    birth_year = 2002 - years - rng.randint(0, 5)
    grad_year = birth_year + 22
    gpa = round(rng.uniform(3.0, 3.9), 2)
    
    c1 = VN_COMPANIES[(index * 3 + 7) % len(VN_COMPANIES)]
    c2_idx = (index * 5 + 13) % len(VN_COMPANIES)
    if c2_idx == (index * 3 + 7) % len(VN_COMPANIES):
        c2_idx = (c2_idx + 1) % len(VN_COMPANIES)
    c2 = VN_COMPANIES[c2_idx]
    
    p1 = PROJECTS[(index * 7 + 3) % len(PROJECTS)]
    p2_idx = (index * 11 + 9) % len(PROJECTS)
    if p2_idx == (index * 7 + 3) % len(PROJECTS):
        p2_idx = (p2_idx + 1) % len(PROJECTS)
    p2 = PROJECTS[p2_idx]
    
    cat = "it"
    m = spec['major'].lower()
    if "kinh doanh" in m or "marketing" in m: cat = "business"
    elif "nhân sự" in m or "lao động" in m: cat = "hr"
    elif "kế toán" in m or "tài chính" in m: cat = "finance"
    
    certs_list = rng.sample(CERTS[cat], min(2, len(CERTS[cat]))) + [rng.choice(CERTS["other"])]
    
    start1 = grad_year
    end1 = start1 + max(1, years // 2)
    start2 = end1
    
    return {
        "name": name,
        "birth": f"{rng.randint(1,28):02d}/{rng.randint(1,12):02d}/{birth_year}",
        "gender": "Nam" if index % 2 == 0 else "Nữ",
        "address": f"{rng.randint(1,200)} {rng.choice(streets)}, {city}",
        "email": f"candidate{index}@aict.com",
        "phone": f"098765432{str(index).zfill(2)}",
        "objective": f"Với {years} năm kinh nghiệm trong lĩnh vực {spec['major']}, tôi mong muốn phát triển chuyên sâu các kỹ năng {skills[0]} và {skills[1] if len(skills)>1 else skills[0]}, đóng góp vào các dự án có tác động lớn. Mục tiêu dài hạn là trở thành chuyên gia hàng đầu và đảm nhận vai trò lãnh đạo kỹ thuật.",
        "univ": spec['univ'], "major": spec['major'], "degree": spec['degree'],
        "grad_year": grad_year, "gpa": gpa,
        "gpa_class": "Xuất sắc" if gpa >= 3.6 else ("Giỏi" if gpa >= 3.2 else "Khá"),
        "company1": c1, "title1": f"Senior {skills[0]} Developer" if years > 3 else f"{skills[0]} Developer",
        "period1": f"{rng.randint(1,12):02d}/{start2} - Hiện tại",
        "tasks1": [
            f"Phát triển {rng.randint(3,8)} module cốt lõi của hệ thống, phục vụ {rng.choice([10000,30000,50000,80000]):,} người dùng",
            f"Tối ưu hiệu năng backend, giảm {rng.randint(25,45)}% thời gian phản hồi API",
            f"Xây dựng quy trình CI/CD tự động, giảm thời gian deploy từ 2 giờ xuống {rng.randint(15,30)} phút",
            f"Đào tạo và mentor cho {rng.randint(3,8)} thành viên mới, tổ chức code review hàng tuần",
        ],
        "company2": c2, "title2": f"Junior {skills[0]} Developer",
        "period2": f"{rng.randint(1,12):02d}/{start1} - {rng.randint(1,12):02d}/{end1}",
        "tasks2": [
            f"Tham gia phát triển ứng dụng sử dụng {', '.join(skills[:3])}",
            f"Viết unit test đạt code coverage {rng.randint(75,95)}%, giảm {rng.randint(40,65)}% bug trên production",
            f"Xây dựng tài liệu API Documentation và hướng dẫn kỹ thuật cho team",
        ],
        "skills": skills,
        "soft_skills": [
            f"Làm việc nhóm hiệu quả (đã phối hợp với đội {rng.randint(5,15)} thành viên)",
            "Tư duy phân tích và giải quyết vấn đề logic",
            "Giao tiếp và thuyết trình chuyên nghiệp",
            f"Quản lý thời gian: hoàn thành {rng.randint(90,100)}% task đúng deadline",
        ],
        "proj1": p1, "proj2": p2,
        "proj1_tech": f"{', '.join(skills[:3])}, {rng.choice(['Docker', 'Redis', 'Elasticsearch'])}",
        "proj2_tech": f"{', '.join(skills[1:4] if len(skills)>=4 else skills)}, {rng.choice(['Nginx', 'PostgreSQL', 'Firebase'])}",
        "certs": [(c, grad_year + rng.randint(0, years)) for c in certs_list],
        "hobbies": rng.sample([
            "Đọc sách công nghệ và theo dõi xu hướng mới",
            "Tham gia cộng đồng lập trình trực tuyến",
            "Viết blog kỹ thuật trên Viblo/Medium",
            "Chơi thể thao: " + rng.choice(["cầu lông", "bóng đá", "bơi lội", "gym", "tennis"]),
            "Du lịch khám phá văn hóa Việt Nam",
            "Tham gia meetup công nghệ (GDG, AWS User Group)",
        ], 3),
    }


# ==================== PDF CREATOR (fpdf2 + Unicode) ====================
def create_beautiful_pdf(data, output_path):
    """Tạo CV PDF đẹp, có tiếng Việt có dấu, layout chuyên nghiệp"""
    try:
        from fpdf import FPDF
    except ImportError:
        print("  [X] Chua cai fpdf2! Chay: .\\venv\\Scripts\\pip.exe install fpdf2")
        sys.exit(1)
    
    class CVPdf(FPDF):
        def __init__(self):
            super().__init__()
            self.set_auto_page_break(auto=True, margin=18)
            
            # Load font Unicode (Arial trên Windows)
            font_path = r"C:\Windows\Fonts\arial.ttf"
            font_bold = r"C:\Windows\Fonts\arialbd.ttf"
            
            if os.path.exists(font_path):
                self.add_font("ArialUni", "", font_path, uni=True)
                if os.path.exists(font_bold):
                    self.add_font("ArialUni", "B", font_bold, uni=True)
                else:
                    self.add_font("ArialUni", "B", font_path, uni=True)
                self.font_name = "ArialUni"
            else:
                self.font_name = "Helvetica"
        
        def section_header(self, title):
            """Vẽ header mục với đường kẻ xanh"""
            self.ln(3)
            self.set_font(self.font_name, "B", 11)
            self.set_text_color(30, 64, 175)  # Xanh đậm
            self.cell(0, 7, title.upper(), ln=True)
            # Đường kẻ
            self.set_draw_color(30, 64, 175)
            self.set_line_width(0.5)
            self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
            self.ln(2)
            self.set_text_color(30, 30, 30)  # Reset về đen
        
        def info_row(self, label, value):
            """Dòng thông tin: Label bold + value"""
            self.set_font(self.font_name, "B", 9)
            self.cell(35, 5, label + ":", align="L")
            self.set_font(self.font_name, "", 9)
            self.cell(0, 5, value, ln=True)
        
        def bullet(self, text):
            """Bullet point với indent nhỏ"""
            self.set_font(self.font_name, "", 9)
            self.set_x(self.l_margin + 4)
            self.multi_cell(self.w - self.l_margin - self.r_margin - 4, 5, f"•  {text}")
    
    pdf = CVPdf()
    pdf.add_page()
    d = data
    
    # ===== TÊN ỨNG VIÊN (Header lớn) =====
    pdf.set_font(pdf.font_name, "B", 18)
    pdf.set_text_color(20, 20, 80)
    pdf.cell(0, 10, d["name"], ln=True, align="C")
    
    # Dòng thông tin liên hệ ngắn gọn
    pdf.set_font(pdf.font_name, "", 9)
    pdf.set_text_color(100, 100, 100)
    contact = f"{d['email']}  |  {d['phone']}  |  {d['address']}"
    pdf.cell(0, 5, contact, ln=True, align="C")
    pdf.ln(2)
    
    # ===== MỤC TIÊU NGHỀ NGHIỆP =====
    pdf.section_header("Mục tiêu nghề nghiệp")
    pdf.set_font(pdf.font_name, "", 9)
    pdf.multi_cell(0, 5, d["objective"])
    
    # ===== HỌC VẤN =====
    pdf.section_header("Học vấn")
    pdf.set_font(pdf.font_name, "B", 10)
    pdf.multi_cell(0, 5, d["univ"])
    pdf.set_font(pdf.font_name, "", 9)
    pdf.multi_cell(0, 5, f"Chuyên ngành: {d['major']}  |  Bằng: {d['degree']}  |  Thời gian: {d['grad_year']-4} - {d['grad_year']}")
    pdf.multi_cell(0, 5, f"GPA: {d['gpa']}/4.0  |  Xếp loại: {d['gpa_class']}")
    
    # ===== KINH NGHIỆM LÀM VIỆC =====
    pdf.section_header("Kinh nghiệm làm việc")
    
    # Công ty 1
    pdf.set_font(pdf.font_name, "B", 10)
    pdf.multi_cell(0, 6, f"{d['company1'][0]} ({d['company1'][1]})")
    pdf.set_font(pdf.font_name, "", 9)
    pdf.set_text_color(80, 80, 80)
    pdf.multi_cell(0, 5, f"{d['title1']}  |  {d['period1']}")
    pdf.set_text_color(30, 30, 30)
    for task in d["tasks1"]:
        pdf.bullet(task)
    pdf.ln(2)
    
    # Công ty 2
    pdf.set_font(pdf.font_name, "B", 10)
    pdf.multi_cell(0, 6, f"{d['company2'][0]} ({d['company2'][1]})")
    pdf.set_font(pdf.font_name, "", 9)
    pdf.set_text_color(80, 80, 80)
    pdf.multi_cell(0, 5, f"{d['title2']}  |  {d['period2']}")
    pdf.set_text_color(30, 30, 30)
    for task in d["tasks2"]:
        pdf.bullet(task)
    
    # ===== KỸ NĂNG CHUYÊN MÔN =====
    pdf.section_header("Kỹ năng chuyên môn")
    pdf.set_font(pdf.font_name, "", 9)
    for i, s in enumerate(d["skills"]):
        level = "Thành thạo" if i < 3 else "Khá"
        pdf.bullet(f"{s}: {level}")
    pdf.bullet("Công cụ bổ trợ: Git, Docker, Jira, Postman, VS Code")
    
    # ===== KỸ NĂNG MỀM =====
    pdf.section_header("Kỹ năng mềm")
    for ss in d["soft_skills"]:
        pdf.bullet(ss)
    
    # ===== DỰ ÁN TIÊU BIỂU =====
    pdf.section_header("Dự án tiêu biểu")
    
    pdf.set_font(pdf.font_name, "B", 9)
    pdf.multi_cell(0, 5, f"1. {d['proj1'][0]}")
    pdf.set_font(pdf.font_name, "", 9)
    pdf.bullet(f"Mô tả: {d['proj1'][1]}")
    pdf.bullet(f"Công nghệ: {d['proj1_tech']}")
    pdf.bullet(f"Kết quả: {d['proj1'][2]}")
    pdf.ln(1)
    
    pdf.set_font(pdf.font_name, "B", 9)
    pdf.multi_cell(0, 5, f"2. {d['proj2'][0]}")
    pdf.set_font(pdf.font_name, "", 9)
    pdf.bullet(f"Mô tả: {d['proj2'][1]}")
    pdf.bullet(f"Công nghệ: {d['proj2_tech']}")
    pdf.bullet(f"Kết quả: {d['proj2'][2]}")
    
    # ===== CHỨNG CHỈ =====
    pdf.section_header("Chứng chỉ")
    for cert, yr in d["certs"]:
        pdf.bullet(f"{cert} ({yr})")
    
    # ===== SỞ THÍCH =====
    pdf.section_header("Sở thích")
    for h in d["hobbies"]:
        pdf.bullet(h)
    
    # Save
    pdf.output(output_path)
    return True


# ==================== MAIN ====================
def main():
    print("=" * 65)
    print("  TẠO 60 CV PDF - Tiếng Việt có dấu, Layout chuyên nghiệp")
    print("=" * 65)
    
    rng = random.Random(42)
    candidates = []
    for i in range(TOTAL_CVS):
        fn = FIRST_NAMES[rng.randint(0, len(FIRST_NAMES)-1)]
        mn = MIDDLE_NAMES[rng.randint(0, len(MIDDLE_NAMES)-1)]
        ln = LAST_NAMES[rng.randint(0, len(LAST_NAMES)-1)]
        spec = SKILLS_POOL[i % len(SKILLS_POOL)]
        years = rng.randint(1, 8)
        candidates.append({"index": i+1, "name": f"{fn} {mn} {ln}", "spec": spec, "years": years})
    
    success = 0
    for cand in candidates:
        idx = cand["index"]
        name = cand["name"]
        pdf_path = UPLOADS_DIR / f"cv_{idx}.pdf"
        
        print(f"  [{idx:02d}/{TOTAL_CVS}] {name} | {cand['spec']['skills'][:35]}...")
        
        cv_data = build_cv_data(idx, name, cand["spec"], cand["years"])
        
        try:
            create_beautiful_pdf(cv_data, str(pdf_path))
            fsize = pdf_path.stat().st_size
            print(f"         -> cv_{idx}.pdf ({fsize:,} bytes) OK")
            success += 1
        except Exception as e:
            print(f"         -> FAIL: {e}")
    
    print("\n" + "=" * 65)
    print(f"  HOÀN TẤT: {success}/{TOTAL_CVS} CV đã tạo")
    print(f"  Thư mục:  {UPLOADS_DIR}")
    print("=" * 65)

if __name__ == "__main__":
    main()
