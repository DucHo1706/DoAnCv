from fastapi import APIRouter, UploadFile, File, Form
from dtos.request_dtos import LazyAnalysisRequest
from services import cv_analysis_service, interview_service, scoring_service
from utils.logger import logger
import json
import time

router = APIRouter()

@router.post("/score-cv")
async def score_cv(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    criteria: str = Form(...)
):
    try:
        try:
            criteria_list = json.loads(criteria)
        except Exception:
            return {
                "status": "error",
                "message": "Danh sach tieu chi danh gia khong dung dinh dang JSON."
            }

        if not isinstance(criteria_list, list):
            return {
                "status": "error",
                "message": "Danh sach tieu chi danh gia phai la mot mang JSON."
            }

        if len(criteria_list) == 0:
            return {
                "status": "error",
                "message": "Vui long truyen it nhat 1 tieu chi danh gia."
            }

        total_weight = 0
        for criterion in criteria_list:
            if "name" not in criterion or "weight" not in criterion:
                return {
                    "status": "error",
                    "message": "Moi tieu chi phai co name va weight."
                }

            criterion_name = str(criterion["name"]).strip()
            if criterion_name == "":
                return {
                    "status": "error",
                    "message": "Ten tieu chi khong duoc de trong."
                }

            try:
                criterion_weight = int(criterion["weight"])
            except Exception:
                return {
                    "status": "error",
                    "message": "Trong so tieu chi phai la so nguyen."
                }

            if criterion_weight <= 0 or criterion_weight > 100:
                return {
                    "status": "error",
                    "message": "Trong so moi tieu chi phai tu 1 den 100."
                }

            total_weight += criterion_weight

        if total_weight != 100:
            return {
                "status": "error",
                "message": f"Tong trong so tieu chi phai bang 100%. Hien tai dang la {total_weight}%."
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
    except Exception as e:
        logger.error(f"Loi score-cv: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/analyze-cv-preview")
async def analyze_cv_preview(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    job_title: str = Form(""),
    company_name: str = Form("")
):
    try:
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
    except Exception as e:
        logger.error(f"Loi analyze-cv-preview: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/analyze-cv-star")
def analyze_cv_star(request: LazyAnalysisRequest):
    start = time.time()
    try:
        res = interview_service.generate_cv_star_tips(
            cv_text=request.cv_text,
            jd_text=request.jd_text,
            cv_skills=request.cv_skills,
            jd_skills=request.jd_skills
        )
        elapsed = time.time() - start
        logger.info(f"Phan tich STAR hoan thanh trong {elapsed:.1f}s")
        return {"status": "success", "data": res}
    except Exception as e:
        elapsed = time.time() - start
        logger.error(f"Loi phan tich STAR sau {elapsed:.1f}s: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/analyze-cv-language")
def analyze_cv_language(request: LazyAnalysisRequest):
    start = time.time()
    try:
        res = scoring_service.generate_cv_language_review(
            cv_text=request.cv_text,
            jd_text=request.jd_text
        )
        elapsed = time.time() - start
        logger.info(f"Phan tich ngon ngu hoan thanh trong {elapsed:.1f}s")
        return {"status": "success", "data": res}
    except Exception as e:
        elapsed = time.time() - start
        logger.error(f"Loi phan tich ngon ngu sau {elapsed:.1f}s: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/analyze-cv-interview")
def analyze_cv_interview(request: LazyAnalysisRequest):
    start = time.time()
    try:
        res = interview_service.generate_cv_mock_interview(
            cv_text=request.cv_text,
            jd_text=request.jd_text,
            job_title=request.job_title,
            company_name=request.company_name
        )
        elapsed = time.time() - start
        logger.info(f"Phan tich cau hoi phong van hoan thanh trong {elapsed:.1f}s")
        return {"status": "success", "data": res}
    except Exception as e:
        elapsed = time.time() - start
        logger.error(f"Loi phan tich cau hoi phong van sau {elapsed:.1f}s: {e}")
        return {"status": "error", "message": str(e)}
