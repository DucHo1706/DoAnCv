import re
import json
import os
from typing import Iterable
from services.runtime_paths import runtime_file
from services.skill_mining_guard import (
    build_canonical_map,
    canonicalize_skill_values as canonicalize_values,
    is_suspicious_skill,
    normalize_match_key,
    normalize_skill,
)
from services.skill_observation_service import extract_unknown_skill_observations

try:
    import spacy
    try:
        nlp = spacy.load("en_core_web_sm")
    except Exception as e:
        print("Warning: Model en_core_web_sm not found. Using dummy function.")
        nlp = lambda x: str(x)
except ImportError:
    spacy = None
    nlp = lambda x: str(x)

SKILL_DB = set()
SKILL_ALIASES = {}

def load_skill_taxonomy():
    # Taxonomy do SQL Server quản lý và đã được Admin duyệt. Không nạp lại
    # skills.json lịch sử vì tệp đó từng chứa cả cụm từ do OCR/LLM suy diễn.
    taxonomy_source = runtime_file("approved_skill_taxonomy.json")
    approved = set()
    aliases = {}
    if os.path.exists(taxonomy_source):
        try:
            with open(taxonomy_source, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                for entry in data:
                    if not isinstance(entry, dict):
                        continue
                    canonical = normalize_skill(entry.get("name"))
                    if not canonical or is_suspicious_skill(canonical):
                        continue
                    approved.add(canonical)
                    for alias in entry.get("aliases", []) or []:
                        alias_text = str(alias or "").strip()
                        if alias_text and not is_suspicious_skill(alias_text):
                            aliases[alias_text] = canonical
        except (OSError, ValueError, TypeError):
            approved, aliases = set(), {}

    # Tương thích runtime cũ trong lần khởi động đầu tiên sau nâng cấp.
    if not approved:
        legacy_source = runtime_file("approved_skills.json")
        if os.path.exists(legacy_source):
            try:
                with open(legacy_source, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if isinstance(data, list):
                    approved.update(
                        normalized for normalized in (normalize_skill(skill) for skill in data)
                        if normalized and not is_suspicious_skill(normalized)
                    )
            except (OSError, ValueError, TypeError):
                pass
    return approved, aliases


def load_skill_db(filename=None):
    del filename
    approved, _ = load_skill_taxonomy()
    return approved

def reload_knowledge_base():
    global SKILL_DB, SKILL_ALIASES
    SKILL_DB, raw_aliases = load_skill_taxonomy()
    _, SKILL_ALIASES = build_canonical_map(SKILL_DB, raw_aliases)
    return len(SKILL_DB)

reload_knowledge_base()


def canonicalize_skill_values(values: Iterable[str]) -> list[str]:
    return canonicalize_values(values, SKILL_DB, SKILL_ALIASES)


def extract_skills(text: str) -> list[str]:
    normalized_text = normalize_match_key(text)
    candidates = []
    for alias_key, canonical in SKILL_ALIASES.items():
        if not alias_key:
            continue
        pattern = r"(?<!\S)" + re.escape(alias_key) + r"(?!\S)"
        for match in re.finditer(pattern, normalized_text):
            candidates.append((match.start(), match.end(), canonical, alias_key))

    # Một occurrence dài thắng occurrence con nằm trong nó: `C#` không tự sinh
    # thêm `C`, `SQL Server` không tự sinh thêm `SQL`. Nếu `SQL` xuất hiện ở vị
    # trí độc lập khác trong CV thì occurrence đó vẫn được giữ.
    accepted_spans = []
    found_skills = set()
    for start, end, canonical, alias_key in sorted(
        candidates,
        key=lambda item: (item[1] - item[0], len(item[3])),
        reverse=True,
    ):
        overlaps_more_specific = any(
            start < accepted_end and end > accepted_start and canonical != accepted_canonical
            for accepted_start, accepted_end, accepted_canonical in accepted_spans
        )
        if overlaps_more_specific:
            continue
        accepted_spans.append((start, end, canonical))
        found_skills.add(canonical)

    return sorted(found_skills)


def extract_skill_observations(text: str) -> list[dict]:
    """Tách skill lạ thành quan sát; không đưa chúng vào kết quả canonical."""
    return extract_unknown_skill_observations(text, SKILL_ALIASES)

def extract_information(cv_text):
    extracted_data = {
        "email": None,
        "phone": None,
        "skills": []
    }

    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = re.findall(email_pattern, cv_text)
    if emails:
        extracted_data["email"] = emails[0]

    clean_text_for_phone = cv_text.replace(" ", "").replace("-", "").replace(".", "")
    phone_pattern = r'(?:0|\+84)(?:3|5|7|8|9)\d{8}\b'
    phones = re.findall(phone_pattern, clean_text_for_phone)
    if phones:
        extracted_data["phone"] = phones[0]
    else:
        # OCR đôi khi nhận nhầm chữ số 0 đầu tiên thành 9. Chỉ sửa đúng một
        # ký tự đầu và chỉ chấp nhận nếu phần còn lại tạo thành đầu số VN hợp lệ.
        digit_candidates = re.findall(r'(?<!\d)\d{10}(?!\d)', clean_text_for_phone)
        for candidate in digit_candidates:
            repaired = "0" + candidate[1:]
            if re.fullmatch(phone_pattern, repaired):
                extracted_data["phone"] = repaired
                break

    extracted_data["skills"] = extract_skills(cv_text)
    
    return extracted_data

if __name__ == "__main__":
    sample_cv_text = "Test python react sql server"
    print(extract_information(sample_cv_text))
