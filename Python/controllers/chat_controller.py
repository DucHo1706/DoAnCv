from fastapi import APIRouter, UploadFile, File, Form, Request, HTTPException
from typing import Optional
from dtos.request_dtos import ChatMessageModel, GenerateEmailRequest, EvaluateAnswerRequest
from services import scoring_service, interview_service, email_service, doc_parser_service
from utils.logger import logger
from utils.rate_limiter import check_ip_rate_limit
from utils.error_handler import get_user_friendly_error_message
import json

router = APIRouter()

@router.post("/chat")
async def chat_bot(
    req: Request,
    prompt: str = Form(...),
    history: str = Form("[]"),
    job_description: str = Form(""),
    system_knowledge: str = Form(""),
    file: Optional[UploadFile] = File(None)
):
    try:
        check_ip_rate_limit(req, cooldown_seconds=2.0, max_requests_per_minute=30)
        try:
            history_list = json.loads(history)
            history_objs = [ChatMessageModel(**msg) for msg in history_list]
        except Exception:
            history_objs = []

        file_text = ""
        if file is not None and file.filename != "":
            file_bytes = await file.read()
            file_text = doc_parser_service.extract_text_from_file(
                file_bytes, file.filename, file.content_type
            )

        reply = scoring_service.chat_with_candidate(
            prompt, history_objs, job_description, file_text, system_knowledge
        )
        return {"status": "success", "reply": reply, "extracted_text": file_text}
    except HTTPException as he:
        raise he
    except Exception as e:
        msg = get_user_friendly_error_message(e, "Trợ lý AI đang bận. Vui lòng thử lại sau giây lát.")
        return {"status": "error", "message": msg}


@router.post("/evaluate-answer")
async def evaluate_answer(request: EvaluateAnswerRequest, req: Request):
    try:
        check_ip_rate_limit(req, cooldown_seconds=2.0, max_requests_per_minute=30)
        res = interview_service.evaluate_interview_answer(
            question=request.question,
            answer=request.answer,
            job_title=request.job_title
        )
        return res
    except HTTPException as he:
        raise he
    except Exception as e:
        msg = get_user_friendly_error_message(e, "Không thể đánh giá câu trả lời lúc này. Vui lòng thử lại sau.")
        return {"status": "error", "message": msg}


@router.post("/generate-email")
async def generate_email(request: GenerateEmailRequest, req: Request):
    try:
        check_ip_rate_limit(req, cooldown_seconds=2.0, max_requests_per_minute=20)
        email_type = request.email_type.strip().lower()

        if email_type not in ["invite", "reject"]:
            return {
                "status": "error",
                "message": "email_type chi duoc la invite hoac reject."
            }

        if request.candidate_name.strip() == "":
            return {
                "status": "error",
                "message": "Tên ứng viên không được để trống."
            }

        if request.job_title.strip() == "":
            return {
                "status": "error",
                "message": "Tên vị trí ứng tuyển không được để trống."
            }

        if email_type == "reject":
            if request.reject_reason is None or request.reject_reason.strip() == "":
                return {
                    "status": "error",
                    "message": "Vui lòng nhập lý do từ chối."
                }

        result = email_service.generate_candidate_email(
            email_type=email_type,
            candidate_name=request.candidate_name,
            job_title=request.job_title,
            company_name=request.company_name,
            fit_score=request.fit_score,
            classification=request.classification,
            summary=request.summary,
            matched_skills=request.matched_skills,
            missing_skills=request.missing_skills,
            reject_reason=request.reject_reason,
            email_context=request.email_context
        )

        return {
            "status": "success",
            "subject": result["subject"],
            "body": result["body"]
        }

    except HTTPException as he:
        raise he
    except Exception as exception:
        logger.error(f"Loi phat sinh khi generate email: {exception}")
        return {
            "status": "error",
            "message": str(exception)
        }
