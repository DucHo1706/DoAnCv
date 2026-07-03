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

import hashlib

# Bộ nhớ đệm cấp 1: Lưu văn bản trích xuất & kiểm định CV bằng SHA-256
TEXT_CACHE = {}

# Bộ nhớ đệm cấp 2: Lưu kết quả phân tích chấm điểm đầy đủ của /score-cv
SCORE_CACHE = {}

def get_bytes_hash(data: bytes) -> str:
    """Tính mã Hash SHA-256 của tệp bytes"""
    return hashlib.sha256(data).hexdigest()

def get_str_hash(text: str) -> str:
    """Tính mã Hash SHA-256 của chuỗi văn bản"""
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()

def clean_cache_if_large():
    """Tự động xóa bớt phần tử cũ nếu cache quá lớn (tránh tràn RAM)"""
    global TEXT_CACHE, SCORE_CACHE
    if len(TEXT_CACHE) > 500:
        first_key = next(iter(TEXT_CACHE))
        TEXT_CACHE.pop(first_key, None)
    if len(SCORE_CACHE) > 500:
        first_key = next(iter(SCORE_CACHE))
        SCORE_CACHE.pop(first_key, None)



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

        # Đọc byte của file trực tiếp trên RAM
        file_bytes = await file.read()
        cv_hash = get_bytes_hash(file_bytes)
        jd_hash = get_str_hash(job_description)
        criteria_hash = get_str_hash(criteria)
        
        # Khóa Cache cấp 2
        score_key = (cv_hash, jd_hash, criteria_hash)
        
        # 1. Kiểm tra Cache cấp 2 (Full Score Cache)
        if score_key in SCORE_CACHE:
            print(f"🚀 [SCORE CACHE HIT] Trả kết quả chấm điểm CV lập tức (0ms, 0 Gemini tokens)")
            return SCORE_CACHE[score_key]

        # 2. Trích xuất text (Check Level 1 Cache)
        if cv_hash in TEXT_CACHE and "cv_text" in TEXT_CACHE[cv_hash]:
            print(f"⚡ [TEXT CACHE HIT] Đã lấy text trích xuất từ cache cho CV {cv_hash}")
            cv_text = TEXT_CACHE[cv_hash]["cv_text"]
        else:
            cv_text = doc_parser_service.extract_text_from_file(
                file_bytes,
                file.filename,
                file.content_type
            )
            if cv_text:
                if cv_hash not in TEXT_CACHE:
                    TEXT_CACHE[cv_hash] = {}
                TEXT_CACHE[cv_hash]["cv_text"] = cv_text
                clean_cache_if_large()

        if not cv_text:
            return {
                "status": "error",
                "message": "Lỗi: Không thể trích xuất chữ từ file Ảnh/PDF này. Vui lòng chọn file rõ nét hơn."
            }

        # 3. Kiểm tra tính hợp lệ của CV (Check Level 1 Cache)
        if cv_hash in TEXT_CACHE and "validation" in TEXT_CACHE[cv_hash]:
            print(f"⚡ [VALIDATION CACHE HIT] Lấy kết quả kiểm định CV từ cache cho {cv_hash}")
            is_resume, reason = TEXT_CACHE[cv_hash]["validation"]
        else:
            is_resume, reason = scoring_service.is_document_a_resume(cv_text)
            if cv_hash not in TEXT_CACHE:
                TEXT_CACHE[cv_hash] = {}
            TEXT_CACHE[cv_hash]["validation"] = (is_resume, reason)
            clean_cache_if_large()

        if not is_resume:
            return {
                "status": "error",
                "message": f"Tệp tải lên không phải là một CV hợp lệ. {reason}"
            }

        extracted_info = nlp_processor.extract_information(cv_text)
        cv_skills = extracted_info["skills"]

        jd_info = nlp_processor.extract_information(job_description)
        jd_skills = jd_info["skills"]

        scoring_result = scoring_service.calculate_resume_score(
            cv_text=cv_text,
            jd_text=job_description,
            cv_skills=cv_skills,
            jd_skills=jd_skills,
            criteria_list=criteria_list
        )

        # 2. Phân tích chi tiết khác trong background để lưu trữ đầy đủ báo cáo
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
            print(f"Lỗi khi chạy analyze_cv_deep trong background: {e}")
            strengths, weaknesses, red_flags = [], [], []

        try:
            star_tips = interview_service.generate_cv_star_tips(
                cv_text=cv_text,
                jd_text=job_description,
                cv_skills=cv_skills,
                jd_skills=jd_skills
            )
        except Exception as e:
            print(f"Lỗi khi chạy generate_cv_star_tips trong background: {e}")
            star_tips = []

        try:
            language_review = scoring_service.generate_cv_language_review(
                cv_text=cv_text,
                jd_text=job_description
            )
        except Exception as e:
            print(f"Lỗi khi chạy generate_cv_language_review trong background: {e}")
            language_review = {
                "overall_language_score": 0,
                "language_comment": "Không thể phân tích ngôn từ.",
                "good_action_verbs": [],
                "weak_phrases": [],
                "ai_generation_risk": {"detected": False, "section": "", "score": 0, "comment": ""}
            }

        try:
            mock_interview = interview_service.generate_cv_mock_interview(
                cv_text=cv_text,
                jd_text=job_description
            )
        except Exception as e:
            print(f"Lỗi khi chạy generate_cv_mock_interview trong background: {e}")
            mock_interview = []

        # 3. Gom tất cả thành 1 gói dữ liệu phân tích đầy đủ (Full Analysis Data)
        full_analysis_data = {
            "score_analysis": {
                "total_score": scoring_result.get("total_score", 0),
                "classification": scoring_result.get("classification", "Chưa phân loại"),
                "summary": scoring_result.get("summary", "Đã hoàn thành phân tích CV."),
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

        # 4. Ghi đè summary bằng chuỗi JSON chứa toàn bộ báo cáo này
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

        # Ghi nhận vào Cache cấp 2
        SCORE_CACHE[score_key] = response_data
        clean_cache_if_large()

        return response_data

    except Exception as exception:
        return {
            "status": "error",
            "message": str(exception)
        }


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
        cv_hash = get_bytes_hash(file_bytes)

        # 1. Trích xuất text (Check Level 1 Cache)
        if cv_hash in TEXT_CACHE and "cv_text" in TEXT_CACHE[cv_hash]:
            print(f"⚡ [TEXT CACHE HIT] Đã lấy text trích xuất từ cache cho CV {cv_hash} trong /analyze-cv-preview")
            cv_text = TEXT_CACHE[cv_hash]["cv_text"]
        else:
            cv_text = doc_parser_service.extract_text_from_file(
                file_bytes,
                file.filename,
                file.content_type
            )
            if cv_text:
                if cv_hash not in TEXT_CACHE:
                    TEXT_CACHE[cv_hash] = {}
                TEXT_CACHE[cv_hash]["cv_text"] = cv_text
                clean_cache_if_large()

        if not cv_text or cv_text.strip() == "":
            return {
                "status": "error",
                "message": "Không thể đọc nội dung file CV. Vui lòng dùng file PDF hoặc ảnh rõ nét."
            }

        # 2. Kiểm tra tính hợp lệ của CV (Check Level 1 Cache)
        if cv_hash in TEXT_CACHE and "validation" in TEXT_CACHE[cv_hash]:
            print(f"⚡ [VALIDATION CACHE HIT] Lấy kết quả kiểm định CV từ cache cho {cv_hash} trong /analyze-cv-preview")
            is_resume, reason = TEXT_CACHE[cv_hash]["validation"]
        else:
            is_resume, reason = scoring_service.is_document_a_resume(cv_text)
            if cv_hash not in TEXT_CACHE:
                TEXT_CACHE[cv_hash] = {}
            TEXT_CACHE[cv_hash]["validation"] = (is_resume, reason)
            clean_cache_if_large()
        if not is_resume:
            return {
                "status": "error",
                "message": f"Tệp tải lên không phải là một CV hợp lệ. {reason}"
            }

        # Trích xuất kỹ năng từ CV và JD qua NLP processor
        cv_info = nlp_processor.extract_information(cv_text)
        cv_skills = cv_info.get("skills", [])

        jd_info = nlp_processor.extract_information(job_description)
        jd_skills = jd_info.get("skills", [])

        # Gọi AI phân tích thô nhanh (chỉ làm Tab 1)
        result = scoring_service.analyze_cv_deep(
            cv_text=cv_text,
            jd_text=job_description,
            cv_skills=cv_skills,
            jd_skills=jd_skills,
            job_title=job_title,
            company_name=company_name
        )

        # Bổ sung thông tin ứng viên và text thô để lưu trữ ở React State
        result["candidate_info"] = {
            "email": cv_info.get("email", ""),
            "phone": cv_info.get("phone", ""),
            "extracted_skills": cv_skills
        }
        result["cv_text"] = cv_text
        result["job_description"] = job_description

        # Auto-enrich: học kỹ năng mới từ kết quả phân tích của Gemini
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
                    print(f"[AUTO-LEARN] Learned {len(new_skills)} new skills: {new_skills}")
                    # Đồng bộ ngay lập tức sang C# database
                    sync_skills_to_db([s.strip() for s in gemini_skills if s.strip() and s.lower().strip() in new_skills])
        except Exception as learn_err:
            print(f"Error in auto-learn preview: {learn_err}")

        return result

    except Exception as exception:
        return {
            "status": "error",
            "message": f"Lỗi phân tích CV: {str(exception)}"
        }


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