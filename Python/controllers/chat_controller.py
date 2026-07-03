from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
from dtos.request_dtos import ChatMessageModel, GenerateEmailRequest, EvaluateAnswerRequest
from services import scoring_service, interview_service, email_service, doc_parser_service
from utils.logger import logger
import json

router = APIRouter()

@router.post("/chat")
async def chat_bot(
    prompt: str = Form(...),
    history: str = Form("[]"),
    job_description: str = Form(""),
    system_knowledge: str = Form(""),
    file: Optional[UploadFile] = File(None)
):
    try:
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
    except Exception as e:
        logger.error(f"Loi tro ly ao chat: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/evaluate-answer")
async def evaluate_answer(request: EvaluateAnswerRequest):
    try:
        res = interview_service.evaluate_interview_answer(
            question=request.question,
            answer=request.answer,
            job_title=request.job_title
        )
        return res
    except Exception as e:
        logger.error(f"Loi evaluate-answer: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/generate-email")
async def generate_email(request: GenerateEmailRequest):
    try:
        email_type = request.email_type.strip().lower()

        if email_type not in ["invite", "reject"]:
            return {
                "status": "error",
                "message": "email_type chi duoc la invite hoac reject."
            }

        if request.candidate_name.strip() == "":
            return {
                "status": "error",
                "message": "Ten ung vien khong duoc de trong."
            }

        if request.job_title.strip() == "":
            return {
                "status": "error",
                "message": "Ten vi tri ung tuyen khong duoc de trong."
            }

        if email_type == "reject":
            if request.reject_reason is None or request.reject_reason.strip() == "":
                return {
                    "status": "error",
                    "message": "Vui long truyen ly do tu choi khi email_type la reject."
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

    except Exception as exception:
        logger.error(f"Loi phat sinh khi generate email: {exception}")
        return {
            "status": "error",
            "message": str(exception)
        }
