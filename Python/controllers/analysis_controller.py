from fastapi import APIRouter, UploadFile, File, Form, Request, HTTPException
from dtos.request_dtos import LazyAnalysisRequest
from services import cv_analysis_service, interview_service, scoring_service
from utils.logger import logger
from utils.rate_limiter import check_ip_rate_limit
from utils.error_handler import get_user_friendly_error_message
import json
import time

router = APIRouter()

@router.post("/score-cv")
async def score_cv(
    request: Request,
    file: UploadFile = File(...),
    job_description: str = Form(...),
    criteria: str = Form(...)
):
    try:
        check_ip_rate_limit(request, cooldown_seconds=10.0, max_requests_per_minute=10)
        try:
            criteria_list = json.loads(criteria)
        except Exception:
            return {
                "status": "error",
                "message": "Danh sách tiêu chí đánh giá không đúng định dạng JSON."
            }

        if not isinstance(criteria_list, list):
            return {
                "status": "error",
                "message": "Danh sách tiêu chí đánh giá phải là một mảng JSON."
            }

        if len(criteria_list) == 0:
            return {
                "status": "error",
                "message": "Vui lòng truyền ít nhất 1 tiêu chí đánh giá."
            }

        total_weight = 0
        for criterion in criteria_list:
            if "name" not in criterion or "weight" not in criterion:
                return {
                    "status": "error",
                    "message": "Mỗi tiêu chí phải có name và weight."
                }

            criterion_name = str(criterion["name"]).strip()
            if criterion_name == "":
                return {
                    "status": "error",
                    "message": "Tên tiêu chí không được để trống."
                }

            try:
                criterion_weight = int(criterion["weight"])
            except Exception:
                return {
                    "status": "error",
                    "message": "Trọng số tiêu chí phải là số nguyên."
                }

            if criterion_weight <= 0 or criterion_weight > 100:
                return {
                    "status": "error",
                    "message": "Trọng số mỗi tiêu chí phải từ 1 đến 100."
                }

            total_weight += criterion_weight

        if total_weight != 100:
            return {
                "status": "error",
                "message": f"Tổng trọng số tiêu chí phải bằng 100%. Hiện tại đang là {total_weight}%."
            }

        file_bytes = await file.read()
        res = cv_analysis_service.score_resume_sync(
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
    except Exception as e:
        msg = get_user_friendly_error_message(e, "Không thể chấm điểm CV lúc này. Vui lòng thử lại sau.")
        return {"status": "error", "message": msg}


@router.post("/analyze-cv-preview")
async def analyze_cv_preview(
    request: Request,
    file: UploadFile = File(...),
    job_description: str = Form(...),
    job_title: str = Form(""),
    company_name: str = Form("")
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
            company_name=company_name
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
            company_name=request_data.company_name
        )
        elapsed = time.time() - start
        logger.info(f"Phân tích câu hỏi phỏng vấn hoàn thành trong {elapsed:.1f}s")
        return {"status": "success", "data": res}
    except HTTPException as he:
        raise he
    except Exception as e:
        msg = get_user_friendly_error_message(e, "Không thể tạo gợi ý phỏng vấn lúc này. Vui lòng thử lại sau.")
        return {"status": "error", "message": msg}
