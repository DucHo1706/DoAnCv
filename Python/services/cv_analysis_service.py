import os
import json
import hashlib
from typing import List, Tuple, Dict, Any
import nlp_processor
from . import doc_parser_service
from . import scoring_service
from . import interview_service
from .timeline_service import extract_experience_timeline
from .section_segmentation_service import segment_cv_sections
from utils.logger import logger

# Cache luu tru cuc bo
TEXT_CACHE: Dict[str, Any] = {}
SCORE_CACHE: Dict[Tuple[str, str, str], Any] = {}

OCR_INSUFFICIENT_MESSAGE = (
    "Hệ thống chưa đọc được nội dung CV với độ tin cậy đủ để phân tích. "
    "Vui lòng dùng tệp rõ nét hơn hoặc PDF/DOCX có văn bản."
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


def _build_insufficient_preview_result(
    cv_text: str = "",
    extraction_quality: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    return {
        "score_analysis": {
            "total_score": 0,
            "classification": "Không đủ dữ liệu",
            "summary": OCR_INSUFFICIENT_MESSAGE,
            "strengths": [],
            "weaknesses": [],
            "red_flags": [],
            "red_flag_suspicions": [],
            "matched_skills": [],
            "missing_skills": [],
            "whitebox_score": 0,
            "blackbox_score": 0,
            "analysis_status": "insufficient"
        },
        "criteria_results": [],
        "optimization_tips": [],
        "language_review": scoring_service.build_insufficient_language_review(
            OCR_INSUFFICIENT_MESSAGE,
            reason="extraction_unreliable",
        ),
        "mock_interview": [],
        "candidate_info": {
            "email": "",
            "phone": "",
            "extracted_skills": []
        },
        "cv_text": cv_text or "",
        "extraction_quality": extraction_quality or {
            "quality_level": "insufficient",
            "analysis_safe": False,
            "warnings": [],
        },
        "analysis_status": "insufficient",
        "message": OCR_INSUFFICIENT_MESSAGE
    }


def _build_insufficient_score_response(
    criteria_list: List[Dict[str, Any]],
    cv_text: str = "",
    extraction_quality: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    criteria_results = [
        {
            "criterion_name": str(criterion.get("name", "Tiêu chí")),
            "weight": int(criterion.get("weight", 0)),
            "score": 0,
            "max_score": int(criterion.get("weight", 0)),
            "comment": "Không đủ dữ liệu OCR để chấm tiêu chí này.",
            "match_level": "INSUFFICIENT_DATA",
            "confidence": 0.0,
            "evidence_text": "",
            "evidence_section": "",
            "extracted_value": "",
            "needs_verification": True
        }
        for criterion in criteria_list
    ]
    analysis = _build_insufficient_preview_result(cv_text, extraction_quality)
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


def serialize_extraction_quality(extraction_result: Any) -> Dict[str, Any]:
    return {
        "method": extraction_result.method,
        "quality_score": extraction_result.quality_score,
        "quality_level": extraction_result.quality_level,
        "warnings": extraction_result.warnings,
        "block_count": len(extraction_result.blocks),
        "alternatives": extraction_result.alternatives,
        "agreement_score": extraction_result.agreement_score,
        "agreement_kind": extraction_result.agreement_kind,
        "analysis_safe": extraction_result.analysis_safe,
    }


_LANGUAGE_INTEGRITY_WARNING_TOKENS = (
    "ký tự lỗi",
    "mã hóa",
    "encoding",
    "mất dấu",
    "nhận dạng sai",
    "độ tin cậy ký tự",
)


def build_language_review_for_extraction(
    cv_text: str,
    job_description: str,
    extraction_quality: Dict[str, Any] | None,
) -> Dict[str, Any]:
    """Đánh giá ngôn từ theo mức chất lượng đọc, không chặn cả CV vì một cảnh báo OCR."""
    quality = extraction_quality or {}
    quality_level = str(quality.get("quality_level", "") or "").casefold()
    analysis_safe = quality.get("analysis_safe") is not False
    warnings = [str(item) for item in quality.get("warnings", []) if str(item).strip()]

    if not analysis_safe or quality_level in {"low", "insufficient"}:
        return scoring_service.build_insufficient_language_review(
            "Văn bản trích xuất chưa đủ tin cậy để đánh giá cách diễn đạt. Hệ thống không quy lỗi đọc tài liệu cho ứng viên.",
            reason="extraction_unreliable",
        )

    review = scoring_service.generate_cv_language_review(
        cv_text=cv_text,
        jd_text=job_description,
    )

    warning_text = " ".join(warnings).casefold()
    has_integrity_limit = quality_level == "partial" or any(
        token in warning_text for token in _LANGUAGE_INTEGRITY_WARNING_TOKENS
    )
    if has_integrity_limit:
        review = dict(review)
        review["analysis_scope"] = "extracted_text_with_quality_limitations"
        review["source_quality_notice"] = (
            "Kết quả chỉ đánh giá phần nội dung hệ thống đọc được. Lỗi dấu, ký tự hoặc bố cục do OCR không được tính là lỗi diễn đạt của ứng viên."
        )
    else:
        review.setdefault("analysis_scope", "full_extracted_text")

    return review


def cache_document_extraction(file_bytes: bytes, extraction_result: Any) -> str:
    """Dùng lại kết quả validate cho score/preview, đặc biệt tránh OCR/Vision hai lần cho cùng tệp."""
    cv_hash = get_bytes_hash(file_bytes)
    entry = TEXT_CACHE.setdefault(cv_hash, {})
    entry["cv_text"] = extraction_result.text or ""
    entry["extraction_quality"] = serialize_extraction_quality(extraction_result)
    clean_cache_if_large()
    return cv_hash

def score_resume_sync(
    file_bytes: bytes,
    filename: str,
    content_type: str,
    job_description: str,
    criteria_list: List[Dict[str, Any]],
    criteria_raw_str: str,
    cv_text_override: str = None
) -> Dict[str, Any]:
    """
    Cham diem CV theo tieu chi HR va JD yeu cau
    """
    cv_hash = get_str_hash(cv_text_override) if cv_text_override is not None else get_bytes_hash(file_bytes)
    jd_hash = get_str_hash(job_description)
    criteria_hash = get_str_hash(criteria_raw_str)
    
    score_key = (cv_hash, jd_hash, criteria_hash)
    
    # 1. Kiem tra Cache cap 2 (Full Score)
    if score_key in SCORE_CACHE:
        logger.info("Lay ket qua cham diem CV tu cache (0ms)")
        return SCORE_CACHE[score_key]

    # 2. Trich xuat noi dung (Kiem tra Cache cap 1)
    extraction_quality = {
        "method": "structured_cv_builder" if cv_text_override is not None else "cache",
        "quality_score": 100.0 if cv_text_override is not None else 0.0,
        "quality_level": "high" if cv_text_override is not None else "unknown",
        "warnings": [],
        "analysis_safe": cv_text_override is not None,
    }
    if cv_text_override is not None:
        cv_text = cv_text_override.strip()
        if cv_hash not in TEXT_CACHE:
            TEXT_CACHE[cv_hash] = {}
        TEXT_CACHE[cv_hash]["cv_text"] = cv_text
    elif cv_hash in TEXT_CACHE and "cv_text" in TEXT_CACHE[cv_hash]:
        logger.info(f"Lay van ban CV tu cache: {cv_hash}")
        cv_text = TEXT_CACHE[cv_hash]["cv_text"]
        extraction_quality = TEXT_CACHE[cv_hash].get("extraction_quality", extraction_quality)
    else:
        extraction_result = doc_parser_service.extract_document_from_file(
            file_bytes,
            filename,
            content_type
        )
        cv_text = extraction_result.text
        extraction_quality = serialize_extraction_quality(extraction_result)
        if cv_text:
            if cv_hash not in TEXT_CACHE:
                TEXT_CACHE[cv_hash] = {}
            TEXT_CACHE[cv_hash]["cv_text"] = cv_text
            TEXT_CACHE[cv_hash]["extraction_quality"] = extraction_quality
            clean_cache_if_large()

    extraction_is_unsafe = (
        cv_text_override is None
        and (
            extraction_quality.get("analysis_safe") is False
            or str(extraction_quality.get("quality_level", "")).casefold() == "insufficient"
            or (_is_image_upload(filename, content_type) and not _has_sufficient_ocr_text(cv_text))
        )
    )
    if extraction_is_unsafe:
        logger.warning("EXTRACTION_UNSAFE: Dừng phân tích CV vì kết quả đọc tài liệu chưa đủ tin cậy.")
        response_data = _build_insufficient_score_response(criteria_list, cv_text, extraction_quality)
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
    experience_timeline = extract_experience_timeline(cv_text, cv_skills)
    normalized_sections = segment_cv_sections(cv_text)

    # Tinh diem khop va tao bao cao
    scoring_result = scoring_service.calculate_resume_score(
        cv_text=cv_text,
        jd_text=job_description,
        cv_skills=cv_skills,
        jd_skills=jd_skills,
        criteria_list=criteria_list
    )
    scoring_result = scoring_service.reconcile_timeline_criteria(
        scoring_result, criteria_list, experience_timeline
    )
    scoring_result = scoring_service.reconcile_structured_criteria(
        scoring_result, criteria_list, cv_text, cv_skills, normalized_sections
    )

    # Chạy các tác vụ phân tích chuyên sâu
    deep_res = {"status": "unavailable", "skill_mining_context": {"status": "insufficient_data"}}
    deep_analysis_status = "unavailable"
    deep_unavailable_reason = ""
    red_flag_suspicions = []
    try:
        deep_res = scoring_service.analyze_cv_deep(
            cv_text=cv_text,
            jd_text=job_description,
            cv_skills=cv_skills,
            jd_skills=jd_skills
        )
        deep_analysis_status = str(deep_res.get("status", "success") or "success")
        score_analysis = deep_res.get("score_analysis", {})
        deep_unavailable_reason = str(score_analysis.get("ai_unavailable_reason", "") or "")
        strengths = score_analysis.get("strengths", [])
        reclassified_improvements = scoring_service.collect_reclassified_improvements(
            score_analysis.get("red_flags", []),
            score_analysis.get("red_flag_suspicions", []),
        )
        weaknesses = scoring_service.merge_analysis_improvements(
            score_analysis.get("weaknesses", []),
            reclassified_improvements,
        )
        red_flags, red_flag_suspicions = scoring_service.partition_red_flags(
            score_analysis.get("red_flags", []),
            cv_text,
            extraction_quality,
            declared_suspicions=score_analysis.get("red_flag_suspicions", []),
        )
    except Exception as e:
        logger.error(f"Loi khi phan tich chuyen sau CV: {e}")
        deep_analysis_status = "error"
        strengths, weaknesses, red_flags, red_flag_suspicions = [], [], [], []

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
        language_review = build_language_review_for_extraction(
            cv_text=cv_text,
            job_description=job_description,
            extraction_quality=extraction_quality,
        )
    except Exception as e:
        logger.error(f"Loi khi review ngon tu CV: {e}")
        language_review = scoring_service.build_insufficient_language_review(
            "Chưa thể hoàn tất đánh giá ngôn từ từ nội dung CV đã trích xuất.",
            reason="analysis_error",
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

    criteria_results = scoring_result.get("criteria_results", [])
    total_weight = sum(max(0, item.get("weight", 0) or 0) for item in criteria_results)
    weighted_confidence = sum(
        max(0, item.get("weight", 0) or 0) * max(0.0, min(1.0, item.get("confidence", 0) or 0))
        for item in criteria_results
    )
    analysis_confidence = round((weighted_confidence / total_weight) * 100) if total_weight else 0
    evidence_weight = sum(
        max(0, item.get("weight", 0) or 0)
        for item in criteria_results
        if str(item.get("evidence_text", "") or "").strip()
    )
    evidence_coverage = round((evidence_weight / total_weight) * 100) if total_weight else 0
    verification_count = sum(1 for item in criteria_results if item.get("needs_verification") is True)

    # Gom goi tat ca thong tin
    full_analysis_data = {
        "analysis_version": 4,
        "extracted_skills": cv_skills,
        "score_analysis": {
            "total_score": scoring_result.get("total_score", 0),
            "classification": scoring_result.get("classification", "Chưa phân loại"),
            "analysis_confidence": analysis_confidence,
            "evidence_coverage": evidence_coverage,
            "verification_count": verification_count,
            "deep_analysis_status": deep_analysis_status,
            "ai_unavailable_reason": deep_unavailable_reason,
            "red_flag_review_status": "completed" if deep_analysis_status == "success" else "unavailable",
            "summary": scoring_result.get("summary", "Da hoan thanh phan tich CV."),
            "strengths": strengths,
            "weaknesses": weaknesses,
            "red_flags": red_flags,
            "red_flag_suspicions": red_flag_suspicions,
            "matched_skills": scoring_result.get("matched_skills", []),
            "missing_skills": scoring_result.get("missing_skills", [])
        },
        "extraction_quality": extraction_quality,
        "experience_timeline": experience_timeline,
        "normalized_sections": normalized_sections,
        "skill_mining_context": deep_res.get("skill_mining_context", {"status": "insufficient_data"}) if isinstance(deep_res, dict) else {"status": "insufficient_data"},
        "criteria_results": criteria_results,
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
            "RawText": cv_text,
            "extraction_quality": extraction_quality,
            "experience_timeline": experience_timeline
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
    company_name: str,
    cv_text_override: str | None = None
) -> Dict[str, Any]:
    """
    Phan tich nhanh CV phục vụ xem truoc (Preview)
    """
    cv_hash = get_bytes_hash(cv_text_override.encode("utf-8") if cv_text_override else file_bytes)

    extraction_quality = {
        "method": "structured_cv_builder" if cv_text_override else "cache",
        "quality_score": 100.0 if cv_text_override else 0.0,
        "quality_level": "high" if cv_text_override else "unknown",
        "warnings": [],
        "analysis_safe": bool(cv_text_override),
    }
    # Kiem tra Cache text
    if cv_text_override:
        cv_text = cv_text_override
        if cv_hash not in TEXT_CACHE:
            TEXT_CACHE[cv_hash] = {}
        TEXT_CACHE[cv_hash]["cv_text"] = cv_text
    elif cv_hash in TEXT_CACHE and "cv_text" in TEXT_CACHE[cv_hash]:
        logger.info(f"Lay text CV tu cache trong preview: {cv_hash}")
        cv_text = TEXT_CACHE[cv_hash]["cv_text"]
        extraction_quality = TEXT_CACHE[cv_hash].get("extraction_quality", extraction_quality)
    else:
        extraction_result = doc_parser_service.extract_document_from_file(
            file_bytes,
            filename,
            content_type
        )
        cv_text = extraction_result.text
        extraction_quality = serialize_extraction_quality(extraction_result)
        if cv_text:
            if cv_hash not in TEXT_CACHE:
                TEXT_CACHE[cv_hash] = {}
            TEXT_CACHE[cv_hash]["cv_text"] = cv_text
            TEXT_CACHE[cv_hash]["extraction_quality"] = extraction_quality
            clean_cache_if_large()

    extraction_is_unsafe = (
        not cv_text_override
        and (
            extraction_quality.get("analysis_safe") is False
            or str(extraction_quality.get("quality_level", "")).casefold() == "insufficient"
            or (_is_image_upload(filename, content_type) and not _has_sufficient_ocr_text(cv_text))
        )
    )
    if extraction_is_unsafe:
        logger.warning("EXTRACTION_UNSAFE: Dừng xem trước vì kết quả đọc tài liệu chưa đủ tin cậy.")
        return _build_insufficient_preview_result(cv_text, extraction_quality)

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
    experience_timeline = extract_experience_timeline(cv_text, cv_skills)
    normalized_sections = segment_cv_sections(cv_text)

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
    result["extraction_quality"] = extraction_quality
    result["experience_timeline"] = experience_timeline
    result["normalized_sections"] = normalized_sections
    result["cv_text"] = cv_text
    result["job_description"] = job_description

    return result
