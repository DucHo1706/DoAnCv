from fastapi import APIRouter, UploadFile, File, Form, Request, HTTPException
from dtos.request_dtos import LazyAnalysisRequest
from services import cv_analysis_service, interview_service, scoring_service
from services.criterion_validation_service import parse_and_validate_criteria
import nlp_processor
from utils.logger import logger
from utils.rate_limiter import check_ip_rate_limit
from utils.error_handler import get_user_friendly_error_message
from starlette.concurrency import run_in_threadpool
import time

router = APIRouter()

ALLOWED_CV_EXTENSIONS = {".pdf", ".docx", ".png", ".jpg", ".jpeg", ".webp"}
MAX_CV_BYTES = 10 * 1024 * 1024


def _validate_upload_shape(file_bytes: bytes, filename: str) -> None:
    import os
    extension = os.path.splitext(filename or "")[1].lower()
    if extension not in ALLOWED_CV_EXTENSIONS:
        raise ValueError("Định dạng tệp không được hỗ trợ. Vui lòng dùng PDF, DOCX, PNG, JPG hoặc WEBP.")
    if not file_bytes:
        raise ValueError("Tệp CV đang trống.")
    if len(file_bytes) > MAX_CV_BYTES:
        raise ValueError("Tệp CV vượt quá dung lượng tối đa 10 MB.")
    signatures = {
        ".pdf": file_bytes.startswith(b"%PDF-"),
        ".docx": file_bytes.startswith(b"PK"),
        ".png": file_bytes.startswith(b"\x89PNG\r\n\x1a\n"),
        ".jpg": file_bytes.startswith(b"\xff\xd8\xff"),
        ".jpeg": file_bytes.startswith(b"\xff\xd8\xff"),
        ".webp": file_bytes.startswith(b"RIFF") and file_bytes[8:12] == b"WEBP",
    }
    if not signatures.get(extension, False):
        raise ValueError("Nội dung tệp không đúng với định dạng được khai báo hoặc tệp đã bị hỏng.")


@router.post("/validate-cv")
async def validate_cv(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        _validate_upload_shape(file_bytes, file.filename or "")
        extraction = await run_in_threadpool(
            cv_analysis_service.doc_parser_service.extract_document_from_file,
            file_bytes,
            file.filename or "",
            file.content_type or "",
        )
        cv_text = extraction.text or ""
        cv_hash = cv_analysis_service.cache_document_extraction(file_bytes, extraction)
        if not extraction.analysis_safe or len(cv_text.strip()) < 50:
            return {"is_valid": False, "message": cv_analysis_service.OCR_INSUFFICIENT_MESSAGE}
        is_resume, reason = scoring_service.is_document_a_resume(cv_text)
        cv_analysis_service.TEXT_CACHE[cv_hash]["validation"] = (is_resume, reason)
        if not is_resume:
            return {"is_valid": False, "message": f"Tệp đã chọn không phải CV hợp lệ. {reason}".strip()}
        return {"is_valid": True, "message": "CV hợp lệ."}
    except ValueError as error:
        return {"is_valid": False, "message": str(error)}
    except Exception as error:
        logger.error(f"Lỗi kiểm tra CV trước khi nộp: {error}", exc_info=True)
        raise HTTPException(status_code=503, detail="Chưa thể kiểm tra nội dung CV lúc này. Vui lòng thử lại sau.")


@router.post("/extract-cv")
async def extract_cv(file: UploadFile = File(...)):
    """Trích xuất CV dùng chung cho hồ sơ mặc định, không chấm điểm theo job."""
    try:
        file_bytes = await file.read()
        _validate_upload_shape(file_bytes, file.filename or "")
        extraction = await run_in_threadpool(
            cv_analysis_service.doc_parser_service.extract_document_from_file,
            file_bytes,
            file.filename or "",
            file.content_type or "",
        )
        cv_text = extraction.text or ""
        if not extraction.analysis_safe or len(cv_text.strip()) < 50:
            return {
                "status": "insufficient_data",
                "message": "Không đọc được đủ nội dung CV.",
                "extraction_quality": {
                    "method": extraction.method,
                    "quality_score": extraction.quality_score,
                    "quality_level": extraction.quality_level,
                    "warnings": extraction.warnings,
                    "agreement_score": extraction.agreement_score,
                    "agreement_kind": extraction.agreement_kind,
                    "analysis_safe": extraction.analysis_safe,
                },
            }
        is_resume, reason = scoring_service.is_document_a_resume(cv_text)
        if not is_resume:
            return {"status": "invalid_document", "message": reason}
        info = nlp_processor.extract_information(cv_text)
        timeline = cv_analysis_service.extract_experience_timeline(cv_text, info.get("skills", []))
        return {
            "status": "success",
            "message": "Đã trích xuất CV thành công.",
            "raw_text": cv_text,
            "email": info.get("email"),
            "phone": info.get("phone"),
            "skills": info.get("skills", []),
            "years_of_experience": round(float(timeline.get("total_experience_months", 0) or 0) / 12, 2),
            "extraction_quality": {
                "method": extraction.method,
                "quality_score": extraction.quality_score,
                "quality_level": extraction.quality_level,
                "warnings": extraction.warnings,
                "agreement_score": extraction.agreement_score,
                "agreement_kind": extraction.agreement_kind,
                "analysis_safe": extraction.analysis_safe,
            },
        }
    except ValueError as error:
        return {"status": "invalid_document", "message": str(error)}
    except Exception as error:
        logger.error(f"Lỗi trích xuất CV mặc định: {error}", exc_info=True)
        raise HTTPException(status_code=503, detail="Chưa thể trích xuất CV lúc này. Vui lòng thử lại sau.")

@router.post("/score-cv")
async def score_cv(
    request: Request,
    file: UploadFile = File(...),
    job_description: str = Form(...),
    criteria: str = Form(...)
):
    try:
        check_ip_rate_limit(request, cooldown_seconds=0.0, max_requests_per_minute=30)
        criteria_list = parse_and_validate_criteria(criteria)

        file_bytes = await file.read()
        _validate_upload_shape(file_bytes, file.filename or "")
        res = await run_in_threadpool(
            cv_analysis_service.score_resume_sync,
            file_bytes=file_bytes,
            filename=file.filename,
            content_type=file.content_type,
            job_description=job_description,
            criteria_list=criteria_list,
            criteria_raw_str=criteria
        )
        return res
    except HTTPException as he:
        raise he
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except Exception as e:
        msg = get_user_friendly_error_message(e, "Không thể chấm điểm CV lúc này. Vui lòng thử lại sau.")
        raise HTTPException(status_code=503, detail=msg) from e


@router.post("/score-cv-text")
async def score_cv_text(
    request: Request,
    cv_text: str = Form(...),
    job_description: str = Form(...),
    criteria: str = Form(...)
):
    try:
        check_ip_rate_limit(request, cooldown_seconds=0.0, max_requests_per_minute=30)
        criteria_list = parse_and_validate_criteria(criteria)

        normalized_text = cv_text.strip()
        if len(normalized_text) < 80:
            return {"status": "error", "message": "CV trực tuyến chưa có đủ nội dung để phân tích."}

        return await run_in_threadpool(
            cv_analysis_service.score_resume_sync,
            file_bytes=b"",
            filename="cv-builder.txt",
            content_type="text/plain",
            job_description=job_description,
            criteria_list=criteria_list,
            criteria_raw_str=criteria,
            cv_text_override=normalized_text
        )
    except (ValueError, TypeError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except Exception as error:
        logger.error(f"Lỗi chấm CV trực tuyến: {error}", exc_info=True)
        msg = get_user_friendly_error_message(error, "Không thể chấm điểm CV trực tuyến lúc này. Vui lòng thử lại sau.")
        raise HTTPException(status_code=503, detail=msg) from error


@router.post("/analyze-cv-preview")
async def analyze_cv_preview(
    request: Request,
    file: UploadFile = File(...),
    job_description: str = Form(...),
    job_title: str = Form(""),
    company_name: str = Form(""),
    cv_text: str = Form("")
):
    try:
        check_ip_rate_limit(request, cooldown_seconds=10.0, max_requests_per_minute=10)
        
        file_bytes = await file.read()
        res = cv_analysis_service.preview_resume_sync(
            file_bytes=file_bytes,
            filename=file.filename,
            content_type=file.content_type,
            job_description=job_description,
            job_title=job_title,
            company_name=company_name,
            cv_text_override=cv_text.strip() or None
        )
        return res
    except HTTPException as he:
        raise he
    except Exception as e:
        msg = get_user_friendly_error_message(e, "Không thể phân tích hồ sơ lúc này. Vui lòng thử lại sau.")
        return {"status": "error", "message": msg}


@router.post("/analyze-cv-star")
def analyze_cv_star(request_data: LazyAnalysisRequest, req: Request):
    check_ip_rate_limit(req, cooldown_seconds=2.0, max_requests_per_minute=20)
    start = time.time()
    try:
        res = interview_service.generate_cv_star_tips(
            cv_text=request_data.cv_text,
            jd_text=request_data.jd_text,
            cv_skills=request_data.cv_skills,
            jd_skills=request_data.jd_skills
        )
        elapsed = time.time() - start
        logger.info(f"Phân tích STAR hoàn thành trong {elapsed:.1f}s")
        return {"status": "success", "data": res}
    except HTTPException as he:
        raise he
    except Exception as e:
        msg = get_user_friendly_error_message(e, "Không thể tạo gợi ý STAR lúc này. Vui lòng thử lại sau.")
        return {"status": "error", "message": msg}


@router.post("/analyze-cv-language")
def analyze_cv_language(request_data: LazyAnalysisRequest, req: Request):
    check_ip_rate_limit(req, cooldown_seconds=2.0, max_requests_per_minute=20)
    start = time.time()
    try:
        res = scoring_service.generate_cv_language_review(
            cv_text=request_data.cv_text,
            jd_text=request_data.jd_text
        )
        elapsed = time.time() - start
        logger.info(f"Phân tích ngôn ngữ hoàn thành trong {elapsed:.1f}s")
        return {"status": "success", "data": res}
    except HTTPException as he:
        raise he
    except Exception as e:
        msg = get_user_friendly_error_message(e, "Không thể kiểm tra ngôn từ lúc này. Vui lòng thử lại sau.")
        return {"status": "error", "message": msg}


@router.post("/analyze-cv-interview")
def analyze_cv_interview(request_data: LazyAnalysisRequest, req: Request):
    check_ip_rate_limit(req, cooldown_seconds=2.0, max_requests_per_minute=20)
    start = time.time()
    try:
        res = interview_service.generate_cv_mock_interview(
            cv_text=request_data.cv_text,
            jd_text=request_data.jd_text,
            job_title=request_data.job_title,
            company_name=request_data.company_name,
            cv_skills=request_data.cv_skills,
            jd_skills=request_data.jd_skills
        )
        elapsed = time.time() - start
        logger.info(f"Phân tích câu hỏi phỏng vấn hoàn thành trong {elapsed:.1f}s")
        return {"status": "success", "data": res}
    except HTTPException as he:
        raise he
    except Exception as e:
        msg = get_user_friendly_error_message(e, "Không thể tạo gợi ý phỏng vấn lúc này. Vui lòng thử lại sau.")
        return {"status": "error", "message": msg}
