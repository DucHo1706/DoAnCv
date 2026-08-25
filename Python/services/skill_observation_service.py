"""Phát hiện cụm kỹ năng chưa có trong taxonomy đã duyệt.

Module này chỉ tạo *quan sát* có bằng chứng từ các vùng kỹ năng/công nghệ
được gắn nhãn trong CV hoặc JD. Kết quả không được dùng để chấm điểm hay khai
phá cho tới khi được duyệt và ánh xạ vào ``Skills``/``SkillAliases``.
"""

from __future__ import annotations

import re
import unicodedata
from typing import Iterable, Mapping

from services.skill_mining_guard import (
    is_suspicious_skill,
    normalize_match_key,
)


_SKILL_SECTION_LABELS = {
    "skill", "skills", "technical skill", "technical skills",
    "core skill", "core skills", "professional skill", "professional skills",
    "competency", "competencies", "technology", "technologies",
    "tech stack", "technology stack", "tool", "tools", "platform", "platforms",
    "framework", "frameworks", "database", "databases",
    "requirement", "requirements", "required skill", "required skills",
    "key requirement", "key requirements",
    "ky nang", "ky nang chuyen mon", "ky nang ky thuat", "chuyen mon",
    "nang luc", "nang luc chuyen mon", "cong nghe", "cong cu", "nen tang",
    "he quan tri co so du lieu", "yeu cau", "yeu cau ky nang", "yeu cau chuyen mon",
}

_BOUNDARY_SECTION_LABELS = {
    "summary", "profile", "objective", "career objective", "contact",
    "experience", "work experience", "employment history", "project", "projects",
    "education", "certification", "certifications", "award", "awards",
    "interest", "interests", "reference", "references",
    "tom tat", "gioi thieu", "muc tieu", "muc tieu nghe nghiep", "lien he",
    "kinh nghiem", "kinh nghiem lam viec", "du an", "hoc van", "chung chi",
    "giai thuong", "so thich", "nguoi tham chieu", "thong tin ca nhan",
}

_GENERIC_VALUES = {
    "tot", "kha", "gioi", "co ban", "nang cao", "thanh thao", "hieu biet",
    "beginner", "basic", "intermediate", "advanced", "expert", "proficient",
    "skill", "skills", "technology", "technologies", "tool", "tools",
    "framework", "frameworks", "database", "databases", "other", "others",
    "ky nang", "chuyen mon", "cong nghe", "cong cu", "khac",
}

_LEADING_QUALIFIERS = re.compile(
    r"^(?:"
    r"c[oó]\s+kinh\s+nghi[eệ]m\s+(?:v[oớ]i|v[eề])|"
    r"kinh\s+nghi[eệ]m\s+(?:v[oớ]i|v[eề])|"
    r"th[aà]nh\s+th[aạ]o|s[uử]\s+d[uụ]ng|hi[eể]u\s+bi[eế]t\s+(?:v[eề])|"
    r"proficient\s+in|experienced\s+with|experience\s+with|knowledge\s+of|"
    r"familiar\s+with|strong\s+knowledge\s+of"
    r")\s+",
    re.IGNORECASE,
)

_LIST_SEPARATOR = re.compile(r"\s*(?:[,;|•·]|\s+/\s+)\s*")
_BULLET_PREFIX = re.compile(r"^\s*(?:[-–—*▪◦●]+|\d+[.)])\s*")
_MOJIBAKE = re.compile(r"(?:Ã.|Â.|áº|Ä.|�)")
_DURATION_SUFFIX = re.compile(
    r"\s*\((?:basic|intermediate|advanced|expert|beginner|"
    r"c[oơ]\s+b[aả]n|n[aâ]ng\s+cao|\d+\s*(?:n[aă]m|th[aá]ng|years?|months?))\)\s*$",
    re.IGNORECASE,
)


def _fold_label(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", str(value or "").casefold())
    folded = "".join(
        character
        for character in decomposed
        if unicodedata.category(character) != "Mn"
    )
    return " ".join(re.sub(r"[^a-z0-9]+", " ", folded).split())


def _clean_candidate(value: str) -> str:
    candidate = _BULLET_PREFIX.sub("", str(value or "").strip())
    candidate = _LEADING_QUALIFIERS.sub("", candidate).strip()
    candidate = _DURATION_SUFFIX.sub("", candidate).strip()
    return candidate.strip(" \t\r\n:;,.–—-")


def _looks_like_candidate(value: str) -> bool:
    if not value or len(value) > 64 or _MOJIBAKE.search(value):
        return False
    if is_suspicious_skill(value):
        return False
    match_key = normalize_match_key(value)
    if len(match_key) < 2 or match_key in _GENERIC_VALUES:
        return False
    if len(match_key.split()) > 5:
        return False
    if "@" in value or re.search(r"https?://|www\.", value, re.IGNORECASE):
        return False
    if re.fullmatch(r"[\d\s./-]+", value):
        return False
    if not any(character.isalpha() for character in value):
        return False
    # Câu hoàn chỉnh thường là mô tả nhiệm vụ, không phải tên kỹ năng. Những
    # cụm thực sự quan trọng vẫn được gom lại nếu xuất hiện dưới dạng danh sách.
    sentence_markers = re.findall(
        r"\b(?:v[aà]|c[oó]|c[aá]c|trong|cho|đ[eể]|duoc|được|and|with|for|that|the)\b",
        value,
        re.IGNORECASE,
    )
    if len(sentence_markers) >= 3:
        return False
    return True


def _split_candidates(payload: str) -> list[str]:
    values = _LIST_SEPARATOR.split(payload)
    if len(values) == 1 and "  " in payload:
        values = re.split(r"\s{2,}", payload)
    return [cleaned for value in values if (cleaned := _clean_candidate(value))]


def extract_unknown_skill_observations(
    text: str,
    known_aliases: Mapping[str, str] | Iterable[str] | None = None,
) -> list[dict]:
    """Trả về các quan sát chưa có trong taxonomy, không tự phê duyệt.

    ``known_aliases`` nhận map normalized alias -> canonical hoặc một iterable
    tên chuẩn. Việc loại kỹ năng đã biết dùng chính normalizer chung với runtime.
    """
    if not str(text or "").strip():
        return []

    if isinstance(known_aliases, Mapping):
        known_keys = {str(key) for key in known_aliases if str(key)}
    else:
        known_keys = {
            key for value in (known_aliases or [])
            if (key := normalize_match_key(value))
        }

    observations: dict[str, dict] = {}
    active_section = ""
    lines = [" ".join(line.strip().split()) for line in str(text).splitlines()]

    def add_candidates(payload: str, evidence: str, section: str, confidence: float) -> None:
        for candidate in _split_candidates(payload):
            normalized = normalize_match_key(candidate)
            if not normalized or normalized in known_keys or not _looks_like_candidate(candidate):
                continue
            item = {
                "raw_text": candidate[:100],
                "normalized_candidate": normalized[:120],
                "evidence_text": evidence[:500],
                "source_section": section[:100],
                "confidence": round(max(0.0, min(1.0, confidence)), 2),
            }
            previous = observations.get(normalized)
            if previous is None or item["confidence"] > previous["confidence"]:
                observations[normalized] = item

    for line in lines:
        if not line:
            continue
        label = _fold_label(line.strip(" :–—-"))
        if label in _SKILL_SECTION_LABELS:
            active_section = line.strip(" :–—-")
            continue
        if label in _BOUNDARY_SECTION_LABELS:
            active_section = ""
            continue

        labeled_payload = ""
        labeled_section = ""
        for separator in (":", " - ", " – ", " — "):
            if separator not in line:
                continue
            prefix, payload = line.split(separator, 1)
            if _fold_label(prefix) in _SKILL_SECTION_LABELS:
                labeled_payload = payload
                labeled_section = prefix.strip()
                break
        if labeled_payload:
            add_candidates(labeled_payload, line, labeled_section, 0.92)
            active_section = labeled_section
            continue

        if active_section:
            # Một tiêu đề ngắn, viết hoa, không nằm trong catalog heading có thể
            # là section tùy biến. Dừng thay vì biến tiêu đề đó thành kỹ năng.
            words = line.split()
            if (
                len(words) <= 5
                and not _BULLET_PREFIX.match(line)
                and line == line.upper()
                and not any(mark in line for mark in (",", ";", "|", "/"))
            ):
                active_section = ""
                continue
            add_candidates(line, line, active_section, 0.82)

    return sorted(
        observations.values(),
        key=lambda item: (-item["confidence"], item["normalized_candidate"]),
    )
