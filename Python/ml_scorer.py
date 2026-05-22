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

def calculate_resume_score(cv_text, jd_text, cv_skills, jd_skills):
    prompt = f"""
    Bạn là một chuyên gia tuyển dụng nhân sự cấp cao. Nhiệm vụ của bạn là đánh giá mức độ phù hợp giữa Hồ sơ ứng viên (CV) và Mô tả công việc (JD) dựa trên nội dung sau:

    --- NỘI DUNG CV ---
    {cv_text}
    Kỹ năng trong CV: {cv_skills}

    --- NỘI DUNG JD ---
    {jd_text}
    Kỹ năng trong JD: {jd_skills}

    Hãy phân tích cẩn thận và trả về ĐÚNG 1 đoạn JSON duy nhất, KHÔNG chứa định dạng markdown (như ```json), không có text thừa ở ngoài, theo đúng cấu trúc sau:
    {{
        "score": <số nguyên từ 0 đến 100 thể hiện mức độ phù hợp tổng thể>,
        "matched_skills": [<mảng các chuỗi kỹ năng CV đáp ứng được JD>],
        "missing_skills": [<mảng các chuỗi kỹ năng JD yêu cầu nhưng CV thiếu>],
        "explanation": "<1 đoạn văn ngắn bằng tiếng Việt giải thích lý do cho số điểm trên và nhận xét chi tiết>"
    }}
    """
    
    try:
        # Sử dụng model gemini-2.5-flash (hoặc gemini-2.0-flash) với SDK mới
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        return json.loads(response.text)
        
    except Exception as e:
        print("\n" + "="*50)
        print(f"❌ LỖI API GEMINI CHI TIẾT:\n{e}")
        print("="*50 + "\n")
        return {
            "score": 0,
            "matched_skills": [],
            "missing_skills": [],
            "explanation": "Đã xảy ra lỗi trong quá trình AI phân tích. Vui lòng kiểm tra lại kết nối mạng hoặc API Key."
        }

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
    ket_qua = calculate_resume_score(sample_cv_text, sample_jd_text, sample_cv_skills, sample_jd_skills)

    print(f" Điểm phù hợp: {ket_qua.get('score', 0)}/100")
    print(f" Kỹ năng khớp: {ket_qua.get('matched_skills', [])}")
    print(f" AI Giải thích: {ket_qua.get('explanation', '')}")
