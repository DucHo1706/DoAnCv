from fastapi import APIRouter, Request, HTTPException
from dtos.request_dtos import SkillUpdateRequest, AprioriTrainRequest, SkillRecommendRequest, HUIMTrainRequest
import nlp_processor
from utils.logger import logger
from utils.rate_limiter import check_ip_rate_limit
from utils.error_handler import get_user_friendly_error_message
import os
import json

router = APIRouter()

@router.post("/refresh-config")
async def refresh_config(req: Request):
    try:
        check_ip_rate_limit(req, cooldown_seconds=2.0, max_requests_per_minute=20)
        count = nlp_processor.reload_knowledge_base()
        return {"status": "success", "total_skills": count}
    except HTTPException as he:
        raise he
    except Exception as e:
        msg = get_user_friendly_error_message(e, "Không thể làm mới cấu hình kỹ năng lúc này.")
        return {"status": "error", "message": msg}


@router.post("/update-skills")
async def update_skills(request: SkillUpdateRequest, req: Request):
    try:
        check_ip_rate_limit(req, cooldown_seconds=2.0, max_requests_per_minute=30)
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
            "message": f"Đã đồng bộ thành công. Thêm {added_count} kỹ năng mới. Tổng số: {count}.",
            "total_skills": count,
            "added_count": added_count
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        msg = get_user_friendly_error_message(e, "Không thể cập nhật danh sách kỹ năng lúc này.")
        return {"status": "error", "message": msg}


@router.post("/train-apriori")
async def train_apriori(request: AprioriTrainRequest, req: Request):
    try:
        check_ip_rate_limit(req, cooldown_seconds=0.0, max_requests_per_minute=60)
        from services import apriori_service
        rules = apriori_service.train_and_save_rules(
            transactions_list=request.transactions,
            min_support=request.min_support,
            min_confidence=request.min_confidence
        )
        return {
            "status": "success",
            "message": f"Huấn luyện Apriori thành công. Khai phá được {len(rules)} luật kết hợp.",
            "rules_count": len(rules)
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        msg = get_user_friendly_error_message(e, "Không thể huấn luyện thuật toán Apriori lúc này.")
        return {"status": "error", "message": msg}


@router.post("/recommend-skills")
async def recommend_skills(request: SkillRecommendRequest, req: Request):
    try:
        check_ip_rate_limit(req, cooldown_seconds=0.0, max_requests_per_minute=60)
        from services import apriori_service
        recommended = apriori_service.get_recommended_skills(
            current_skills=request.current_skills,
            top_n=request.top_n
        )
        return {
            "status": "success",
            "recommended_skills": recommended
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        msg = get_user_friendly_error_message(e, "Không thể gợi ý kỹ năng lúc này.")
        return {"status": "error", "message": msg}


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
        msg = get_user_friendly_error_message(e, "Không thể lấy danh sách luật kết hợp lúc này.")
        return {"status": "error", "message": msg}


@router.post("/train-huim")
async def train_huim(request: HUIMTrainRequest, req: Request):
    try:
        check_ip_rate_limit(req, cooldown_seconds=0.0, max_requests_per_minute=60)
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
            "message": f"Huấn luyện HUIM (Two-Phase) thành công. Khai phá được {len(results)} tập kỹ năng có lợi ích cao.",
            "results_count": len(results)
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        msg = get_user_friendly_error_message(e, "Không thể huấn luyện thuật toán HUIM lúc này.")
        return {"status": "error", "message": msg}


@router.post("/recommend-high-utility-skills")
async def recommend_high_utility_skills(request: SkillRecommendRequest, req: Request):
    try:
        check_ip_rate_limit(req, cooldown_seconds=0.0, max_requests_per_minute=60)
        from services import huim_service
        recommended = huim_service.get_recommended_huim_skills(
            current_skills=request.current_skills,
            top_n=request.top_n
        )
        return {
            "status": "success",
            "recommended_skills": recommended
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        msg = get_user_friendly_error_message(e, "Không thể gợi ý tập kỹ năng lợi ích cao lúc này.")
        return {"status": "error", "message": msg}


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
        msg = get_user_friendly_error_message(e, "Không thể lấy danh sách tập kỹ năng lợi ích cao.")
        return {"status": "error", "message": msg}
