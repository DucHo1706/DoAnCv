import os
import json
import hashlib
from typing import List, Tuple, Dict, Any
import pdf_extractor
import nlp_processor
from . import doc_parser_service
from . import scoring_service
from . import interview_service
from .skills_sync_service import sync_skills_to_db
from utils.logger import logger

# Cache luu tru cuc bo
TEXT_CACHE: Dict[str, Any] = {}
SCORE_CACHE: Dict[Tuple[str, str, str], Any] = {}

OCR_INSUFFICIENT_MESSAGE = (
    "OCR không trích xuất đủ nội dung từ ảnh CV để thực hiện đối sánh. "
    "Điểm tương thích được đặt về 0%; vui lòng tải ảnh rõ hơn hoặc sử dụng tệp PDF/DOCX."
)


def _is_image_upload(filename: str, content_type: str) -> bool:
    normalized_type = (content_type or "").lower()
    normalized_name = (filename or "").lower()
    return normalized_type in {"image/png", "image/jpeg", "image/jpg", "image/webp"} or normalized_name.endswith(
        (".png", ".jpg", ".jpeg", ".webp")
    )


def _has_sufficient_ocr_text(text: str) -> bool:
    normalized_text = (text or "").strip()
    return len(normalized_text) >= 200 and len(normalized_text.split()) >= 35


def _build_insufficient_preview_result(cv_text: str = "") -> Dict[str, Any]:
    return {
        "score_analysis": {
            "total_score": 0,
            "classification": "Không đủ dữ liệu",
            "summary": OCR_INSUFFICIENT_MESSAGE,
            "strengths": [],
            "weaknesses": [],
            "red_flags": [],
            "matched_skills": [],
            "missing_skills": [],
            "whitebox_score": 0,
            "blackbox_score": 0,
            "analysis_status": "insufficient"
        },
        "criteria_results": [],
        "optimization_tips": [],
        "language_review": scoring_service.build_insufficient_language_review(OCR_INSUFFICIENT_MESSAGE),
        "mock_interview": [],
        "candidate_info": {
            "email": "",
            "phone": "",
            "extracted_skills": []
        },
        "cv_text": cv_text or "",
        "analysis_status": "insufficient",
        "message": OCR_INSUFFICIENT_MESSAGE
    }


def _build_insufficient_score_response(criteria_list: List[Dict[str, Any]], cv_text: str = "") -> Dict[str, Any]:
    criteria_results = [
        {
            "criterion_name": str(criterion.get("name", "Tiêu chí")),
            "weight": int(criterion.get("weight", 0)),
            "score": 0,
            "max_score": int(criterion.get("weight", 0)),
            "comment": "Không đủ dữ liệu OCR để chấm tiêu chí này."
        }
        for criterion in criteria_list
    ]
    analysis = _build_insufficient_preview_result(cv_text)
    matching_result = {
        "total_score": 0,
        "classification": "Không đủ dữ liệu",
        "criteria_results": criteria_results,
        "matched_skills": [],
        "missing_skills": [],
        "extracted_info": {
            "degree": None,
            "major": None,
            "university": None,
            "years_of_experience": 0,
            "certificates": []
        },
        "whitebox_score": 0,
        "blackbox_score": 0,
        "analysis_status": "insufficient"
    }
    analysis["criteria_results"] = criteria_results
    matching_result["summary"] = json.dumps(analysis, ensure_ascii=False)
    return {
        "status": "success",
        "message": OCR_INSUFFICIENT_MESSAGE,
        "candidate_info": {
            "email": "",
            "phone": "",
            "extracted_skills": [],
            "raw_text": cv_text or "",
            "ExtractedSkills": [],
            "RawText": cv_text or ""
        },
        "matching_result": matching_result
    }

def get_bytes_hash(data: bytes) -> str:
    """Tinh ma hash SHA-256 cua tap tin bytes"""
    return hashlib.sha256(data).hexdigest()

def get_str_hash(text: str) -> str:
    """Tinh ma hash SHA-256 cua chuoi van ban"""
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()

def clean_cache_if_large():
    """Don dep bo nho dem de tranh day RAM"""
    global TEXT_CACHE, SCORE_CACHE
    if len(TEXT_CACHE) > 500:
        first_key = next(iter(TEXT_CACHE))
        TEXT_CACHE.pop(first_key, None)
    if len(SCORE_CACHE) > 500:
        first_key = next(iter(SCORE_CACHE))
        SCORE_CACHE.pop(first_key, None)

def score_resume_sync(
    file_bytes: bytes,
    filename: str,
    content_type: str,
    job_description: str,
    criteria_list: List[Dict[str, Any]],
    criteria_raw_str: str
) -> Dict[str, Any]:
    """
    Cham diem CV theo tieu chi HR va JD yeu cau
    """
    cv_hash = get_bytes_hash(file_bytes)
    jd_hash = get_str_hash(job_description)
    criteria_hash = get_str_hash(criteria_raw_str)
    
    score_key = (cv_hash, jd_hash, criteria_hash)
    
    # 1. Kiem tra Cache cap 2 (Full Score)
    if score_key in SCORE_CACHE:
        logger.info("Lay ket qua cham diem CV tu cache (0ms)")
        return SCORE_CACHE[score_key]

    # 2. Trich xuat noi dung (Kiem tra Cache cap 1)
    if cv_hash in TEXT_CACHE and "cv_text" in TEXT_CACHE[cv_hash]:
        logger.info(f"Lay van ban CV tu cache: {cv_hash}")
        cv_text = TEXT_CACHE[cv_hash]["cv_text"]
    else:
        cv_text = doc_parser_service.extract_text_from_file(
            file_bytes,
            filename,
            content_type
        )
        if cv_text:
            if cv_hash not in TEXT_CACHE:
                TEXT_CACHE[cv_hash] = {}
            TEXT_CACHE[cv_hash]["cv_text"] = cv_text
            clean_cache_if_large()

    if _is_image_upload(filename, content_type) and not _has_sufficient_ocr_text(cv_text):
        logger.warning("OCR ảnh CV không đủ dữ liệu; trả kết quả 0% thay vì suy diễn điểm.")
        response_data = _build_insufficient_score_response(criteria_list, cv_text)
        SCORE_CACHE[score_key] = response_data
        clean_cache_if_large()
        return response_data

    if not cv_text:
        raise ValueError("Không thể trích xuất nội dung từ CV này. Vui lòng chọn tệp khác.")

    # 3. Kiem dinh tinh hop le cua CV
    if cv_hash in TEXT_CACHE and "validation" in TEXT_CACHE[cv_hash]:
        logger.info(f"Lay ket qua kiem dinh CV tu cache: {cv_hash}")
        is_resume, reason = TEXT_CACHE[cv_hash]["validation"]
    else:
        is_resume, reason = scoring_service.is_document_a_resume(cv_text)
        if cv_hash not in TEXT_CACHE:
            TEXT_CACHE[cv_hash] = {}
        TEXT_CACHE[cv_hash]["validation"] = (is_resume, reason)
        clean_cache_if_large()

    if not is_resume:
        raise ValueError(f"Tài liệu tải lên không phải CV hợp lệ. Chi tiết: {reason}")

    # Trich xuat ky nang bang NLP
    extracted_info = nlp_processor.extract_information(cv_text)
    cv_skills = extracted_info["skills"]

    jd_info = nlp_processor.extract_information(job_description)
    jd_skills = jd_info["skills"]

    # Tinh diem khop va tao bao cao
    scoring_result = scoring_service.calculate_resume_score(
        cv_text=cv_text,
        jd_text=job_description,
        cv_skills=cv_skills,
        jd_skills=jd_skills,
        criteria_list=criteria_list
    )

    # Chạy các tác vụ phân tích chuyên sâu
    try:
        deep_res = scoring_service.analyze_cv_deep(
            cv_text=cv_text,
            jd_text=job_description,
            cv_skills=cv_skills,
            jd_skills=jd_skills
        )
        score_analysis = deep_res.get("score_analysis", {})
        strengths = score_analysis.get("strengths", [])
        weaknesses = score_analysis.get("weaknesses", [])
        red_flags = score_analysis.get("red_flags", [])
    except Exception as e:
        logger.error(f"Loi khi phan tich chuyen sau CV: {e}")
        strengths, weaknesses, red_flags = [], [], []

    try:
        star_tips = interview_service.generate_cv_star_tips(
            cv_text=cv_text,
            jd_text=job_description,
            cv_skills=cv_skills,
            jd_skills=jd_skills
        )
    except Exception as e:
        logger.error(f"Loi khi tao goi y STAR: {e}")
        star_tips = interview_service.get_fallback_star_tips(cv_skills, jd_skills)

    try:
        language_review = scoring_service.generate_cv_language_review(
            cv_text=cv_text,
            jd_text=job_description
        )
    except Exception as e:
        logger.error(f"Loi khi review ngon tu CV: {e}")
        language_review = scoring_service.build_insufficient_language_review(
            "Chưa thể hoàn tất đánh giá ngôn từ từ nội dung CV đã trích xuất."
        )

    try:
        mock_interview = interview_service.generate_cv_mock_interview(
            cv_text=cv_text,
            jd_text=job_description,
            cv_skills=cv_skills,
            jd_skills=jd_skills
        )
    except Exception as e:
        logger.error(f"Loi khi tao cau hoi phong van: {e}")
        mock_interview = interview_service.get_fallback_mock_interview(cv_skills, jd_skills)

    # Gom goi tat ca thong tin
    full_analysis_data = {
        "score_analysis": {
            "total_score": scoring_result.get("total_score", 0),
            "classification": scoring_result.get("classification", "Chưa phân loại"),
            "summary": scoring_result.get("summary", "Da hoan thanh phan tich CV."),
            "strengths": strengths,
            "weaknesses": weaknesses,
            "red_flags": red_flags,
            "matched_skills": scoring_result.get("matched_skills", []),
            "missing_skills": scoring_result.get("missing_skills", [])
        },
        "criteria_results": scoring_result.get("criteria_results", []),
        "optimization_tips": star_tips,
        "language_review": language_review,
        "mock_interview": mock_interview
    }

    scoring_result["summary"] = json.dumps(full_analysis_data, ensure_ascii=False)

    response_data = {
        "status": "success",
        "candidate_info": {
            "email": extracted_info["email"],
            "phone": extracted_info["phone"],
            "extracted_skills": cv_skills,
            "raw_text": cv_text,
            "ExtractedSkills": cv_skills,
            "RawText": cv_text
        },
        "matching_result": scoring_result
    }

    # Luu vao Cache cap 2
    SCORE_CACHE[score_key] = response_data
    clean_cache_if_large()

    return response_data


def preview_resume_sync(
    file_bytes: bytes,
    filename: str,
    content_type: str,
    job_description: str,
    job_title: str,
    company_name: str
) -> Dict[str, Any]:
    """
    Phan tich nhanh CV phục vụ xem truoc (Preview)
    """
    cv_hash = get_bytes_hash(file_bytes)

    # Kiem tra Cache text
    if cv_hash in TEXT_CACHE and "cv_text" in TEXT_CACHE[cv_hash]:
        logger.info(f"Lay text CV tu cache trong preview: {cv_hash}")
        cv_text = TEXT_CACHE[cv_hash]["cv_text"]
    else:
        cv_text = doc_parser_service.extract_text_from_file(
            file_bytes,
            filename,
            content_type
        )
        if cv_text:
            if cv_hash not in TEXT_CACHE:
                TEXT_CACHE[cv_hash] = {}
            TEXT_CACHE[cv_hash]["cv_text"] = cv_text
            clean_cache_if_large()

    if _is_image_upload(filename, content_type) and not _has_sufficient_ocr_text(cv_text):
        logger.warning("OCR ảnh CV không đủ dữ liệu trong chế độ xem trước; hiển thị 0%.")
        return _build_insufficient_preview_result(cv_text)

    if not cv_text or cv_text.strip() == "":
        raise ValueError("Không thể trích xuất nội dung từ CV. Vui lòng kiểm tra lại định dạng tệp.")

    # Kiem dinh tinh hop le
    if cv_hash in TEXT_CACHE and "validation" in TEXT_CACHE[cv_hash]:
        logger.info(f"Lay ket qua kiem dinh tu cache trong preview: {cv_hash}")
        is_resume, reason = TEXT_CACHE[cv_hash]["validation"]
    else:
        is_resume, reason = scoring_service.is_document_a_resume(cv_text)
        if cv_hash not in TEXT_CACHE:
            TEXT_CACHE[cv_hash] = {}
        TEXT_CACHE[cv_hash]["validation"] = (is_resume, reason)
        clean_cache_if_large()

    if not is_resume:
        raise ValueError(f"Tài liệu tải lên không phải CV hợp lệ. Chi tiết: {reason}")

    # Trich xuat ky nang
    cv_info = nlp_processor.extract_information(cv_text)
    cv_skills = cv_info.get("skills", [])

    jd_info = nlp_processor.extract_information(job_description)
    jd_skills = jd_info.get("skills", [])

    # Phan tich nhanh tab 1
    result = scoring_service.analyze_cv_deep(
        cv_text=cv_text,
        jd_text=job_description,
        cv_skills=cv_skills,
        jd_skills=jd_skills,
        job_title=job_title,
        company_name=company_name
    )

    result["candidate_info"] = {
        "email": cv_info.get("email", ""),
        "phone": cv_info.get("phone", ""),
        "extracted_skills": cv_skills
    }
    result["cv_text"] = cv_text
    result["job_description"] = job_description

    # Hoc tu dong ky nang moi va dong bo sang C# SQL
    try:
        gemini_skills = []
        score_analysis = result.get("score_analysis", {})
        if isinstance(score_analysis, dict):
            matched = score_analysis.get("matched_skills")
            missing = score_analysis.get("missing_skills")
            if isinstance(matched, list):
                gemini_skills.extend(matched)
            if isinstance(missing, list):
                gemini_skills.extend(missing)
        
        if gemini_skills:
            existing_skills = set()
            if os.path.exists("skills.json"):
                with open("skills.json", "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        existing_skills = set(s.lower().strip() for s in data if s.strip())
            
            new_skills = set(s.lower().strip() for s in gemini_skills if s.strip()) - existing_skills
            if new_skills:
                merged = sorted(existing_skills | new_skills)
                with open("skills.json", "w", encoding="utf-8") as f:
                    json.dump(merged, f, ensure_ascii=False, indent=2)
                nlp_processor.reload_knowledge_base()
                logger.info(f"Da tu dong hoc {len(new_skills)} ky nang moi")
                sync_skills_to_db([s.strip() for s in gemini_skills if s.strip() and s.lower().strip() in new_skills])
    except Exception as learn_err:
        logger.error(f"Loi khi hoc ky nang tu dong: {learn_err}")

    return result
