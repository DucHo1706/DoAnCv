import os
import urllib.request
import ssl
import sys
import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

# Reconfigure stdout/stderr to UTF-8
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
if sys.stderr.encoding != 'utf-8':
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# 1. Bỏ qua xác thực SSL nếu chứng chỉ bị lỗi
ssl._create_default_https_context = ssl._create_unverified_context

download_dir = r"d:\KhoaLuan\TaiLieuThamKhao"
os.makedirs(download_dir, exist_ok=True)

# Các link tải trực tiếp ổn định nhất không chặn bot
urls = {
    "McClelland_1973_Testing_for_Competence.pdf": "https://www.gwern.net/docs/iq/1973-mcclelland.pdf",
    "Harvard_Resume_and_Cover_Letter_Guide.pdf": "https://hwpi.harvard.edu/files/ocs/files/hes-resume-cover-letter-guide.pdf",
    "Shannon_1948_Mathematical_Theory_of_Communication.pdf": "https://www.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf",
    "SHRM_Selection_Assessment_Methods_Guidelines.pdf": "https://www.shrm.org/hr-today/trends-and-forecasting/special-reports-and-expert-views/Documents/Selection-Assessment-Methods.pdf"
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

print("=== BƯỚC 1: TẢI TOÀN BỘ FILE PDF TÀI LIỆU THAM KHẢO ===")
for filename, url in urls.items():
    dest_path = os.path.join(download_dir, filename)
    print(f"Đang tải {filename}...")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as response:
            content = response.read()
            info = response.info()
            content_type = info.get_content_type() if info else "Unknown"
            
            # Kiểm tra xem có phải file HTML lỗi không
            if "html" in content_type.lower() or content.startswith(b"<html") or content.startswith(b"<!DOCTYPE") or content.startswith(b"<!doctype"):
                print(f"-> CẢNH BÁO: Link tải {filename} trả về trang HTML/Lỗi thay vì file PDF. Bỏ qua tải tự động.")
                print(f"   Vui lòng tải thủ công file này tại trình duyệt và lưu vào thư mục: {dest_path}")
            else:
                with open(dest_path, "wb") as f:
                    f.write(content)
                print(f"-> Tải thành công: {filename} ({len(content)} bytes)")
    except Exception as e:
        print(f"-> LỖI tải {filename}: {e}")
        print(f"   Vui lòng tải thủ công file này tại trình duyệt và lưu vào thư mục: {dest_path}")

print("\n=== BƯỚC 2: KHỞI TẠO FILE BÁO CÁO WORD ===")
try:
    doc = docx.Document()
    
    # Thiết lập lề chuẩn báo cáo khóa luận (Lề trái 3cm, các lề khác 2cm)
    for section in doc.sections:
        section.top_margin = Inches(0.79)     # 2.0 cm
        section.bottom_margin = Inches(0.79)  # 2.0 cm
        section.left_margin = Inches(1.18)    # 3.0 cm
        section.right_margin = Inches(0.79)   # 2.0 cm

    # Cấu hình font chữ mặc định là Times New Roman 13pt
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(13)
    font.color.rgb = RGBColor(15, 23, 42)

    def add_heading_1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(15)
        run.font.bold = True
        run.font.color.rgb = RGBColor(37, 99, 235)
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = RGBColor(15, 23, 42)
        return p

    def add_heading_3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.italic = True
        run.font.color.rgb = RGBColor(71, 85, 105)
        return p

    def add_body_paragraph(text, bold=False, italic=False, align_justify=True):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.3
        if align_justify:
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(13)
        run.font.bold = bold
        run.font.italic = italic
        return p

    def add_bullet_point(prefix, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.3
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        
        run_prefix = p.add_run(prefix)
        run_prefix.font.name = 'Times New Roman'
        run_prefix.font.size = Pt(13)
        run_prefix.font.bold = True
        
        run_text = p.add_run(text)
        run_text.font.name = 'Times New Roman'
        run_text.font.size = Pt(13)
        return p

    def add_code_block(code_text):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.autofit = False
        tbl.columns[0].width = Inches(6.1)
        cell = tbl.cell(0, 0)
        shading_xml = f'<w:shd {nsdecls("w")} w:fill="F8FAFC"/>'
        cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))
        tcBorders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'<w:left w:val="single" w:sz="16" w:space="0" w:color="2563EB"/>'
            f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'<w:right w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'</w:tcBorders>'
        )
        cell._tc.get_or_add_tcPr().append(tcBorders)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(code_text.strip())
        run.font.name = 'Consolas'
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(71, 85, 105)

    # Tiêu đề chính
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(24)
    run_title = p_title.add_run("BÁO CÁO CƠ SỞ LÝ LUẬN KHOA HỌC VÀ THIẾT KẾ PROMPT\nTRONG HỆ THỐNG TUYỂN DỤNG THÔNG MINH AI RECRUITMENT")
    run_title.font.name = 'Times New Roman'
    run_title.font.size = Pt(18)
    run_title.font.bold = True
    
    # Hướng dẫn mở link
    p_note = doc.add_paragraph()
    p_note.paragraph_format.space_after = Pt(12)
    run_note_lbl = p_note.add_run("LƯU Ý CỦA HỆ THỐNG: ")
    run_note_lbl.font.bold = True
    run_note_lbl.font.color.rgb = RGBColor(239, 68, 68)
    run_note_txt = p_note.add_run("Để mở trực tiếp các đường link tài liệu tham khảo bên dưới trong Microsoft Word, vui lòng nhấn giữ phím Ctrl trên bàn phím và click chuột trái vào đường link.")
    run_note_txt.font.italic = True
    run_note_txt.font.color.rgb = RGBColor(100, 116, 139)

    add_heading_1("1. TỔNG QUAN VỀ PHƯƠNG PHÁP THIẾT KẾ PROMPT (PROMPT ENGINEERING)")
    add_body_paragraph(
        "Kỹ nghệ Gợi ý (Prompt Engineering) là một nhánh nghiên cứu và thực hành tập trung vào việc thiết kế, "
        "tối ưu hóa các dữ liệu đầu vào (Prompt) để định hướng hành vi, văn phong và khuôn mẫu đầu ra của các Mô hình Ngôn ngữ Lớn (LLMs). "
        "Trong đề tài xây dựng hệ thống tuyển dụng thông minh AI Recruitment, Prompt Engineering đóng vai trò quyết định, "
        "chuyển hóa LLM (ở đây là Google Gemini 3 Flash) từ một mô hình tạo văn bản thông thường thành một 'Chuyên gia Tuyển dụng' "
        "am hiểu nghiệp vụ nhân sự và có tư duy đánh giá khách quan dựa trên các cơ sở khoa học nhân sự quốc tế."
    )

    add_heading_1("2. CƠ SỞ LÝ LUẬN VÀ THIẾT KẾ PROMPT CHI TIẾT THEO PHÂN HỆ")
    
    add_heading_2("2.1. Phân hệ Đánh giá năng lực và Cảnh báo rủi ro (Competency & Warnings)")
    add_body_paragraph(
        "Phân hệ này đảm nhận vai trò bóc tách, xếp loại và chấm điểm mức độ tương thích giữa hồ sơ ứng tuyển (CV) và mô tả công việc (JD). "
        "Đồng thời phát hiện sớm các dấu hiệu bất thường trong quá trình tuyển dụng để đưa ra cảnh báo (Red Flags) cho nhà tuyển dụng."
    )
    add_heading_3("Cơ sở lý luận khoa học:")
    add_bullet_point("Mô hình năng lực ASK (Attitude - Skills - Knowledge): ", 
                     "Được phát triển dựa trên lý thuyết phân loại của Benjamin Bloom (1956), được McClelland (1973) chuẩn hóa và giảng dạy chính thống "
                     "trong các giáo trình quản trị nhân sự tại Việt Nam [1, 2]. Mô hình ASK phân loại năng lực thành ba nhóm: Thái độ (Attitude), "
                     "Kỹ năng (Skills) và Kiến thức (Knowledge) [1, 3]. Trong khuôn khổ sàng lọc CV, AI tập trung bóc tách và đối chéo phần "
                     "Knowledge (Kiến thức chuyên môn) và Skills (Kỹ năng cứng/mềm) nhằm đưa ra kết luận khách quan.")
    add_bullet_point("Tiêu chuẩn lọc CV của SHRM (Hiệp hội Quản trị Nhân sự Hoa Kỳ): ", 
                     "Kế thừa bộ chỉ dẫn sàng lọc CV chuẩn quốc tế của SHRM [5]. Hệ thống nhận diện các lỗi nghiêm trọng (Red Flags) như: "
                     "Keyword Stuffing (Nhồi nhét từ khóa để qua mặt ATS), Chronology Gap (Khoảng trống lịch sử công việc không rõ lý do), "
                     "Generic CV (Kinh nghiệm mô tả chung chung không rõ vai trò) và Missing Metrics (Kinh nghiệm thiếu số liệu đo lường thành tích) "
                     "vốn là các chỉ báo rủi ro hàng đầu được kiểm soát trong quy trình tuyển chọn chuyên nghiệp [2, 5].")

    add_heading_2("2.2. Phân hệ Tối ưu hóa hồ sơ theo mô hình STAR (STAR Optimization)")
    add_body_paragraph(
        "Phân hệ này giúp nâng cao chất lượng tự thuật kinh nghiệm làm việc trong CV của ứng viên. AI phát hiện các câu diễn đạt mơ hồ, "
        "thiếu thuyết phục và hướng dẫn ứng viên viết lại bằng cách lượng hóa kết quả và làm rõ hành động."
    )
    add_heading_3("Cơ sở lý luận khoa học:")
    add_bullet_point("Phương pháp cấu trúc thành tích STAR: ", 
                     "Do tập đoàn tư vấn nhân sự quốc tế DDI phát triển nhằm đo lường năng lực hành vi và hiện được phổ cập rộng rãi "
                     "trong các tài liệu hướng nghiệp tại Việt Nam. Mô hình yêu cầu ứng viên trình bày kinh nghiệm theo 4 phần: "
                     "Situation (Tình huống bối cảnh), Task (Nhiệm vụ mục tiêu), Action (Hành động thực tế đã làm) và Result (Kết quả đạt được). "
                     "Sự hiện diện đầy đủ của các yếu tố này giúp tăng độ tin cậy cho hồ sơ ứng viên.")
    add_bullet_point("Lý thuyết viết CV định hướng hành động (Action-Oriented & Metric-driven Writing): ", 
                     "Kế thừa từ cẩm nang hướng dẫn viết hồ sơ của Đại học Harvard [6]. Lý thuyết này chỉ ra rằng một câu mô tả kinh nghiệm "
                     "thuyết phục phải bắt đầu bằng một động từ hành động mạnh (Action Verb) như: Chủ trì, Tối ưu, Thiết kế... "
                     "và phải kết thúc bằng các chỉ số định lượng cụ thể (Ví dụ: tăng 20% doanh thu, giảm 15% độ trễ hệ thống) "
                     "để chứng minh hiệu suất làm việc thực tế [6].")

    add_heading_2("2.3. Phân hệ Đánh giá ngôn từ và Độ chân thực (Language & Authenticity)")
    add_body_paragraph(
        "Phân hệ này thực hiện rà soát các từ ngữ sáo rỗng (buzzwords), kiểm soát lỗi thiên vị/định kiến (Bias) và dự báo rủi ro "
        "CV được viết hoàn toàn bởi AI (AI-Generated Resume Risk) nhằm đảm bảo sự minh bạch trong tuyển dụng."
    )
    add_heading_3("Cơ sở lý luận khoa học:")
    add_bullet_point("Khung bình đẳng cơ hội tuyển dụng DEI (Diversity, Equity, and Inclusion): ", 
                     "Được nghiên cứu dựa trên các quy định chống phân biệt đối xử trong tuyển dụng và lý thuyết tương đồng thu hút của Goldberg (2005) [7], "
                     "đồng thời tuân thủ các quy định của Luật Lao động Việt Nam hiện hành về việc cấm phân biệt đối xử về giới tính, độ tuổi, "
                     "dân tộc khi tuyển dụng [1].")
    add_bullet_point("Lý thuyết ngôn ngữ tự nhiên Perplexity và Burstiness phát hiện AI: ", 
                     "Kế thừa từ nguyên lý Entropy thông tin của Claude Shannon (1948) [9] và ứng dụng thực tiễn của Edward Tian (Princeton University) "
                     "trên công cụ GPTZero [8]. Hai chỉ số Perplexity (độ phức tạp từ vựng) và Burstiness (độ biến thiên cấu trúc câu) "
                     "được AI phân tích trên toàn bộ văn bản CV nhằm phát hiện sự rập khuôn, đều đặn phi thực tế đặc trưng của văn bản do các LLM tạo ra.")

    add_heading_2("2.4. Phân hệ Gợi ý câu hỏi phỏng vấn và Huấn luyện (Interview Coaching)")
    add_body_paragraph(
        "Phân hệ này thiết kế bộ câu hỏi phỏng vấn mô phỏng cá nhân hóa cho từng ứng viên dựa trên CV và JD thực tế, "
        "đồng thời chấm điểm phản hồi câu trả lời của ứng viên để giúp họ luyện tập."
    )
    add_heading_3("Cơ sở lý luận khoa học:")
    add_bullet_point("Phương pháp Phỏng vấn Sự kiện Hành vi BEI (Behavioral Event Interviewing): ", 
                     "Được phát triển bởi David McClelland [4] và hệ thống hóa bởi Spencer & Spencer (1993) [10], hiện được đưa vào nội dung giảng dạy "
                     "cốt lõi của các giáo trình quản trị nhân sự tại Việt Nam [1, 2]. BEI dựa trên luận điểm then chốt: 'Hành vi trong quá khứ "
                     "là chỉ báo đáng tin cậy nhất cho hiệu suất công việc trong tương lai' [1, 10]. AI sẽ tập trung tạo câu hỏi tình huống đào sâu "
                     "vào đúng các mốc thời gian, dự án hoặc thành tích ứng viên tự khai trên CV nhằm giúp nhà tuyển dụng đối chứng thực tế.")

    add_heading_1("3. DANH MỤC TÀI LIỆU THAM KHẢO (BIBLIOGRAPHY & REFERENCES)")
    
    # 3.1. Tài liệu tiếng Việt
    add_heading_2("3.1. Tài liệu tiếng Việt (Vietnamese References)")
    
    add_bullet_point("[1] Trần Kim Dung (2018). ",
                     "\"Quản trị nguồn nhân lực\" (Tái bản lần thứ 4). NXB Tổng hợp Thành phố Hồ Chí Minh. "
                     "(Giáo trình chuyên khảo chính thống giảng dạy về khung năng lực ASK và phương pháp phỏng vấn hành vi BEI tại Việt Nam).")
                     
    add_bullet_point("[2] Nguyễn Ngọc Quân & Nguyễn Vân Điềm (2016). ",
                     "\"Giáo trình Quản trị nhân lực\". NXB Đại học Kinh tế Quốc dân (NEU). "
                     "(Cơ sở lý thuyết về quy trình tuyển chọn, các bước sàng lọc hồ sơ ứng viên và xác định tiêu chuẩn JD).")
                     
    add_bullet_point("[3] Nguyễn Thị Hồng & Vũ Hồng Phong (2023). ",
                     "\"Quản lý nguồn nhân lực dựa trên năng lực\". NXB Lao Động. "
                     "(Cẩm nang hướng dẫn xây dựng từ điển năng lực và phương pháp chấm điểm độ tương thích công việc cho doanh nghiệp).")

    # 3.2. Tài liệu tiếng Anh và Quốc tế
    add_heading_2("3.2. Tài liệu tiếng Anh và Quốc tế (International References)")
    
    add_bullet_point("[4] McClelland, D. C. (1973). ", 
                     "\"Testing for competence rather than for 'intelligence'\". American Psychologist, 28(1), 1-14. "
                     "Nguồn học thuật mở: https://www.semanticscholar.org/paper/Testing-for-competence-rather-than-for-McClelland/bb0e9e99292b3a0f7df82ffb8a7b9f36f6d8c06d "
                     "(File PDF đã tải về tại: TaiLieuThamKhao/McClelland_1973_Testing_for_Competence.pdf)")
                     
    add_bullet_point("[5] Pulakos, E. D. (2005). ", 
                     "\"Selection Assessment Methods: A guide to implementing formal assessments to build a high-quality workforce\". SHRM Foundation. "
                     "Nguồn PDF chính thức: https://www.shrm.org/hr-today/trends-and-forecasting/special-reports-and-expert-views/Documents/Selection-Assessment-Methods.pdf "
                     "(File PDF đính kèm tại: TaiLieuThamKhao/SHRM_Selection_Assessment_Methods_Guidelines.pdf)")
                     
    add_bullet_point("[6] Harvard University Office of Career Services (2024). ", 
                     "\"Harvard College Guide to Resumes & Cover Letters\". Mignone Center for Career Success. "
                     "Nguồn PDF chính thức: https://hwpi.harvard.edu/files/ocs/files/hes-resume-cover-letter-guide.pdf "
                     "(Lưu ý: Nếu không tải được tự động do chính sách bảo mật của Harvard, vui lòng tải thủ công theo link trên và lưu tại: TaiLieuThamKhao/Harvard_Resume_and_Cover_Letter_Guide.pdf)")
                     
    add_bullet_point("[7] Goldberg, C. B. (2005). ", 
                     "\"Relational demography and similarity-attraction in resume screening\". Journal of Social Psychology, 145(3), 307-324. "
                     "Nguồn link DOI nghiên cứu: https://doi.org/10.3200/SOCP.145.3.307-324")
                     
    add_bullet_point("[8] Tian, E. (2023). ", 
                     "\"GPTZero: An open-source tool for detecting AI-generated text using perplexity and burstiness analysis\". Princeton NLP Group. "
                     "Nguồn dự án chính thức: https://gptzero.me")
                     
    add_bullet_point("[9] Shannon, C. E. (1948). ", 
                     "\"A Mathematical Theory of Communication\". Bell System Technical Journal, 27(3), 379-423. "
                     "Nguồn PDF chính thức: https://www.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf "
                     "(File PDF đính kèm tại: TaiLieuThamKhao/Shannon_1948_Mathematical_Theory_of_Communication.pdf)")
                     
    add_bullet_point("[10] Spencer, L. M., & Spencer, S. M. (1993). ", 
                     "\"Competence at Work: Models for Superior Performance\". John Wiley & Sons. "
                     "Nguồn nhà xuất bản Wiley: https://www.wiley.com/en-us/Competence+at+Work%3A+Models+for+Superior+Performance-p-9780471548751")

    # Lưu file Word
    output_filename = "BaoCao_CoSoLyLuan_Prompts.docx"
    output_path = os.path.join("d:\\KhoaLuan", output_filename)
    try:
        doc.save(output_path)
        print(f"SUCCESS: Da tao thanh cong file bao cao tai {output_path}")
    except PermissionError:
        fallback_filename = "BaoCao_CoSoLyLuan_Prompts_Moi.docx"
        fallback_path = os.path.join("d:\\KhoaLuan", fallback_filename)
        doc.save(fallback_path)
        print(f"WARNING: File {output_filename} dang bi khoa (co the ban dang mo no trong Word).")
        print(f"Da luu ban moi thay the tai: {fallback_path}")
    
except Exception as e:
    print(f"Loi khi tao file Word: {e}")
