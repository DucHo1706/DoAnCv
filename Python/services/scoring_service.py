from .gemini_service import generate_content_with_retry
from .ml_service import calculate_scikit_similarity, HAS_SKLEARN
from prompts.scoring_prompts import get_scoring_prompt, get_cv_validation_prompt, get_deep_analysis_prompt
from prompts.language_prompts import get_language_review_prompt
from utils.logger import logger
import json

def chat_with_candidate(user_message, history=None, job_description="", file_text="", system_knowledge=""):
    """
    Chatbot tu van tuyen dung ho tro ung vien va HR
    """
    system_instruction = """Ban la tro ly ao AI Recruitment Assistant chuyen nghiep cua he thong tuyen dung AI Recruitment.
Nhiem vu cua ban la tra loi cau hoi cua nguoi dung tuan thu NGHIEM NGAC cac quy tac uu tien sau:

1. UU TIEN SO 1 (Ngu canh & Du lieu he thong): LUON tim kiem cau tra loi dua tren cac thong tin duoc cung cap trong ngu canh (Lich su tro chuyen, Mo ta cong viec JD, Noi dung CV dinh kem, Du lieu bo sung). Neu co thong tin phu hop, hay tra loi dua tren do.
2. UU TIEN SO 2 (Kien thuc chuyen mon): Neu ngu canh KHONG CO thong tin, ban duoc phep dung kien thuc cua minh de ho tro, NHUNG CHI DUOC PHEP noi ve cac chu de: Tuyen dung, Nhan su, Tim viec lam, Viet CV, Phong van, Xu huong nghe nghiep.
3. TU CHOI NGOAI LE (Out of scope): Tuyet doi KHONG tra loi bat ky cau hoi nao ngoai cac chu de tren (vi du: khong viet code, khong giai toan, khong lam tho, khong noi chuyen chinh tri, giai tri...). Neu ngu dung hoi ngoai le, hay tra loi mac dinh: "Xin loi, toi la tro ly ao chuyen ve linh vuc Tuyen dung va Viec lam. Toi khong the ho tro ban van de nay."
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
        return f"Xin loi, he thong dang qua tai. Vui long thu lai sau. Chi tiet: {str(e)}"

def calculate_resume_score(cv_text: str, jd_text: str, cv_skills: list, jd_skills: list, criteria_list: list) -> dict:
    """
    Cham diem CV dua tren ma so khop tieu chi
    """
    cv_skills_text = ", ".join(cv_skills) if cv_skills else "Chua trich xuat duoc"
    jd_skills_text = ", ".join(jd_skills) if jd_skills else "Chua trich xuat duoc"

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
        return build_default_scoring_result(criteria_list)

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
        comment = "AI chua danh gia tieu chi nay."

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
    return "Chua phu hop"

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
            "comment": "Loi phan tich tu AI."
        })
    return {
        "total_score": 0,
        "classification": "Chua phu hop",
        "criteria_results": criteria_results,
        "matched_skills": [],
        "missing_skills": [],
        "summary": "Khong the cham diem CV vi ket noi AI bi loi.",
        "extracted_info": {
            "degree": None,
            "major": None,
            "university": None,
            "years_of_experience": 0,
            "certificates": []
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
    cv_skills_text = ", ".join(cv_skills) if cv_skills else "Chua trich xuat duoc"
    jd_skills_text = ", ".join(jd_skills) if jd_skills else "Chua trich xuat duoc"

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
        if classification not in ["Phu hop", "Nen xem xet", "Chua phu hop"]:
            if total_score >= 80:
                classification = "Phu hop"
            elif total_score >= 60:
                classification = "Nen xem xet"
            else:
                classification = "Chua phu hop"

        score_analysis["total_score"] = total_score
        score_analysis["classification"] = classification
        score_analysis["whitebox_score"] = round(scikit_score, 1)
        score_analysis["blackbox_score"] = total_score
        score_analysis.setdefault("summary", "AI da hoan thanh phan tich CV.")
        score_analysis.setdefault("strengths", [])
        score_analysis.setdefault("weaknesses", [])
        score_analysis.setdefault("red_flags", [])
        score_analysis.setdefault("matched_skills", cv_skills)
        score_analysis.setdefault("missing_skills", jd_skills)

        return {
            "status": "success",
            "score_analysis": score_analysis,
            "optimization_tips": [],
            "language_review": {
                "overall_language_score": 0,
                "language_comment": "Chua tai phan tich ngon ngu.",
                "good_action_verbs": [],
                "weak_phrases": [],
                "ai_generation_risk": {"detected": False, "section": "", "score": 0, "comment": ""}
            },
            "mock_interview": []
        }

    except Exception as ex:
        logger.error(f"Loi analyze_cv_deep: {ex}")
        return {
            "status": "error",
            "message": f"AI khong the phan tich CV: {str(ex)}",
            "score_analysis": {
                "total_score": 0,
                "classification": "Chua phu hop",
                "summary": f"Da xay ra loi: {str(ex)}",
                "strengths": [],
                "weaknesses": [],
                "red_flags": [],
                "matched_skills": [],
                "missing_skills": []
            },
            "optimization_tips": [],
            "language_review": {
                "overall_language_score": 0,
                "language_comment": "Khong the phan tich ngon ngu.",
                "good_action_verbs": [],
                "weak_phrases": [],
                "ai_generation_risk": {
                    "detected": False,
                    "section": "",
                    "score": 0,
                    "comment": "Khong the danh gia."
                }
            },
            "mock_interview": []
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
