from .gemini_service import generate_content_with_retry
from prompts.star_prompts import get_star_optimization_prompt
from prompts.interview_prompts import get_mock_interview_prompt, get_answer_evaluation_prompt
from utils.logger import logger
import json

def get_fallback_star_tips(cv_skills: list = None, jd_skills: list = None) -> list:
    # Không tạo thành tích, số liệu hoặc câu viết lại khi mô hình AI không trả lời.
    return []

def get_fallback_mock_interview(cv_skills: list = None, jd_skills: list = None) -> list:
    # Không sinh câu hỏi có vẻ cá nhân hóa khi không có kết quả từ mô hình AI.
    return []

def generate_cv_star_tips(cv_text: str, jd_text: str, cv_skills: list = None, jd_skills: list = None) -> list:
    """
    Tao cac goi y toi uu hoa CV theo chuan STAR
    """
    cv_skills_text = ", ".join(cv_skills) if cv_skills else "Chưa trích xuất được"
    jd_skills_text = ", ".join(jd_skills) if jd_skills else "Chưa trích xuất được"

    prompt = get_star_optimization_prompt(jd_text, jd_skills_text, cv_text, cv_skills_text)
    try:
        response_text = generate_content_with_retry(prompt)
        result = json.loads(response_text)
        if isinstance(result, list) and len(result) > 0:
            return result
    except Exception as e:
        logger.error(f"Loi generate_cv_star_tips: {e}")
    
    return get_fallback_star_tips(cv_skills, jd_skills)

def generate_cv_mock_interview(cv_text: str, jd_text: str, job_title: str = "Chưa rõ", company_name: str = "Doanh nghiệp", cv_skills: list = None, jd_skills: list = None) -> list:
    """
    Du doan cac cau hoi phong van nghiep vu dua tren CV va JD
    """
    prompt = get_mock_interview_prompt(job_title, company_name, jd_text, cv_text)
    try:
        response_text = generate_content_with_retry(prompt)
        result = json.loads(response_text)
        if isinstance(result, list) and len(result) > 0:
            return result
    except Exception as e:
        logger.error(f"Loi generate_cv_mock_interview: {e}")
    
    return get_fallback_mock_interview(cv_skills, jd_skills)

def evaluate_interview_answer(question: str, answer: str, job_title: str) -> dict:
    """
    Danh gia cau tra loi phong van theo mo hinh STAR
    """
    prompt = get_answer_evaluation_prompt(job_title, question, answer)
    try:
        response_text = generate_content_with_retry(prompt)
        result = json.loads(response_text)
        return {
            "status": "success",
            "score": int(result.get("score", 50)),
            "strengths": result.get("strengths", "Chưa xác định rõ điểm mạnh."),
            "weaknesses": result.get("weaknesses", "Chưa xác định rõ điểm cần cải thiện."),
            "suggestions": result.get("suggestions", "Cần cụ thể hóa bằng số liệu."),
            "improved_answer": result.get("improved_answer", "Chưa có gợi ý câu trả lời mẫu.")
        }
    except Exception as e:
        logger.error(f"Loi evaluate_interview_answer: {e}")
        # Keep the interview flow usable when every Gemini key is temporarily
        # rate-limited. The response is explicitly marked as a fallback.
        normalized_answer = (answer or "").strip()
        word_count = len(normalized_answer.split())
        has_result = any(token in normalized_answer.lower() for token in ["%", "kết quả", "ket qua", "tăng", "tang", "giảm", "giam"])
        score = min(75, max(35, 35 + min(word_count, 30) + (10 if has_result else 0)))
        return {
            "status": "success",
            "is_fallback": True,
            "score": score,
            "strengths": "Câu trả lời đã nêu được nội dung chính và có thể tiếp tục phát triển theo cấu trúc STAR.",
            "weaknesses": "Hệ thống AI đang tạm bận nên chưa thể đánh giá sâu theo ngữ cảnh vị trí.",
            "suggestions": "Hãy bổ sung rõ Tình huống, Nhiệm vụ, Hành động và Kết quả có số liệu đo lường.",
            "improved_answer": normalized_answer,
            "message": "Đang dùng đánh giá dự phòng; bạn có thể thử lại để nhận phân tích AI đầy đủ."
        }
