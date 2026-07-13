from fastapi import APIRouter
from dtos.request_dtos import SkillUpdateRequest, AprioriTrainRequest, SkillRecommendRequest, HUIMTrainRequest
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


@router.post("/train-apriori")
async def train_apriori(request: AprioriTrainRequest):
    try:
        from services import apriori_service
        rules = apriori_service.train_and_save_rules(
            transactions_list=request.transactions,
            min_support=request.min_support,
            min_confidence=request.min_confidence
        )
        return {
            "status": "success",
            "message": f"Huan luyen Apriori thanh cong. Khai pha duoc {len(rules)} luat kết hợp.",
            "rules_count": len(rules)
        }
    except Exception as e:
        logger.error(f"Loi khi huan luyen Apriori: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/recommend-skills")
async def recommend_skills(request: SkillRecommendRequest):
    try:
        from services import apriori_service
        recommended = apriori_service.get_recommended_skills(
            current_skills=request.current_skills,
            top_n=request.top_n
        )
        return {
            "status": "success",
            "recommended_skills": recommended
        }
    except Exception as e:
        logger.error(f"Loi khi goi y ky nang: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/association-rules")
async def get_association_rules():
    try:
        rules_path = "association_rules.json"
        if not os.path.exists(rules_path):
            return {"status": "success", "rules": []}
            
        with open(rules_path, "r", encoding="utf-8") as f:
            rules = json.load(f)
        return {"status": "success", "rules": rules}
    except Exception as e:
        logger.error(f"Loi khi lay danh sach luat ket hop: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/train-huim")
async def train_huim(request: HUIMTrainRequest):
    try:
        from services import huim_service
        tx_list = []
        for tx in request.transactions:
            tx_list.append({
                "items": tx.items,
                "quantities": tx.quantities
            })
        
        results = huim_service.train_and_save_huim(
            transactions_input=tx_list,
            external_utilities=request.external_utilities,
            min_utility=request.min_utility
        )
        return {
            "status": "success",
            "message": f"Huan luyen HUIM (Two-Phase) thanh cong. Khai pha duoc {len(results)} tap ky nang co loi ich cao.",
            "results_count": len(results)
        }
    except Exception as e:
        logger.error(f"Loi khi huan luyen HUIM: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/recommend-high-utility-skills")
async def recommend_high_utility_skills(request: SkillRecommendRequest):
    try:
        from services import huim_service
        recommended = huim_service.get_recommended_huim_skills(
            current_skills=request.current_skills,
            top_n=request.top_n
        )
        return {
            "status": "success",
            "recommended_skills": recommended
        }
    except Exception as e:
        logger.error(f"Loi khi goi y ky nang HUIM: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/high-utility-itemsets")
async def get_high_utility_itemsets():
    try:
        huim_path = "high_utility_itemsets.json"
        if not os.path.exists(huim_path):
            return {"status": "success", "itemsets": []}
            
        with open(huim_path, "r", encoding="utf-8") as f:
            itemsets = json.load(f)
        return {"status": "success", "itemsets": itemsets}
    except Exception as e:
        logger.error(f"Loi khi lay danh sach tap ky nang loi ich cao: {e}")
        return {"status": "error", "message": str(e)}
