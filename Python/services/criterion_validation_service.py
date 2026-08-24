import json
from typing import Any, Dict, List

ALLOWED_CRITERION_TYPES = {
    "SKILL", "TOTAL_EXPERIENCE", "SKILL_EXPERIENCE", "EDUCATION",
    "CERTIFICATION", "LANGUAGE", "LOCATION_WORK_MODE", "CUSTOM",
}
ALLOWED_PRIORITY_LEVELS = {"REQUIRED", "PREFERRED", "BONUS"}
ALLOWED_OPERATORS = {"EXISTS", "MINIMUM", "MAXIMUM", "EQUALS", "IN"}

# Các giá trị đã tồn tại trong dữ liệu job trước khi contract tiêu chí có cấu trúc
# được chuẩn hóa. Chỉ ánh xạ các alias có nghĩa tương đương đã kiểm chứng; giá trị
# lạ khác vẫn bị từ chối để tránh chấm sai âm thầm.
LEGACY_CRITERION_TYPE_ALIASES = {
    "EXPERIENCE": "TOTAL_EXPERIENCE",
    "PROJECT": "CUSTOM",
}
LEGACY_OPERATOR_ALIASES = {
    "CONTAINS_ANY": "IN",
    "MIN_DURATION": "MINIMUM",
}


def parse_and_validate_criteria(criteria_json: str) -> List[Dict[str, Any]]:
    """Parse the API JSON field and validate the common scoring contract."""
    try:
        criteria = json.loads(criteria_json)
    except (TypeError, json.JSONDecodeError) as error:
        raise ValueError("Danh sách tiêu chí đánh giá không đúng định dạng JSON.") from error

    return validate_criteria(criteria)


def validate_criteria(criteria: Any) -> List[Dict[str, Any]]:
    """Validate legacy criteria while preserving optional structured fields."""
    if not isinstance(criteria, list):
        raise ValueError("Danh sách tiêu chí đánh giá phải là một mảng JSON.")
    if not criteria:
        raise ValueError("Vui lòng truyền ít nhất 1 tiêu chí đánh giá.")

    normalized: List[Dict[str, Any]] = []
    total_weight = 0

    for index, criterion in enumerate(criteria, start=1):
        if not isinstance(criterion, dict):
            raise ValueError(f"Tiêu chí thứ {index} phải là một đối tượng JSON.")
        if "name" not in criterion or "weight" not in criterion:
            raise ValueError("Mỗi tiêu chí phải có name và weight.")

        name = str(criterion["name"]).strip()
        if not name:
            raise ValueError("Tên tiêu chí không được để trống.")

        try:
            weight = int(criterion["weight"])
        except (TypeError, ValueError) as error:
            raise ValueError("Trọng số tiêu chí phải là số nguyên.") from error

        if weight <= 0 or weight > 100:
            raise ValueError("Trọng số mỗi tiêu chí phải từ 1 đến 100.")

        normalized_criterion = dict(criterion)
        normalized_criterion["name"] = name
        normalized_criterion["weight"] = weight

        criterion_type = _normalize_option(
            criterion.get("criterionType"),
            "CUSTOM",
            LEGACY_CRITERION_TYPE_ALIASES,
        )
        priority_level = _normalize_option(criterion.get("priorityLevel"), "PREFERRED")
        operator = _normalize_option(
            criterion.get("operator"),
            "EXISTS",
            LEGACY_OPERATOR_ALIASES,
        )
        if criterion_type not in ALLOWED_CRITERION_TYPES:
            raise ValueError(f"Loại của tiêu chí '{name}' không hợp lệ.")
        if priority_level not in ALLOWED_PRIORITY_LEVELS:
            raise ValueError(f"Mức độ của tiêu chí '{name}' không hợp lệ.")
        if operator not in ALLOWED_OPERATORS:
            raise ValueError(f"Điều kiện của tiêu chí '{name}' không hợp lệ.")

        min_duration_months = criterion.get("minDurationMonths")
        if min_duration_months not in (None, ""):
            try:
                min_duration_months = int(min_duration_months)
            except (TypeError, ValueError) as error:
                raise ValueError(f"Thời lượng của tiêu chí '{name}' phải là số tháng.") from error
            if min_duration_months < 0 or min_duration_months > 1200:
                raise ValueError(f"Thời lượng của tiêu chí '{name}' phải từ 0 đến 1200 tháng.")
        else:
            min_duration_months = None

        target_value = str(criterion.get("targetValue") or "").strip() or name
        evidence_sources = str(
            criterion.get("evidenceSources") or "SKILLS,EXPERIENCE,PROJECTS"
        ).strip()
        normalized_criterion.update({
            "criterionType": criterion_type,
            "priorityLevel": priority_level,
            "operator": operator,
            "targetValue": target_value,
            "minDurationMonths": min_duration_months,
            "evidenceSources": evidence_sources,
        })
        normalized.append(normalized_criterion)
        total_weight += weight

    if total_weight != 100:
        raise ValueError(
            f"Tổng trọng số tiêu chí phải bằng 100%. Hiện tại đang là {total_weight}%."
        )

    return normalized


def _normalize_option(
    value: Any,
    fallback: str,
    aliases: Dict[str, str] | None = None,
) -> str:
    normalized = str(value or "").strip().upper()
    normalized = normalized or fallback
    return (aliases or {}).get(normalized, normalized)
