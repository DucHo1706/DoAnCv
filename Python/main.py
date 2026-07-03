from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import shutil
import os
import uvicorn
import json
from dotenv import load_dotenv
import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Tải các biến môi trường từ .env trước khi import các services
load_dotenv()

import pdf_extractor
import nlp_processor
from services import (
    doc_parser_service,
    scoring_service,
    email_service,
    interview_service
)

app = FastAPI(title="AI Recruitment System API", version="1.0")

# Cho phép Frontend React gọi trực tiếp (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from services import cv_analysis_service
def get_csharp_api_url():
    return os.getenv("CSHARP_API_URL", "https://localhost:7006/api")

def sync_skills_to_db(new_skills: list):
    """Gửi các kỹ năng mới sang C# backend để đồng bộ vào database SQL Server"""
    csharp_url = get_csharp_api_url()
    try:
        url = f"{csharp_url}/skills/sync"
        response = requests.post(url, json=new_skills, verify=False, timeout=5)
        if response.status_code == 200:
            res_data = response.json()
            print(f"[DB SYNC] Dong bo thanh cong sang SQL Server: {res_data.get('message')}")
        else:
            print(f"[DB SYNC WARNING] Khong the dong bo sang SQL Server. Status code: {response.status_code}")
    except Exception as e:
        print(f"[DB SYNC WARNING] Loi ket noi toi C# backend: {e}")

def fetch_skills_from_db_on_startup():
    """Kéo toàn bộ kỹ năng từ database SQL Server về file skills.json tại startup"""
    csharp_url = get_csharp_api_url()
    try:
        url = f"{csharp_url}/skills"
        response = requests.get(url, verify=False, timeout=5)
        if response.status_code == 200:
            skills_data = response.json()
            skills_list = [s["name"] for s in skills_data if isinstance(s, dict) and "name" in s]
            if skills_list:
                existing_skills = set()
                if os.path.exists("skills.json"):
                    with open("skills.json", "r", encoding="utf-8") as f:
                        try:
                            data = json.load(f)
                            if isinstance(data, list):
                                existing_skills = set(s.lower().strip() for s in data if s.strip())
                        except Exception:
                            pass
                
                new_added = set(s.lower().strip() for s in skills_list if s.strip()) - existing_skills
                if new_added:
                    merged = sorted(existing_skills | new_added)
                    with open("skills.json", "w", encoding="utf-8") as f:
                        json.dump(merged, f, ensure_ascii=False, indent=2)
                    nlp_processor.reload_knowledge_base()
                    print(f"[DB STARTUP] Da dong bo {len(new_added)} ky nang moi tu SQL Server database vao skills.json")
                else:
                    print("[DB STARTUP] Danh sach ky nang local da dong bo trung khop voi SQL Server database.")
            else:
                # Nếu database rỗng, tiến hành Seed dữ liệu từ local skills.json lên database SQL Server
                if os.path.exists("skills.json"):
                    with open("skills.json", "r", encoding="utf-8") as f:
                        try:
                            local_skills = json.load(f)
                            if isinstance(local_skills, list) and local_skills:
                                print(f"[DB STARTUP] Database SQL Server rong. Dang seed {len(local_skills)} ky nang tu skills.json...")
                                sync_skills_to_db(local_skills)
                        except Exception as e:
                            print(f"[DB STARTUP ERROR] Khong the seed du lieu: {e}")
        else:
            print(f"[DB STARTUP WARNING] Khong the lay ky nang tu SQL Server. Status code: {response.status_code}")
    except Exception as e:
        print(f"[DB STARTUP WARNING] Loi ket noi toi C# backend tai startup: {e}")

@app.on_event("startup")
def startup_event():
    fetch_skills_from_db_on_startup()


@app.get("/")
async def root():
    return {"message": "AI Recruitment Service is running perfectly!", "status": "ok"}

# 1. Khai báo cấu trúc dữ liệu mới
class SkillUpdateRequest(BaseModel):
    skills: List[str]

@app.post("/refresh-config")
async def refresh_config():
    try:
        count = nlp_processor.reload_knowledge_base()
        return {"status": "success", "total_skills": count}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 2. API mới để C# gọi sang cập nhật từ khóa (Merge thông minh)
@app.post("/update-skills")
async def update_skills(request: SkillUpdateRequest):
    try:
        existing_skills = set()
        if os.path.exists("skills.json"):
            try:
                with open("skills.json", "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        existing_skills = set(s.lower().strip() for s in data if s.strip())
            except Exception as read_err:
                print(f"Error reading skills.json: {read_err}")

        new_skills = set(s.lower().strip() for s in request.skills if s.strip())
        merged = sorted(existing_skills | new_skills)
        added_count = len(merged) - len(existing_skills)

        with open("skills.json", "w", encoding="utf-8") as f:
            json.dump(merged, f, ensure_ascii=False, indent=2)

        count = nlp_processor.reload_knowledge_base()
        
        return {
            "status": "success", 
            "message": f"Da merge thành công. Thêm {added_count} kỹ năng mới. Tổng số: {count}.",
            "total_skills": count,
            "added_count": added_count
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

class ChatMessageModel(BaseModel):
    role: str
    text: str

class GenerateEmailRequest(BaseModel):
    email_type: str
    candidate_name: str
    job_title: str
    company_name: Optional[str] = "AI Recruitment"
    fit_score: int = 0
    classification: Optional[str] = ""
    summary: Optional[str] = ""
    matched_skills: Optional[List[str]] = []
    missing_skills: Optional[List[str]] = []
    reject_reason: Optional[str] = None
    email_context: Optional[str] = ""

class EvaluateAnswerRequest(BaseModel):
    question: str
    answer: str
    job_title: str

@app.post("/chat")
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
            file_text = doc_parser_service.extract_text_from_file(file_bytes, file.filename, file.content_type)

        reply = scoring_service.chat_with_candidate(prompt, history_objs, job_description, file_text, system_knowledge)
        return {"status": "success", "reply": reply, "extracted_text": file_text}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/evaluate-answer")
async def evaluate_answer(request: EvaluateAnswerRequest):
    try:
        res = interview_service.evaluate_interview_answer(
            question=request.question,
            answer=request.answer,
            job_title=request.job_title
        )
        return res
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/generate-email")
async def generate_email(request: GenerateEmailRequest):
    try:
        email_type = request.email_type.strip().lower()

        if email_type not in ["invite", "reject"]:
            return {
                "status": "error",
                "message": "email_type chỉ được là invite hoặc reject."
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
                    "message": "Vui lòng truyền lý do từ chối khi email_type là reject."
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
        return {
            "status": "error",
            "message": str(exception)
        }

@app.post("/score-cv")
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

            total_weight = total_weight + criterion_weight

        if total_weight != 100:
            return {
                "status": "error",
                "message": "Tổng trọng số tiêu chí phải bằng 100%. Hiện tại đang là " + str(total_weight) + "%."
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
        return {"status": "error", "message": str(e)}


class LazyAnalysisRequest(BaseModel):
    cv_text: str
    jd_text: str
    cv_skills: Optional[List[str]] = []
    jd_skills: Optional[List[str]] = []
    job_title: Optional[str] = ""
    company_name: Optional[str] = ""


@app.post("/analyze-cv-preview")
async def analyze_cv_preview(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    job_title: str = Form(""),
    company_name: str = Form("")
):
    """
    Phân tích CV trước khi nộp (không lưu DB).
    Trả về đánh giá cốt lõi vs JD, Red Flags và kỹ năng.
    """
    try:
        file_bytes = await file.read()
        res = cv_analysis_service.preview_resume_sync(
            file_bytes=file_bytes,
            filename=file.filename,
            content_type=file.content_type,
            job_description=job_description,
            job_title=job_title,
            company_name=company_name,
            sync_skills_callback=sync_skills_to_db
        )
        return res
    except Exception as e:
        return {"status": "error", "message": f"Lỗi phân tích CV: {str(e)}"}


@app.post("/analyze-cv-star")
def analyze_cv_star(request: LazyAnalysisRequest):
    import time
    start = time.time()
    try:
        res = interview_service.generate_cv_star_tips(
            cv_text=request.cv_text,
            jd_text=request.jd_text,
            cv_skills=request.cv_skills,
            jd_skills=request.jd_skills
        )
        elapsed = time.time() - start
        print(f"[STAR] Hoan thanh trong {elapsed:.1f}s")
        return {"status": "success", "data": res}
    except Exception as e:
        elapsed = time.time() - start
        print(f"[STAR ERROR] Loi sau {elapsed:.1f}s: {e}")
        return {"status": "error", "message": str(e)}


@app.post("/analyze-cv-language")
def analyze_cv_language(request: LazyAnalysisRequest):
    import time
    start = time.time()
    try:
        res = scoring_service.generate_cv_language_review(
            cv_text=request.cv_text,
            jd_text=request.jd_text
        )
        elapsed = time.time() - start
        print(f"[LANGUAGE] Hoan thanh trong {elapsed:.1f}s")
        return {"status": "success", "data": res}
    except Exception as e:
        elapsed = time.time() - start
        print(f"[LANGUAGE ERROR] Loi sau {elapsed:.1f}s: {e}")
        return {"status": "error", "message": str(e)}


@app.post("/analyze-cv-interview")
def analyze_cv_interview(request: LazyAnalysisRequest):
    import time
    start = time.time()
    try:
        res = interview_service.generate_cv_mock_interview(
            cv_text=request.cv_text,
            jd_text=request.jd_text,
            job_title=request.job_title,
            company_name=request.company_name
        )
        elapsed = time.time() - start
        print(f"[INTERVIEW] Hoan thanh trong {elapsed:.1f}s")
        return {"status": "success", "data": res}
    except Exception as e:
        elapsed = time.time() - start
        print(f"[INTERVIEW ERROR] Loi sau {elapsed:.1f}s: {e}")
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)