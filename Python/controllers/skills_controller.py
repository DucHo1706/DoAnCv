from fastapi import APIRouter, Request, HTTPException
from dtos.request_dtos import SkillUpdateRequest, AprioriTrainRequest, SkillRecommendRequest, HUIMTrainRequest
import nlp_processor
from utils.logger import logger
from utils.rate_limiter import check_ip_rate_limit
from utils.error_handler import get_user_friendly_error_message
from starlette.concurrency import run_in_threadpool

router = APIRouter()

@router.post("/refresh-config")
async def refresh_config(req: Request):
    try:
        check_ip_rate_limit(req, cooldown_seconds=2.0, max_requests_per_minute=20)
        count = await run_in_threadpool(nlp_processor.reload_knowledge_base)
        return {"status": "success", "total_skills": count}
    except HTTPException as he:
        raise he
    except Exception as e:
        msg = get_user_friendly_error_message(e, "Không thể làm mới cấu hình kỹ năng lúc này.")
        return {"status": "error", "message": msg}


@router.post("/update-skills")
async def update_skills(request: SkillUpdateRequest, req: Request):
    raise HTTPException(
        status_code=409,
        detail="Không nhận tự động kỹ năng do AI trích xuất. Kỹ năng mới phải qua hàng chờ và được duyệt trong taxonomy."
    )


@router.post("/train-apriori")
async def train_apriori(request: AprioriTrainRequest, req: Request):
    try:
        check_ip_rate_limit(req, cooldown_seconds=0.0, max_requests_per_minute=60)
        from services import apriori_service
        rules = await run_in_threadpool(
            apriori_service.train_and_save_rules,
            transactions_list=request.transactions,
            min_support=request.min_support,
            min_confidence=request.min_confidence,
            domain=request.domain,
            taxonomy_skills=request.taxonomy_skills,
            taxonomy_aliases=request.taxonomy_aliases,
            dataset_id=request.dataset_id,
            min_support_count=request.min_support_count or 2,
            reset_models=request.reset_models
        )
        metadata = apriori_service.get_last_training_metadata()
        if metadata.get("status") == "skipped":
            return {"status": "skipped", "message": metadata.get("reason", "Đã bỏ qua huấn luyện."), "rules_count": 0, "metadata": metadata}
        return {
            "status": "success",
            "message": f"Huấn luyện Apriori thành công. Khai phá được {len(rules)} luật kết hợp.",
            "rules_count": len(rules),
            "metadata": metadata
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
        from services import apriori_service
        return {"status": "success", "rules": apriori_service.get_all_rules()}
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
        
        results = await run_in_threadpool(
            huim_service.train_and_save_huim,
            transactions_input=tx_list,
            external_utilities=request.external_utilities,
            min_utility=request.min_utility,
            domain=request.domain,
            taxonomy_skills=request.taxonomy_skills,
            taxonomy_aliases=request.taxonomy_aliases,
            dataset_id=request.dataset_id,
            min_support_count=request.min_support_count or 2,
            reset_models=request.reset_models
        )
        metadata = huim_service.get_last_training_metadata()
        if metadata.get("status") == "skipped":
            return {"status": "skipped", "message": metadata.get("reason", "Đã bỏ qua huấn luyện."), "results_count": 0, "metadata": metadata}
        return {
            "status": "success",
            "message": f"Huấn luyện HUIM (Two-Phase) thành công. Khai phá được {len(results)} tập kỹ năng có lợi ích cao.",
            "results_count": len(results),
            "metadata": metadata
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
        from services import huim_service
        return {"status": "success", "itemsets": huim_service.get_all_itemsets()}
    except Exception as e:
        msg = get_user_friendly_error_message(e, "Không thể lấy danh sách tập kỹ năng lợi ích cao.")
        return {"status": "error", "message": msg}
