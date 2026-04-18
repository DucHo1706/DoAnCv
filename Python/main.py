from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
from typing import List
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

@app.post("/score-cv")
async def score_cv(
    file: UploadFile = File(...),
    job_description: str = Form(...)
):
    temp_filename = f"temp_{file.filename}"
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        cv_text = pdf_extractor.extract_text_from_pdf(temp_filename)
        
        extracted_info = nlp_processor.extract_information(cv_text)
        cv_skills = extracted_info["skills"]
        
        jd_info = nlp_processor.extract_information(job_description)
        jd_skills = jd_info["skills"]

        scoring_result = ml_scorer.calculate_resume_score(
            cv_text=cv_text,
            jd_text=job_description,
            cv_skills=cv_skills,
            jd_skills=jd_skills
        )
        
        return {
            "status": "success",
            "candidate_info": {
                "email": extracted_info["email"],
                "phone": extracted_info["phone"],
                "extracted_skills": cv_skills
            },
            "matching_result": scoring_result
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
    
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)