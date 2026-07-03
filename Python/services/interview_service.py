from .gemini_service import generate_content_with_retry
import json

def generate_cv_star_tips(cv_text: str, jd_text: str, cv_skills: list, jd_skills: list) -> list:
    cv_skills_text = ", ".join(cv_skills) if cv_skills else "Chưa trích xuất được"
    jd_skills_text = ", ".join(jd_skills) if jd_skills else "Chưa trích xuất được"

    prompt = f"""
Bạn là chuyên gia tư vấn tối ưu hóa hồ sơ xin việc (CV Writer).
Hãy phân tích CV so với JD dưới đây và tạo tối đa 5 gợi ý cải thiện CV cụ thể theo mô hình STAR (Tình huống, Nhiệm vụ, Hành động, Kết quả).

--- NỘI DUNG JD ---
{jd_text}
Kỹ năng JD yêu cầu: {jd_skills_text}

--- NỘI DUNG CV ---
{cv_text}
Kỹ năng CV có: {cv_skills_text}

Yêu cầu đầu ra:
1. Trả về ĐÚNG 1 mảng JSON duy nhất.
2. Không dùng markdown, không dùng ```json, không giải thích ngoài JSON.

Cấu trúc JSON bắt buộc:
[
  {{
    "group": "<Kinh nghiệm|Kỹ năng|Dự án|Học vấn|Trình bày>",
    "title": "<tiêu đề ngắn gọn gợi ý>",
    "detail": "<mô tả chi tiết cách tối ưu bằng tiếng Việt>",
    "priority": "<high|medium>",
    "star_guidance": "<hướng dẫn cụ thể cách áp dụng mô hình STAR cho phần này>",
    "example_before": "<câu gốc mơ hồ chưa tối ưu được lấy nguyên văn từ CV>",
    "example_after": "<câu mẫu viết lại chuẩn STAR để lượng hóa và làm nổi bật thành tích>"
  }}
]
"""
    try:
        response_text = generate_content_with_retry(prompt)
        result = json.loads(response_text)
        return result if isinstance(result, list) else []
    except Exception as e:
        print(f"Lỗi generate_cv_star_tips: {e}")
        return []

def generate_cv_mock_interview(cv_text: str, jd_text: str, job_title: str, company_name: str) -> list:
    prompt = f"""
Bạn là một chuyên gia mô phỏng phỏng vấn (Mock Interviewer) chuyên nghiệp.
Hãy phân tích CV và JD dưới đây và dự đoán 3 câu hỏi phỏng vấn nghiệp vụ hóc búa nhất dựa trên sự giao thoa và điểm yếu của hồ sơ.

--- THÔNG TIN CÔNG VIỆC ---
Vị trí: {job_title}
Công ty: {company_name}

--- NỘI DUNG JD ---
{jd_text}

--- NỘI DUNG CV ---
{cv_text}

Yêu cầu đầu ra:
1. Trả về ĐÚNG 1 mảng JSON chứa 3 phần tử.
2. Không dùng markdown, không dùng ```json, không giải thích ngoài JSON.

Cấu trúc JSON bắt buộc:
[
  {{
    "question": "<câu hỏi phỏng vấn bằng tiếng Việt>",
    "intention": "<ý đồ thực tế của nhà tuyển dụng khi hỏi câu này>",
    "star_guide": "<chiến lược trả lời theo mô hình STAR>",
    "best_answer": "<câu trả lời mẫu chuẩn mực đạt điểm tối đa>"
  }}
]
"""
    try:
        response_text = generate_content_with_retry(prompt)
        result = json.loads(response_text)
        return result if isinstance(result, list) else []
    except Exception as e:
        print(f"Lỗi generate_cv_mock_interview: {e}")
        return []

def evaluate_interview_answer(question: str, answer: str, job_title: str) -> dict:
    prompt = f"""
Bạn là một chuyên gia huấn luyện phỏng vấn nhân sự cấp cao (Interview Coach).
Nhiệm vụ của bạn là đánh giá câu trả lời của ứng viên cho câu hỏi phỏng vấn dưới đây:

[VỊ TRÍ TUYỂN DỤNG]
{job_title}

[CÂU HỎI PHỎNG VẤN]
{question}

[CÂU TRẢ LỜI CỦA ỨNG VIÊN]
{answer}

Hãy thực hiện đánh giá chi tiết theo phương pháp STAR (Tình huống, Nhiệm vụ, Hành động, Kết quả).
Nếu câu trả lời quá ngắn hoặc thiếu thông tin, hãy thẳng thắn chỉ ra và hướng dẫn cách bổ sung số liệu/chi tiết.

Yêu cầu đầu ra:
1. Trả về ĐÚNG 1 đối tượng JSON duy nhất.
2. Không sử dụng markdown (không dùng ```json).
3. Không thêm giải thích ngoài JSON.

Cấu trúc JSON bắt buộc:
{{
  "score": <số nguyên từ 0 đến 100>,
  "strengths": "<những điểm tốt trong câu trả lời bằng tiếng Việt>",
  "weaknesses": "<những điểm thiếu sót, cần cải thiện bằng tiếng Việt>",
  "suggestions": "<hướng dẫn chi tiết cách cải thiện bằng tiếng Việt>",
  "improved_answer": "<mẫu câu trả lời xuất sắc hơn đã được tối ưu hóa dựa trên ý của ứng viên>"
}}
"""
    try:
        response_text = generate_content_with_retry(prompt)
        result = json.loads(response_text)
        return {
            "status": "success",
            "score": int(result.get("score", 50)),
            "strengths": result.get("strengths", "Chưa rõ điểm mạnh."),
            "weaknesses": result.get("weaknesses", "Chưa rõ điểm yếu."),
            "suggestions": result.get("suggestions", "Cần cụ thể hóa số liệu thực tế."),
            "improved_answer": result.get("improved_answer", "Không có gợi ý câu trả lời mẫu.")
        }
    except Exception as e:
        print(f"Lỗi chấm điểm phỏng vấn: {e}")
        return {
            "status": "error",
            "message": f"Không thể kết nối AI để đánh giá câu trả lời: {str(e)}"
        }
