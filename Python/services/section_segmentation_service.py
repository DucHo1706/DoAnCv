from __future__ import annotations

import re
import unicodedata


SECTION_ALIASES = {
    "summary": {
        "muc tieu nghe nghiep", "gioi thieu ban than", "tom tat", "profile",
        "professional summary", "career objective", "about me",
    },
    "experience": {
        "kinh nghiem", "kinh nghiem lam viec", "qua trinh cong tac",
        "hanh trinh nghe nghiep", "work experience", "employment history",
        "professional experience", "career history",
    },
    "projects": {"du an", "du an tieu bieu", "san pham", "projects", "selected projects", "portfolio"},
    "skills": {
        "ky nang", "nang luc", "cong nghe", "technical skills", "skills",
        "core competencies", "tech stack", "technologies",
    },
    "education": {"hoc van", "dao tao", "education", "academic background", "qualifications"},
    "certifications": {"chung chi", "giai thuong", "certifications", "certificates", "awards"},
    "languages": {"ngoai ngu", "ngon ngu", "languages", "language proficiency"},
    "activities": {"hoat dong", "tinh nguyen", "activities", "volunteering"},
    "references": {"nguoi tham chieu", "references"},
}


def _fold(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value.casefold())
    without_marks = "".join(character for character in normalized if unicodedata.category(character) != "Mn")
    return re.sub(r"[^a-z0-9+#.]+", " ", without_marks).strip()


def classify_heading(line: str) -> tuple[str | None, float]:
    folded = _fold(line)
    if not folded or len(folded) > 55:
        return None, 0.0
    for section, aliases in SECTION_ALIASES.items():
        if folded in aliases:
            return section, 1.0
        if any(alias in folded or folded in alias for alias in aliases if len(alias) >= 5):
            return section, 0.82
    return None, 0.0


def segment_cv_sections(cv_text: str) -> dict:
    """Gom section theo nghĩa tiêu đề; giữ nguyên mục lạ thay vì làm mất dữ liệu custom."""
    lines = [line.strip(" \t|•") for line in (cv_text or "").splitlines() if line.strip()]
    sections = []
    current = {"type": "personal_info", "heading": "Thông tin đầu CV", "lines": [], "confidence": 0.7}

    for line in lines:
        # DOCX dạng bảng thường được parser giữ thành "TIÊU ĐỀ | nội dung".
        # Tách ô đầu làm heading nhưng giữ nguyên các ô còn lại làm bằng chứng.
        table_heading = None
        if "|" in line:
            first_cell, remainder = line.split("|", 1)
            table_heading, table_confidence = classify_heading(first_cell.strip())
            if table_heading and table_confidence >= 0.99:
                if current["lines"]:
                    sections.append(current)
                current = {
                    "type": table_heading,
                    "heading": first_cell.strip(),
                    "lines": [remainder.strip()] if remainder.strip() else [],
                    "confidence": table_confidence,
                }
                continue
        section_type, confidence = classify_heading(line)
        heading_like = len(line) <= 55 and (
            line.isupper() or bool(re.fullmatch(r"[\wÀ-ỹ &/+.#-]{3,55}", line))
        )
        if section_type and (confidence >= 0.99 or line.isupper()):
            if current["lines"]:
                sections.append(current)
            current = {"type": section_type, "heading": line, "lines": [], "confidence": confidence}
        elif heading_like and line.isupper() and len(line.split()) <= 7:
            # Mục custom không được bỏ: giữ nhãn OTHER để AI/HR vẫn xem được bằng chứng.
            if current["lines"]:
                sections.append(current)
            current = {"type": "other", "heading": line, "lines": [], "confidence": 0.45}
        else:
            current["lines"].append(line)
    if current["lines"] or current["heading"]:
        sections.append(current)

    normalized = []
    for index, section in enumerate(sections):
        content = "\n".join(section.pop("lines")).strip()
        if not content and section["type"] == "personal_info":
            continue
        normalized.append({**section, "content": content, "order": index})
    return {
        "sections": normalized,
        "recognized_section_count": sum(item["type"] not in {"other", "personal_info"} for item in normalized),
        "unknown_section_count": sum(item["type"] == "other" for item in normalized),
        "insufficient_structure": not any(item["type"] in {"experience", "projects", "skills", "education"} for item in normalized),
    }
