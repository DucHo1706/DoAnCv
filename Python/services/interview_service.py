from .gemini_service import generate_content_with_retry
from prompts.star_prompts import get_star_optimization_prompt
from prompts.interview_prompts import get_mock_interview_prompt, get_answer_evaluation_prompt
from utils.logger import logger
import json

def generate_cv_star_tips(cv_text: str, jd_text: str, cv_skills: list, jd_skills: list) -> list:
    """
    Tao cac goi y toi uu hoa CV theo chuan STAR
    """
    cv_skills_text = ", ".join(cv_skills) if cv_skills else "Chua trich xuat duoc"
    jd_skills_text = ", ".join(jd_skills) if jd_skills else "Chua trich xuat duoc"

    prompt = get_star_optimization_prompt(jd_text, jd_skills_text, cv_text, cv_skills_text)
    try:
        response_text = generate_content_with_retry(prompt)
        result = json.loads(response_text)
        return result if isinstance(result, list) else []
    except Exception as e:
        logger.error(f"Loi generate_cv_star_tips: {e}")
        return []

def generate_cv_mock_interview(cv_text: str, jd_text: str, job_title: str = "Chưa rõ", company_name: str = "Doanh nghiệp") -> list:
    """
    Du doan cac cau hoi phong van nghiep vu dua tren CV va JD
    """
    prompt = get_mock_interview_prompt(job_title, company_name, jd_text, cv_text)
    try:
        response_text = generate_content_with_retry(prompt)
        result = json.loads(response_text)
        return result if isinstance(result, list) else []
    except Exception as e:
        logger.error(f"Loi generate_cv_mock_interview: {e}")
        return []

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
            "strengths": result.get("strengths", "Chua ro diem manh."),
            "weaknesses": result.get("weaknesses", "Chua ro diem yeu."),
            "suggestions": result.get("suggestions", "Can cu the hoa so lieu."),
            "improved_answer": result.get("improved_answer", "Khong co goi y cau tra loi mau.")
        }
    except Exception as e:
        logger.error(f"Loi evaluate_interview_answer: {e}")
        return {
            "status": "error",
            "message": f"Loi ket noi AI khi cham diem phong van: {str(e)}"
        }
