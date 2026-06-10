from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
import shutil
import os
import uvicorn
import json

import pdf_extractor
import nlp_processor
import ml_scorer

app = FastAPI(title="AI Recruitment System API", version="1.0")

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

# 2. API mới để C# gọi sang cập nhật từ khóa
@app.post("/update-skills")
async def update_skills(request: SkillUpdateRequest):
    try:
        with open("skills.json", "w", encoding="utf-8") as f:
            json.dump(request.skills, f, ensure_ascii=False, indent=2)
            
        count = nlp_processor.reload_knowledge_base()
        
        return {
            "status": "success", 
            "message": f"Đã học xong! Hiện có {count} kỹ năng trong não bộ."
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

class ChatMessageModel(BaseModel):
    role: str
    text: str

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
            file_text = ml_scorer.extract_text_from_file(file_bytes, file.filename, file.content_type)

        reply = ml_scorer.chat_with_candidate(prompt, history_objs, job_description, file_text, system_knowledge)
        return {"status": "success", "reply": reply, "extracted_text": file_text}
    except Exception as e:
        return {"status": "error", "message": str(e)}

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

        # Gọi hàm đa năng hỗ trợ cả PDF và OCR ảnh
        cv_text = ml_scorer.extract_text_from_file(
            file_bytes,
            file.filename,
            file.content_type
        )

        if not cv_text:
            return {
                "status": "error",
                "message": "Lỗi: Không thể trích xuất chữ từ file Ảnh/PDF này. Vui lòng chọn file rõ nét hơn."
            }

        extracted_info = nlp_processor.extract_information(cv_text)
        cv_skills = extracted_info["skills"]

        jd_info = nlp_processor.extract_information(job_description)
        jd_skills = jd_info["skills"]

        scoring_result = ml_scorer.calculate_resume_score(
            cv_text=cv_text,
            jd_text=job_description,
            cv_skills=cv_skills,
            jd_skills=jd_skills,
            criteria_list=criteria_list
        )

        return {
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

    except Exception as exception:
        return {
            "status": "error",
            "message": str(exception)
        }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)