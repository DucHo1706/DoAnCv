from fastapi import APIRouter
from dtos.request_dtos import SkillUpdateRequest
import nlp_processor
from utils.logger import logger
import os
import json

router = APIRouter()

@router.post("/refresh-config")
async def refresh_config():
    try:
        count = nlp_processor.reload_knowledge_base()
        return {"status": "success", "total_skills": count}
    except Exception as e:
        logger.error(f"Loi lam moi cau hinh: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/update-skills")
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
                logger.error(f"Loi doc skills.json: {read_err}")

        new_skills = set(s.lower().strip() for s in request.skills if s.strip())
        merged = sorted(existing_skills | new_skills)
        added_count = len(merged) - len(existing_skills)

        with open("skills.json", "w", encoding="utf-8") as f:
            json.dump(merged, f, ensure_ascii=False, indent=2)

        count = nlp_processor.reload_knowledge_base()
        
        return {
            "status": "success", 
            "message": f"Da dong bo thanh cong. Them {added_count} ky nang moi. Tong so: {count}.",
            "total_skills": count,
            "added_count": added_count
        }
    except Exception as e:
        logger.error(f"Loi khi cap nhat ky nang: {e}")
        return {"status": "error", "message": str(e)}
