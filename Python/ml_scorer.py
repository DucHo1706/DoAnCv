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

def calculate_resume_score(cv_text, jd_text, cv_skills, jd_skills, criteria_list):
    criteria_json = json.dumps(criteria_list, ensure_ascii=False, indent=2)

    prompt = f"""
Bạn là một chuyên gia tuyển dụng nhân sự cấp cao.

Nhiệm vụ của bạn là đánh giá mức độ phù hợp giữa Hồ sơ ứng viên (CV) và Mô tả công việc (JD).

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
    "summary": "<1 đoạn văn ngắn bằng tiếng Việt tổng kết mức độ phù hợp của ứng viên>"
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

    normalized_result = {
        "total_score": total_score,
        "classification": classification,
        "criteria_results": criteria_results,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "summary": summary
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
        "summary": "Đã xảy ra lỗi trong quá trình AI phân tích. Vui lòng kiểm tra lại kết nối mạng hoặc API Key."
    }
