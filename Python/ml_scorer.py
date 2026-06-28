from google import genai
from google.genai import types
import json
import re
import os
import io
import PyPDF2
import pytesseract
from PIL import Image
from dotenv import load_dotenv

# Tải các biến môi trường từ file .env
load_dotenv()

# Lấy API Key từ biến môi trường an toàn
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("Không tìm thấy GEMINI_API_KEY. Vui lòng tạo file .env và thêm GEMINI_API_KEY vào nhé!")

# Khởi tạo client theo thư viện google-genai mới
client = genai.Client(api_key=GEMINI_API_KEY)

# Đường dẫn đến Tesseract OCR trên Windows (Sửa lại nếu bạn cài ở ổ đĩa khác)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def extract_text_from_file(file_bytes: bytes, filename: str, content_type: str) -> str:
    text = ""
    try:
        # 1. NẾU LÀ FILE PDF -> Dùng PyPDF2 theo đúng yêu cầu đề tài
        if content_type == "application/pdf" or filename.lower().endswith(".pdf"):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            for page in pdf_reader.pages:
                if page.extract_text():
                    text += page.extract_text() + "\n"
        # 2. NẾU LÀ FILE ẢNH -> Dùng Tesseract OCR để bóc tách chữ
        elif content_type in ["image/png", "image/jpeg", "image/jpg"] or filename.lower().endswith((".png", ".jpg", ".jpeg")):
            image = Image.open(io.BytesIO(file_bytes))
            text = pytesseract.image_to_string(image, lang='vie+eng')
    except Exception as e:
        print(f"Lỗi bóc tách văn bản: {e}")
    return text.strip()

def chat_with_candidate(user_message, history=None, job_description="", file_text="", system_knowledge=""):
    system_instruction = """Bạn là trợ lý ảo AI Recruitment Assistant chuyên nghiệp của hệ thống tuyển dụng AI Recruitment.
Nhiệm vụ của bạn là trả lời câu hỏi của người dùng tuân thủ NGHIÊM NGẶT các quy tắc ưu tiên sau:

1. ƯU TIÊN SỐ 1 (Ngữ cảnh & Dữ liệu hệ thống): LUÔN tìm kiếm câu trả lời dựa trên các thông tin được cung cấp trong ngữ cảnh (Lịch sử trò chuyện, Mô tả công việc JD, Nội dung CV đính kèm, Dữ liệu bổ sung). Nếu có thông tin phù hợp, hãy trả lời dựa trên đó.
2. ƯU TIÊN SỐ 2 (Kiến thức chuyên môn): Nếu ngữ cảnh KHÔNG CÓ thông tin, bạn được phép dùng kiến thức của mình để hỗ trợ, NHƯNG CHỈ ĐƯỢC PHÉP nói về các chủ đề: Tuyển dụng, Nhân sự, Tìm việc làm, Viết CV, Phỏng vấn, Xu hướng nghề nghiệp.
3. TỪ CHỐI NGOÀI LỀ (Out of scope): Tuyệt đối KHÔNG trả lời bất kỳ câu hỏi nào ngoài các chủ đề trên (ví dụ: không viết code, không giải toán, không làm thơ, không nói chuyện chính trị, giải trí...). Nếu người dùng hỏi ngoài lề, hãy trả lời mặc định: "Xin lỗi, tôi là trợ lý ảo chuyên về lĩnh vực Tuyển dụng và Việc làm. Tôi không thể hỗ trợ bạn vấn đề này."

Yêu cầu định dạng và phong cách:
- Đi thẳng vào vấn đề, súc tích (dưới 300 chữ).
- LUÔN LUÔN IN ĐẬM (sử dụng cú pháp **từ khóa**) các từ khóa quan trọng, tên kỹ năng, để người dùng dễ đọc.
- Nếu người dùng cung cấp CV hoặc JD, hãy phân tích điểm mạnh/yếu một cách chuyên nghiệp và thân thiện."""

    contents = []
    if history:
        for msg in history:
            role = "model" if msg.role == "ai" else "user"
            contents.append({"role": role, "parts": [{"text": msg.text}]})
            
    context_text = ""
    if system_knowledge:
        context_text += f"\n\n--- DỮ LIỆU TỪ DATABASE CỦA HỆ THỐNG ---\n{system_knowledge}"
    if job_description:
        context_text += f"\n\n--- THÔNG TIN JD (MÔ TẢ CÔNG VIỆC) ---\n{job_description}"
    if file_text:
        context_text += f"\n\n--- NỘI DUNG FILE CV ĐÍNH KÈM ---\n{file_text}"

    final_user_message = user_message + context_text
    contents.append({"role": "user", "parts": [{"text": final_user_message}]})

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction
            )
        )
        return response.text
    except Exception as e:
        print(f"Lỗi Chatbot AI: {e}")
        return "Xin lỗi, mình đang gặp sự cố kết nối. Bạn vui lòng thử lại sau nhé."

def calculate_resume_score(cv_text, jd_text, cv_skills, jd_skills, criteria_list):
    criteria_json = json.dumps(criteria_list, ensure_ascii=False, indent=2)

    prompt = f"""
Bạn là một chuyên gia tuyển dụng nhân sự cấp cao.

Nhiệm vụ của bạn là đánh giá mức độ phù hợp giữa Hồ sơ ứng viên (CV) và Mô tả công việc (JD).
Đồng thời bóc tách các thông tin cơ bản của ứng viên từ CV.

Bạn KHÔNG được tự tạo tiêu chí mới.
Bạn chỉ được chấm điểm dựa trên danh sách tiêu chí do HR cung cấp.
Mỗi tiêu chí có trọng số riêng.
Điểm của từng tiêu chí không được vượt quá trọng số của tiêu chí đó.
Tổng điểm phải bằng tổng điểm của tất cả tiêu chí.
Tổng điểm tối đa là 100.

--- NỘI DUNG CV ---
{cv_text}

Kỹ năng trong CV:
{cv_skills}

--- NỘI DUNG JD ---
{jd_text}

Kỹ năng trong JD:
{jd_skills}

--- DANH SÁCH TIÊU CHÍ DO HR CUNG CẤP ---
{criteria_json}

Quy tắc phân loại:
- Nếu total_score >= 80: classification = "Phù hợp"
- Nếu total_score >= 60 và total_score < 80: classification = "Nên xem xét"
- Nếu total_score < 60: classification = "Chưa phù hợp"

Yêu cầu bắt buộc:
1. Trả về ĐÚNG 1 JSON duy nhất.
2. Không thêm markdown.
3. Không dùng ```json.
4. Không thêm chữ giải thích ngoài JSON.
5. criteria_results phải có đủ tất cả tiêu chí HR đã cung cấp.
6. criterion_name phải giữ đúng tên tiêu chí HR đã cung cấp.
7. weight và max_score phải bằng trọng số HR cung cấp.
8. score là số nguyên, không vượt quá max_score.
9. total_score phải bằng tổng score của criteria_results.
10. Nhận xét bằng tiếng Việt, ngắn gọn, dễ hiểu cho HR.
11. Bóc tách degree (bằng cấp), major (chuyên ngành), university (tên trường), years_of_experience (số năm kinh nghiệm), certificates (mảng các chuỗi tên chứng chỉ ứng viên có, ví dụ ["IELTS 7.0", "AWS Certified"]). Nếu không có thông tin, trả về null hoặc 0 hoặc mảng rỗng.

Cấu trúc JSON bắt buộc:
{{
    "total_score": <số nguyên từ 0 đến 100>,
    "classification": "<Phù hợp hoặc Nên xem xét hoặc Chưa phù hợp>",
    "criteria_results": [
        {{
            "criterion_name": "<tên tiêu chí>",
            "weight": <trọng số>,
            "score": <điểm đạt được>,
            "max_score": <điểm tối đa>,
            "comment": "<nhận xét ngắn gọn theo tiêu chí này>"
        }}
    ],
    "matched_skills": [<mảng các chuỗi kỹ năng CV đáp ứng được JD>],
    "missing_skills": [<mảng các chuỗi kỹ năng JD yêu cầu nhưng CV thiếu>],
    "summary": "<1 đoạn văn ngắn bằng tiếng Việt tổng kết mức độ phù hợp của ứng viên>",
    "extracted_info": {{
        "degree": "<Bằng cấp>",
        "major": "<Chuyên ngành>",
        "university": "<Trường đại học>",
        "years_of_experience": <số năm kinh nghiệm>,
        "certificates": ["<chứng chỉ 1>", "<chứng chỉ 2>"]
    }}
}}
"""

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        ai_result = json.loads(response.text)

        normalized_result = normalize_scoring_result(ai_result, criteria_list)

        return normalized_result

    except Exception as exception:
        print("\n" + "=" * 50)
        print("❌ LỖI API GEMINI CHI TIẾT:")
        print(exception)
        print("=" * 50 + "\n")

        return build_default_scoring_result(criteria_list)

    if __name__ == "__main__":
        print("\n--- BẮT ĐẦU TEST MODEL GOOGLE GEMINI ---")
    
        sample_cv_text = "Lập trình viên Fullstack. Kinh nghiệm làm việc với Py, viết script JS và deploy hệ thống lên AWS."
        sample_cv_skills = ["Py", "JS", "AWS"]

        sample_jd_text = "Tuyển dụng kỹ sư phần mềm thành thạo ngôn ngữ Python, JavaScript. Yêu cầu có chứng chỉ Amazon Web Services."
        sample_jd_skills = ["Python", "JavaScript", "Amazon Web Services"]

        print(f" CV: {sample_cv_text}")
        print(f" JD: {sample_jd_text}")
        print("-" * 30)
        print("AI đang đọc hiểu ngữ nghĩa...")
    
        # Gọi hàm chấm điểm
        sample_criteria_list = [
            {
                "name": "Kỹ năng Python/JavaScript",
                "weight": 40
            },
            {
                "name": "Kinh nghiệm triển khai hệ thống",
                "weight": 30
            },
            {
                "name": "Chứng chỉ liên quan",
                "weight": 10
            },
            {
                "name": "Mức độ phù hợp với mô tả công việc",
                "weight": 20
            }
        ]

        ket_qua = calculate_resume_score(
            sample_cv_text,
            sample_jd_text,
            sample_cv_skills,
            sample_jd_skills,
            sample_criteria_list
        )

        print(f" Điểm phù hợp: {ket_qua.get('total_score', 0)}/100")
        print(f" Phân loại: {ket_qua.get('classification', '')}")
        print(f" Kỹ năng khớp: {ket_qua.get('matched_skills', [])}")
        print(f" AI Tổng kết: {ket_qua.get('summary', '')}")
        print(f" Chi tiết tiêu chí: {ket_qua.get('criteria_results', [])}")

def normalize_scoring_result(ai_result, criteria_list):
    criteria_results = []
    total_score = 0

    ai_criteria_results = ai_result.get("criteria_results", [])

    for criterion in criteria_list:
        criterion_name = str(criterion["name"]).strip()
        criterion_weight = int(criterion["weight"])

        matched_ai_criterion = None

        for ai_criterion in ai_criteria_results:
            ai_criterion_name = str(ai_criterion.get("criterion_name", "")).strip()

            if ai_criterion_name == criterion_name:
                matched_ai_criterion = ai_criterion
                break

        score = 0
        comment = "AI chưa đưa ra nhận xét cho tiêu chí này."

        if matched_ai_criterion is not None:
            try:
                score = int(matched_ai_criterion.get("score", 0))
            except Exception:
                score = 0

            comment_from_ai = matched_ai_criterion.get("comment", "")

            if isinstance(comment_from_ai, str) and comment_from_ai.strip() != "":
                comment = comment_from_ai.strip()

        if score < 0:
            score = 0

        if score > criterion_weight:
            score = criterion_weight

        total_score = total_score + score

        criteria_results.append({
            "criterion_name": criterion_name,
            "weight": criterion_weight,
            "score": score,
            "max_score": criterion_weight,
            "comment": comment
        })

    classification = classify_cv(total_score)

    matched_skills = ai_result.get("matched_skills", [])
    missing_skills = ai_result.get("missing_skills", [])
    summary = ai_result.get("summary", "")

    if not isinstance(matched_skills, list):
        matched_skills = []

    if not isinstance(missing_skills, list):
        missing_skills = []

    if not isinstance(summary, str) or summary.strip() == "":
        summary = "Hệ thống đã chấm điểm CV dựa trên các tiêu chí do HR cung cấp."

    extracted_info_raw = ai_result.get("extracted_info", {})
    degree = extracted_info_raw.get("degree")
    major = extracted_info_raw.get("major")
    university = extracted_info_raw.get("university")
    try:
        years_of_experience = float(extracted_info_raw.get("years_of_experience", 0))
    except (ValueError, TypeError):
        years_of_experience = 0
        
    certificates = extracted_info_raw.get("certificates", [])
    if not isinstance(certificates, list):
        certificates = []

    normalized_result = {
        "total_score": total_score,
        "classification": classification,
        "criteria_results": criteria_results,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "summary": summary,
        "extracted_info": {
            "degree": degree,
            "major": major,
            "university": university,
            "years_of_experience": years_of_experience,
            "certificates": certificates
        },
        "ExtractedInfo": {
            "Degree": degree,
            "Major": major,
            "University": university,
            "YearsOfExperience": years_of_experience,
            "Certificates": certificates
        }
    }

    return normalized_result


def classify_cv(total_score):
    if total_score >= 80:
        return "Phù hợp"

    if total_score >= 60:
        return "Nên xem xét"

    return "Chưa phù hợp"


def build_default_scoring_result(criteria_list):
    criteria_results = []

    for criterion in criteria_list:
        criterion_name = str(criterion["name"]).strip()
        criterion_weight = int(criterion["weight"])

        criteria_results.append({
            "criterion_name": criterion_name,
            "weight": criterion_weight,
            "score": 0,
            "max_score": criterion_weight,
            "comment": "Không thể chấm tiêu chí này do lỗi trong quá trình AI phân tích."
        })

    return {
        "total_score": 0,
        "classification": "Chưa phù hợp",
        "criteria_results": criteria_results,
        "matched_skills": [],
        "missing_skills": [],
        "summary": "Đã xảy ra lỗi trong quá trình AI phân tích. Vui lòng kiểm tra lại kết nối mạng hoặc API Key.",
        "extracted_info": {
            "degree": None,
            "major": None,
            "university": None,
            "years_of_experience": 0,
            "certificates": []
        }
    }

def generate_candidate_email(
    email_type,
    candidate_name,
    job_title,
    company_name,
    fit_score,
    classification,
    summary,
    matched_skills,
    missing_skills,
    reject_reason=None,
    email_context=""
):
    if company_name is None or str(company_name).strip() == "":
        company_name = "AI Recruitment"

    if summary is None:
        summary = ""

    if matched_skills is None:
        matched_skills = []

    if missing_skills is None:
        missing_skills = []

    if email_context is None:
        email_context = ""

    email_type = str(email_type).strip().lower()
    email_context_text = str(email_context).strip()
    is_talent_pool_invite = (
        email_type == "invite"
        and "talent pool" in email_context_text.lower()
    )

    matched_skills_text = ", ".join(matched_skills)
    missing_skills_text = ", ".join(missing_skills)

    if email_type == "invite":
        if is_talent_pool_invite:
            task_instruction = f"""
Nhiệm vụ: Viết email CHỦ ĐỘNG mời ứng viên trong Talent Pool/Ngân hàng ứng viên cân nhắc ứng tuyển vào vị trí phù hợp.

Bối cảnh nghiệp vụ:
- Đây KHÔNG phải email phản hồi cho một hồ sơ ứng tuyển mới.
- Ứng viên đang nằm trong Talent Pool/Ngân hàng ứng viên của doanh nghiệp.
- HR chủ động liên hệ lại vì hệ thống nhận thấy hồ sơ/kỹ năng của ứng viên có thể phù hợp với vị trí đang mở.
- Bối cảnh truyền từ hệ thống: {email_context_text}

Tuyệt đối tránh các câu hoặc ý sau:
- "Cảm ơn bạn đã ứng tuyển..."
- "Chúc mừng bạn đã vượt qua vòng sơ loại CV..."
- "Mời bạn tham gia vòng phỏng vấn tiếp theo..." nếu HR chưa nhập lịch phỏng vấn cụ thể.

[YÊU CẦU VỀ NỘI DUNG VÀ VĂN PHONG]
1. Xưng hô: TUYỆT ĐỐI chỉ sử dụng đại từ "bạn", viết hoa nếu đứng đầu câu.
2. Mở đầu: Nhắc rằng công ty đã lưu hồ sơ của bạn trong Talent Pool/Ngân hàng ứng viên.
3. Nêu rằng hiện công ty có vị trí {job_title} đang mở và nhận thấy hồ sơ của bạn có điểm phù hợp.
4. Ghi nhận năng lực: Khen ngợi một cách tự nhiên dựa trên kỹ năng phù hợp đã được cung cấp.
5. Lời mời: Mời bạn cân nhắc cơ hội này hoặc phản hồi email nếu quan tâm.
6. Không đưa lịch phỏng vấn nếu HR chưa nhập lịch.
7. Kết thư: Hướng dẫn ứng viên phản hồi email để HR trao đổi thêm về công việc và quy trình tuyển dụng.

[RÀNG BUỘC ĐẦU RA]
- Văn phong: Chuyên nghiệp, hiện đại, thân thiện, rõ ràng.
- Kết thư BẮT BUỘC đúng format:
  Trân trọng,
  Phòng Nhân sự
  AI Recruitment
"""
        else:
            task_instruction = """
Nhiệm vụ: Viết email mời ứng viên tham gia vòng phỏng vấn tiếp theo.
Email cần thể hiện rằng công ty đánh giá tích cực hồ sơ của ứng viên.

Bắt buộc trong email mời phỏng vấn phải có một đoạn để placeholder thông tin phỏng vấn với format gần như sau:

Thông tin phỏng vấn dự kiến:
- Thời gian: [Điền thời gian]
- Hình thức: [Điền hình thức: trực tuyến/trực tiếp]
- Địa điểm: [Điền địa điểm/link họp]

[YÊU CẦU VỀ NỘI DUNG VÀ VĂN PHONG]
1. Xưng hô: TUYỆT ĐỐI chỉ sử dụng đại từ "bạn", viết hoa nếu đứng đầu câu.
2. Mở đầu: Cảm ơn bạn đã ứng tuyển vào vị trí được cung cấp trong phần thông tin ứng viên tại AI Recruitment.
3. Ghi nhận năng lực: Khen ngợi một cách tự nhiên dựa trên các kỹ năng phù hợp đã được cung cấp.
4. Lời mời: Trân trọng mời bạn tham gia vòng phỏng vấn tiếp theo.
5. Cấu trúc thông tin phỏng vấn: Trình bày rõ ràng dưới dạng Bullet points các mục: Thời gian, Hình thức, Địa điểm (để trống ngoặc vuông [Điền...] cho HR tự nhập).
6. Kết thư: Hướng dẫn ứng viên phản hồi email để xác nhận tham gia. Lời chào trân trọng từ Phòng Tuyển dụng.

[RÀNG BUỘC ĐẦU RA]
- Văn phong: Chuyên nghiệp, hiện đại, thân thiện, rõ ràng.
- Kết thư BẮT BUỘC đúng format:
  Trân trọng,
  Phòng Nhân sự
  AI Recruitment
"""
    else:
        task_instruction = f"""
Nhiệm vụ: Viết email từ chối ứng viên một cách chuyên nghiệp, lịch sự và thấu cảm.
Lý do từ chối HR cung cấp: {reject_reason}

Lưu ý quan trọng:
- Xưng hô: TUYỆT ĐỐI chỉ sử dụng đại từ "bạn", viết hoa nếu đứng đầu câu.
- Nếu ứng viên có điểm cao, tuyệt đối không viết rằng ứng viên yếu hoặc không đủ năng lực.
- Phải diễn đạt khéo léo, tránh gây cảm giác phủ nhận năng lực ứng viên.
- Nếu lý do là đã tuyển đủ người, hãy nhấn mạnh đây là yếu tố thời điểm/chỉ tiêu tuyển dụng, không phải vì năng lực ứng viên không đạt.
[RÀNG BUỘC ĐẦU RA]
[RÀNG BUỘC ĐẦU RA]
- Văn phong: Chuyên nghiệp, hiện đại, thân thiện, rõ ràng.
- Kết thư BẮT BUỘC đúng format:
  Trân trọng,
  Phòng Nhân sự
  AI Recruitment
"""

    prompt = f"""
Bạn là chuyên gia Nhân sự cấp cao, có kỹ năng viết email tuyển dụng chuyên nghiệp.

Hãy viết email phản hồi ứng viên dựa trên dữ liệu sau:

[THÔNG TIN ỨNG VIÊN]
- Tên ứng viên: {candidate_name}
- Vị trí ứng tuyển: {job_title}
- Công ty: {company_name}
- Điểm phù hợp: {fit_score}/100
- Phân loại: {classification}
- Tóm tắt đánh giá AI: {summary}
- Bối cảnh email: {email_context_text}
- Kỹ năng phù hợp: {matched_skills_text}
- Kỹ năng còn thiếu: {missing_skills_text}

[LOẠI EMAIL]
{email_type}

[YÊU CẦU]
{task_instruction}

[RÀNG BUỘC ĐẦU RA]
Trả về đúng JSON duy nhất.
Không dùng markdown.
Không dùng ```json.
Không thêm giải thích bên ngoài JSON.

Cấu trúc JSON bắt buộc:
{{
    "subject": "<tiêu đề email>",
    "body": "<nội dung email dạng HTML đơn giản, dùng các thẻ p, strong, ul, li nếu cần>"
}}
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        result = json.loads(response.text)

        subject = result.get("subject", "")
        body = result.get("body", "")

        if not isinstance(subject, str) or subject.strip() == "":
            if is_talent_pool_invite:
                subject = f"[{company_name}] Lời mời ứng tuyển vị trí {job_title}"
            else:
                subject = f"[{company_name}] Kết quả ứng tuyển vị trí {job_title}"

        if not isinstance(body, str) or body.strip() == "":
            body = build_default_email_body(
                email_type,
                candidate_name,
                job_title,
                reject_reason,
                email_context
            )

        return {
            "subject": subject.strip(),
            "body": body.strip()
        }

    except Exception as exception:
        print("\n" + "=" * 50)
        print("❌ LỖI AI GENERATE EMAIL:")
        print(exception)
        print("=" * 50 + "\n")

        if is_talent_pool_invite:
            fallback_subject = f"[{company_name}] Lời mời ứng tuyển vị trí {job_title}"
        else:
            fallback_subject = f"[{company_name}] Kết quả ứng tuyển vị trí {job_title}"

        return {
            "subject": fallback_subject,
            "body": build_default_email_body(
                email_type,
                candidate_name,
                job_title,
                reject_reason,
                email_context
            )
        }


def build_default_email_body(email_type, candidate_name, job_title, reject_reason=None, email_context=""):
    if email_type == "invite":
        email_context_text = "" if email_context is None else str(email_context)
        is_talent_pool_invite = "talent pool" in email_context_text.lower()

        if is_talent_pool_invite:
            return f"""
<p>Chào {candidate_name},</p>

<p>
Phòng Nhân sự AI Recruitment đang lưu hồ sơ của bạn trong Ngân hàng ứng viên/Talent Pool.
Hiện tại, chúng tôi có vị trí <strong>{job_title}</strong> đang mở và nhận thấy hồ sơ của bạn có thể phù hợp với nhu cầu tuyển dụng lần này.
</p>

<p>
Chúng tôi trân trọng mời bạn cân nhắc cơ hội này. Nếu bạn quan tâm, vui lòng phản hồi email để chúng tôi có thể trao đổi thêm về mô tả công việc, quy trình tuyển dụng và các thông tin liên quan.
</p>

<p>
Rất mong nhận được phản hồi từ bạn.
</p>

<p>
Trân trọng,<br/>
Phòng Nhân sự<br/>
AI Recruitment
</p>
"""

        return f"""
<p>Chào {candidate_name},</p>

<p>
Chúc mừng bạn đã vượt qua vòng sơ loại CV cho vị trí
<strong>{job_title}</strong>.
</p>

<p> 
Chúng tôi rất ấn tượng với hồ sơ của bạn và muốn mời bạn tham gia buổi phỏng vấn
<p>Thông tin phỏng vấn dự kiến:</p>
<ul>
  <li><strong>Thời gian:</strong> [Điền thời gian]</li>
  <li><strong>Hình thức:</strong> [Điền hình thức: trực tuyến/trực tiếp]</li>
  <li><strong>Địa điểm:</strong> [Điền địa điểm/link họp]</li>~
</ul>
</p>

<p>Vui lòng phản hồi email này để xác nhận sự tham gia của bạn.</p>

<p>
Trân trọng,<br/>
Phòng Nhân sự<br/>~~
AI Recruitment
</p>
"""

    if reject_reason is None or str(reject_reason).strip() == "":
        reject_reason = "hồ sơ hiện chưa phù hợp với định hướng tuyển dụng ở thời điểm này"

    return f"""
<p>Chào {candidate_name},</p>

<p>
Cảm ơn bạn đã quan tâm và ứng tuyển vào vị trí
<strong>{job_title}</strong>.
</p>

<p>
Sau khi xem xét kỹ lưỡng, chúng tôi rất tiếc chưa thể tiếp tục đồng hành cùng bạn
trong đợt tuyển dụng này. Lý do chính là: {reject_reason}.
</p>

<p>
Chúng tôi vẫn rất trân trọng sự quan tâm của bạn và sẽ lưu hồ sơ để xem xét cho các cơ hội
phù hợp hơn trong tương lai.
</p>

<p>
Trân trọng,<br/>
Phòng Nhân sự<br/>
AI Recruitment
</p>
"""
