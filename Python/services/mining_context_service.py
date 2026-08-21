"""Context khai phá kỹ năng, tách biệt hoàn toàn với bằng chứng và điểm CV."""

from __future__ import annotations

from typing import Any

from services import apriori_service, huim_service
from services.mining_model_store import successful_metadata

def build_skill_mining_context(current_skills: list[str], top_n: int = 5) -> dict[str, Any]:
    normalized = sorted({str(skill).strip().lower() for skill in current_skills if str(skill).strip()})
    apriori_skills = apriori_service.get_recommended_skills(normalized, top_n)
    huim_skills = huim_service.get_recommended_huim_skills(normalized, top_n)
    apriori_models = successful_metadata(apriori_service.RULES_METADATA_FILE)
    huim_models = successful_metadata(huim_service.HUIM_METADATA_FILE)
    available = bool(apriori_models or huim_models)
    scopes = sorted({
        str(item.get("domain"))
        for item in apriori_models + huim_models
        if item.get("domain")
    })
    return {
        "status": "available" if available else "insufficient_data",
        "scope": scopes,
        "apriori_recommendations": apriori_skills,
        "huim_recommendations": huim_skills,
        "dataset": {
            "apriori": {
                "models": len(apriori_models),
                "total_transactions": sum(int(item.get("total_transactions", 0) or 0) for item in apriori_models),
            },
            "huim": {
                "models": len(huim_models),
                "total_transactions": sum(int(item.get("total_transactions", 0) or 0) for item in huim_models),
                "utility_definition": next((item.get("utility_definition") for item in huim_models if item.get("utility_definition")), None),
            },
        },
        "usage_limit": (
            "Chỉ dùng làm ngữ cảnh gợi ý kỹ năng theo dữ liệu quan sát; "
            "không phải bằng chứng CV, không xác định năng lực và không cộng/trừ điểm."
        ),
    }
