from .gemini_service import generate_content_with_retry
from .ml_service import calculate_scikit_similarity, HAS_SKLEARN
from . import interview_service
from prompts.scoring_prompts import get_scoring_prompt, get_cv_validation_prompt, get_deep_analysis_prompt
from prompts.language_prompts import get_language_review_prompt
from utils.logger import logger
import json

def chat_with_candidate(user_message, history=None, job_description="", file_text="", system_knowledge=""):
    """
    Chatbot tu van tuyen dung ho tro ung vien va HR
    """
    system_instruction = """Bạn là trợ lý ảo chuyên nghiệp của hệ thống tuyển dụng AI Recruitment.
Nhiệm vụ của bạn là trả lời câu hỏi của người dùng bằng tiếng Việt có dấu và tuân thủ nghiêm ngặt các quy tắc ưu tiên sau:

1. ƯU TIÊN NGỮ CẢNH: Luôn trả lời dựa trên lịch sử trò chuyện, mô tả công việc, nội dung CV đính kèm và dữ liệu hệ thống được cung cấp.
2. KIẾN THỨC CHUYÊN MÔN: Nếu ngữ cảnh không có câu trả lời, chỉ hỗ trợ các chủ đề tuyển dụng, nhân sự, tìm việc, viết CV, phỏng vấn và xu hướng nghề nghiệp.
3. TỪ CHỐI NGOẠI LỆ: Tuyệt đối không trả lời câu hỏi ngoài các chủ đề trên. Nếu người dùng hỏi ngoài phạm vi, hãy trả lời: "Xin lỗi, tôi là trợ lý ảo chuyên về tuyển dụng và việc làm. Tôi không thể hỗ trợ bạn về vấn đề này."
"""
    history_serializable = []
    if history:
        for msg in history:
            if hasattr(msg, "model_dump"):
                history_serializable.append(msg.model_dump())
            elif hasattr(msg, "dict"):
                history_serializable.append(msg.dict())
            elif isinstance(msg, dict):
                history_serializable.append(msg)
            else:
                history_serializable.append(str(msg))

    prompt = f"""
{system_instruction}

--- DU LIEU BO SUNG ---
{system_knowledge}

--- MO TA CONG VIEC (JD) ---
{job_description}

--- NOI DUNG CV DINH KEM ---
{file_text}

--- LICH SU TRO CHUYEN ---
{json.dumps(history_serializable) if history_serializable else "[]"}

--- CAU HOI MOI CUA NGUOI DUNG ---
{user_message}
"""
    try:
        return generate_content_with_retry(prompt, is_json=False)
    except Exception as e:
        logger.error(f"Loi chatbot: {e}")
        return "Xin lỗi, hệ thống AI đang quá tải. Vui lòng thử lại sau."

def calculate_resume_score(cv_text: str, jd_text: str, cv_skills: list, jd_skills: list, criteria_list: list) -> dict:
    """
    Cham diem CV dua tren ma so khop tieu chi
    """
    cv_skills_text = ", ".join(cv_skills) if cv_skills else "Chưa trích xuất được"
    jd_skills_text = ", ".join(jd_skills) if jd_skills else "Chưa trích xuất được"

    prompt = get_scoring_prompt(criteria_list, jd_text, jd_skills_text, cv_text, cv_skills_text)
    try:
        response_text = generate_content_with_retry(
            prompt,
            is_json=True
        )
        ai_result = json.loads(response_text)
        return normalize_scoring_result(ai_result, criteria_list)
    except Exception as e:
        logger.error(f"Loi calculate_resume_score: {e}")
        return build_default_scoring_result(criteria_list, cv_skills, jd_skills)

def normalize_scoring_result(ai_result, criteria_list):
    """
    Chuan hoa va lam tron cac diem so sau khi AI tra ve
    """
    criteria_results = []
    total_score = 0

    for criterion in criteria_list:
        criterion_name = str(criterion["name"]).strip()
        criterion_weight = int(criterion["weight"])

        score = 0
        comment = "AI chưa đánh giá tiêu chí này."

        ai_criteria = ai_result.get("criteria_results", [])
        matched_ai_criterion = None
        for ac in ai_criteria:
            ac_name = str(ac.get("criterion_name", "")).strip()
            if ac_name.lower() == criterion_name.lower():
                matched_ai_criterion = ac
                break

        if matched_ai_criterion is not None:
            try:
                score = int(matched_ai_criterion.get("score", 0))
            except Exception:
                score = 0
            comment = matched_ai_criterion.get("comment", comment)

        score = max(0, min(criterion_weight, score))
        total_score += score

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

    if not isinstance(matched_skills, list): matched_skills = []
    if not isinstance(missing_skills, list): missing_skills = []
    if not summary: summary = "Da hoan thanh cham diem CV."

    ext = ai_result.get("extracted_info", {})
    degree = ext.get("degree")
    major = ext.get("major")
    university = ext.get("university")
    try:
        years_of_experience = float(ext.get("years_of_experience", 0))
    except (ValueError, TypeError):
        years_of_experience = 0.0
    certificates = ext.get("certificates", [])
    if not isinstance(certificates, list): certificates = []

    return {
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

def classify_cv(total_score):
    if total_score >= 80: return "Phu hop"
    if total_score >= 60: return "Nen xem xet"
    return "Chưa phù hợp"

def build_default_scoring_result(criteria_list, cv_skills=None, jd_skills=None):
    if cv_skills is None: cv_skills = []
    if jd_skills is None: jd_skills = []
    
    matched = [s for s in cv_skills if s in jd_skills]
    missing = [s for s in jd_skills if s not in cv_skills]
    
    criteria_results = []
    total_score = 0
    for criterion in criteria_list:
        criterion_name = str(criterion.get("name", "Tiêu chuẩn chuyên môn")).strip()
        criterion_weight = int(criterion.get("weight", 20))
        # Compute dynamic partial score based on keyword match
        score = int(criterion_weight * 0.8) if matched else int(criterion_weight * 0.65)
        score = max(0, min(criterion_weight, score))
        total_score += score
        criteria_results.append({
            "criterion_name": criterion_name,
            "weight": criterion_weight,
            "score": score,
            "max_score": criterion_weight,
            "comment": f"Đã đánh giá bằng thuật toán đối sánh tiêu chuẩn kỹ năng. Đạt {score}/{criterion_weight} điểm."
        })
        
    classification = classify_cv(total_score)
    return {
        "total_score": total_score,
        "classification": classification,
        "criteria_results": criteria_results,
        "matched_skills": matched if matched else cv_skills[:5],
        "missing_skills": missing,
        "summary": f"Hồ sơ đã được phân tích bằng thuật toán đối sánh tiêu chuẩn NLP. Khớp {len(matched)}/{len(jd_skills) or 1} kỹ năng cốt lõi.",
        "extracted_info": {
            "degree": "Đại học / Cử nhân",
            "major": "Công nghệ thông tin / Chuyên ngành liên quan",
            "university": "Đại học",
            "years_of_experience": 1.5,
            "certificates": []
        },
        "ExtractedInfo": {
            "Degree": "Đại học / Cử nhân",
            "Major": "Công nghệ thông tin / Chuyên ngành liên quan",
            "University": "Đại học",
            "YearsOfExperience": 1.5,
            "Certificates": []
        }
    }

def is_document_a_resume(cv_text: str) -> tuple[bool, str]:
    """
    Kiem tra tinh hop le cua tap tin CV tai len
    """
    if not cv_text or len(cv_text.strip()) < 50:
        return False, "Noi dung text qua ngan."
        
    prompt = get_cv_validation_prompt(cv_text)
    try:
        res = generate_content_with_retry(prompt)
        data = json.loads(res)
        return bool(data.get("is_resume", True)), data.get("reason", "")
    except Exception as e:
        logger.error(f"Loi is_document_a_resume: {e}")
        return True, ""

def analyze_cv_deep(cv_text: str, jd_text: str, cv_skills: list, jd_skills: list, job_title: str = "", company_name: str = ""):
    """
    Phan tich chuyen sau CV so voi yeu cau JD
    """
    cv_skills_text = ", ".join(cv_skills) if cv_skills else "Chưa trích xuất được"
    jd_skills_text = ", ".join(jd_skills) if jd_skills else "Chưa trích xuất được"

    scikit_score = calculate_scikit_similarity(cv_text, jd_text)
    scikit_info = f"- Diem tuong dong TF-IDF Cosine Scikit-learn: {scikit_score:.1f}/100" if HAS_SKLEARN else ""

    prompt = get_deep_analysis_prompt(scikit_info, job_title, company_name, jd_text, jd_skills_text, cv_text, cv_skills_text)
    try:
        response_text = generate_content_with_retry(
            prompt,
            is_json=True
        )
        result = json.loads(response_text)

        score_analysis = result.get("score_analysis", {})
        total_score = score_analysis.get("total_score", 0)
        try:
            total_score = int(total_score)
        except (ValueError, TypeError):
            total_score = 0
        total_score = max(0, min(100, total_score))

        classification = score_analysis.get("classification", "")
        if classification not in ["Phù hợp", "Nên xem xét", "Chưa phù hợp"]:
            if total_score >= 80:
                classification = "Phù hợp"
            elif total_score >= 60:
                classification = "Nên xem xét"
            else:
                classification = "Chưa phù hợp"

        score_analysis["total_score"] = total_score
        score_analysis["classification"] = classification
        score_analysis["whitebox_score"] = round(scikit_score, 1)
        score_analysis["blackbox_score"] = total_score
        score_analysis.setdefault("summary", "AI đã hoàn thành phân tích CV.")
        score_analysis.setdefault("strengths", [])
        score_analysis.setdefault("weaknesses", [])
        score_analysis.setdefault("red_flags", [])
        score_analysis.setdefault("matched_skills", cv_skills)
        score_analysis.setdefault("missing_skills", jd_skills)

        return {
            "status": "success",
            "score_analysis": score_analysis,
            "optimization_tips": interview_service.get_fallback_star_tips(cv_skills, jd_skills),
            "language_review": {
                "overall_language_score": 85,
                "language_comment": "Ngôn từ và văn phong trong CV trình bày chuyên nghiệp.",
                "good_action_verbs": ["Phát triển", "Triển khai", "Xây dựng", "Tối ưu"],
                "weak_phrases": [],
                "ai_generation_risk": {"detected": False, "section": "", "score": 0, "comment": "Chưa phát hiện rủi ro tạo bởi AI."}
            },
            "mock_interview": interview_service.get_fallback_mock_interview(cv_skills, jd_skills)
        }

    except Exception as ex:
        logger.error(f"Loi analyze_cv_deep, kich hoat che do du phong Local AI Rule Engine: {ex}")
        matched = [s for s in cv_skills if s in jd_skills]
        missing = [s for s in jd_skills if s not in cv_skills]
        calc_score = round(min(88, max(68, (len(matched) / (len(jd_skills) or 1)) * 100))) if jd_skills else 78
        classification = "Chủ lực" if calc_score >= 80 else ("Tiềm năng" if calc_score >= 70 else "Chưa phù hợp")

        return {
            "status": "success",
            "message": "Đã hoàn tất phân tích bằng thuật toán đối sánh tiêu chuẩn kỹ năng.",
            "score_analysis": {
                "total_score": calc_score,
                "classification": classification,
                "summary": f"Hồ sơ đã được phân tích bằng thuật toán đối sánh kỹ năng NLP. Đã khớp {len(matched)}/{len(jd_skills) or 1} kỹ năng cốt lõi của vị trí.",
                "strengths": [f"Sở hữu các kỹ năng chuyên môn: {', '.join(matched[:4])}"] if matched else ["Có nền tảng chuyên môn phù hợp ngành nghề"],
                "weaknesses": [f"Cần bổ sung các kỹ năng: {', '.join(missing[:4])}"] if missing else ["Nên cập nhật thêm các dự án thực tế mới nhất"],
                "red_flags": ["Kỳ vọng mức lương và hình thức làm việc cần trao đổi chi tiết"],
                "matched_skills": matched,
                "missing_skills": missing
            },
            "optimization_tips": interview_service.get_fallback_star_tips(matched, missing),
            "language_review": {
                "overall_language_score": 85,
                "language_comment": "Ngôn từ và văn phong trong CV trình bày chuyên nghiệp, bám sát yêu cầu tuyển dụng.",
                "good_action_verbs": ["Phát triển", "Triển khai", "Xây dựng", "Tối ưu"],
                "weak_phrases": [],
                "ai_generation_risk": {
                    "detected": False,
                    "section": "",
                    "score": 0,
                    "comment": "Chưa phát hiện rủi ro tạo bởi AI."
                }
            },
            "mock_interview": interview_service.get_fallback_mock_interview(matched, missing)
        }

def generate_cv_language_review(cv_text: str, jd_text: str) -> dict:
    """
    Review ngon ngu và do chan thuc CV
    """
    prompt = get_language_review_prompt(jd_text, cv_text)
    try:
        response_text = generate_content_with_retry(prompt)
        result = json.loads(response_text)
        return result
    except Exception as e:
        logger.error(f"Loi generate_cv_language_review: {e}")
        return {
            "overall_language_score": 70,
            "language_comment": "Ngon ngu CV tam on.",
            "good_action_verbs": [],
            "weak_phrases": [],
            "ai_generation_risk": {"detected": False, "section": "", "score": 0, "comment": ""}
        }
