from __future__ import annotations

import calendar
import re
from dataclasses import dataclass
from datetime import date
from typing import Iterable

import nlp_processor
from .section_segmentation_service import segment_cv_sections


MONTH_NAMES = {
    "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
    "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6, "jul": 7,
    "july": 7, "aug": 8, "august": 8, "sep": 9, "sept": 9,
    "september": 9, "oct": 10, "october": 10, "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}
PRESENT_WORDS = {"nay", "hiện tại", "hien tai", "present", "current", "now"}
DATE_TOKEN = (
    r"(?:tháng\s*)?(?:0?[1-9]|1[0-2])[./-](?:19|20)\d{2}"
    r"|(?:19|20)\d{2}"
    r"|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|"
    r"jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(?:19|20)\d{2}"
    r"|nay|hiện\s+tại|hien\s+tai|present|current|now"
)
PERIOD_PATTERN = re.compile(
    rf"(?P<start>{DATE_TOKEN})\s*(?:–|—|-|đến|tới|to|until)\s*(?P<end>{DATE_TOKEN})",
    re.IGNORECASE,
)
OCR_NUMERIC_PERIOD_PATTERN = re.compile(
    r"(?P<start>(?:0?[1-9]|1[0-2])[./-](?:19|20)\d{2})\s+"
    r"(?P<end>(?:0?[1-9]|1[0-2])[./-](?:19|20)\d{2})",
    re.IGNORECASE,
)


@dataclass(frozen=True, order=True)
class MonthPoint:
    year: int
    month: int

    @property
    def index(self) -> int:
        return self.year * 12 + self.month - 1

    def iso(self) -> str:
        return f"{self.year:04d}-{self.month:02d}"


def _normalize_token(token: str, today: date, is_end: bool = False) -> tuple[MonthPoint | None, float]:
    value = " ".join(token.lower().strip().split())
    if value in PRESENT_WORDS:
        return MonthPoint(today.year, today.month), 0.95

    numeric = re.fullmatch(r"(?:tháng\s*)?(0?[1-9]|1[0-2])[./-]((?:19|20)\d{2})", value)
    if numeric:
        return MonthPoint(int(numeric.group(2)), int(numeric.group(1))), 1.0

    year_only = re.fullmatch(r"((?:19|20)\d{2})", value)
    if year_only:
        # Khoảng chỉ có năm được quy ước từ tháng 1 đến tháng 12 và luôn gắn cờ xác minh.
        year = int(year_only.group(1))
        # Không được tự đẩy mốc kết thúc của năm hiện tại sang các tháng chưa xảy ra.
        end_month = today.month if is_end and year == today.year else (12 if is_end else 1)
        return MonthPoint(year, end_month), 0.65

    named = re.fullmatch(r"([a-z]+)\s+((?:19|20)\d{2})", value)
    if named and named.group(1) in MONTH_NAMES:
        return MonthPoint(int(named.group(2)), MONTH_NAMES[named.group(1)]), 0.95
    return None, 0.0


def _merge_month_intervals(intervals: Iterable[tuple[int, int]]) -> list[tuple[int, int]]:
    ordered = sorted((start, end) for start, end in intervals if end >= start)
    merged: list[list[int]] = []
    for start, end in ordered:
        if not merged or start > merged[-1][1] + 1:
            merged.append([start, end])
        else:
            merged[-1][1] = max(merged[-1][1], end)
    return [(start, end) for start, end in merged]


def _months_count(intervals: Iterable[tuple[int, int]]) -> int:
    return sum(end - start + 1 for start, end in _merge_month_intervals(intervals))


def _context_for_match(lines: list[str], line_index: int) -> str:
    start = max(0, line_index - 2)
    end = min(len(lines), line_index + 4)
    return "\n".join(line.strip() for line in lines[start:end] if line.strip())


def extract_experience_timeline(
    cv_text: str,
    known_skills: Iterable[str] | None = None,
    today: date | None = None,
) -> dict:
    """Chuẩn hóa timeline có bằng chứng; không phụ thuộc template hay tên section cố định."""
    current = today or date.today()
    segmented = segment_cv_sections(cv_text)
    experience_sections = [
        str(section.get("content") or "").strip()
        for section in segmented.get("sections", [])
        if section.get("type") == "experience" and str(section.get("content") or "").strip()
    ]
    # Khi parser nhận diện được mục Kinh nghiệm, chỉ ngày nằm trong mục đó mới
    # được tính. Ngày học vấn, chứng chỉ và dự án không mặc nhiên là thời gian
    # làm việc. CV không có heading rõ vẫn dùng fallback toàn văn để tương thích
    # tài liệu cũ, nhưng kết quả này phải được xem là kém chắc chắn hơn.
    source_scope = "experience_sections" if experience_sections else "full_text_fallback"
    timeline_source = "\n".join(experience_sections) if experience_sections else (cv_text or "")
    lines = [line.strip() for line in timeline_source.splitlines()]
    skills = sorted({str(item).strip() for item in (known_skills or []) if str(item).strip()}, key=len, reverse=True)
    experiences = []
    future_periods = []
    seen = set()
    current_point = MonthPoint(current.year, current.month)

    for line_index, line in enumerate(lines):
        matches = list(PERIOD_PATTERN.finditer(line))
        # OCR đôi khi làm mất riêng dấu gạch giữa hai mốc nhưng vẫn giữ đủ MM/YYYY.
        # Chỉ chấp nhận mẫu số nghiêm ngặt để tránh ghép nhầm các ngày rời rạc.
        matches.extend(OCR_NUMERIC_PERIOD_PATTERN.finditer(line))
        for match in matches:
            start, start_confidence = _normalize_token(match.group("start"), current)
            end, end_confidence = _normalize_token(match.group("end"), current, is_end=True)
            if not start or not end or end.index < start.index:
                continue
            key = (start.index, end.index, line_index)
            if key in seen:
                continue
            seen.add(key)
            context = _context_for_match(lines, line_index)
            if start.index > current_point.index:
                future_periods.append({
                    "declared_start_date": start.iso(),
                    "declared_end_date": end.iso(),
                    "evidence_text": context,
                    "source_line": line_index + 1,
                    "message": "Giai đoạn nằm hoàn toàn sau ngày phân tích nên không được cộng vào kinh nghiệm.",
                    "needs_verification": True,
                })
                continue
            effective_end = end if end.index <= current_point.index else current_point
            future_end_detected = end.index > current_point.index
            context_skills = {skill.casefold() for skill in nlp_processor.extract_skills(context)}
            related_skills = [skill for skill in skills if skill.casefold() in context_skills]
            experiences.append({
                "start_date": start.iso(),
                "end_date": effective_end.iso(),
                "declared_end_date": end.iso(),
                "future_date_detected": future_end_detected,
                "is_current": " ".join(match.group("end").lower().split()) in PRESENT_WORDS,
                "duration_months": effective_end.index - start.index + 1,
                "skills": related_skills,
                "evidence_text": context,
                "source_line": line_index + 1,
                "confidence": round(min(start_confidence, end_confidence), 2),
                "needs_verification": future_end_detected or min(start_confidence, end_confidence) < 0.8,
            })

    all_intervals = [
        (MonthPoint(int(item["start_date"][:4]), int(item["start_date"][5:])).index,
         MonthPoint(int(item["end_date"][:4]), int(item["end_date"][5:])).index)
        for item in experiences
    ]
    merged = _merge_month_intervals(all_intervals)

    skill_months = {}
    for skill in skills:
        intervals = []
        for item, interval in zip(experiences, all_intervals):
            if skill in item["skills"]:
                intervals.append(interval)
        months = _months_count(intervals)
        if months:
            skill_months[skill] = months

    gaps = []
    for (_, previous_end), (next_start, _) in zip(merged, merged[1:]):
        gap_months = next_start - previous_end - 1
        if gap_months >= 3:
            gap_start = previous_end + 1
            gap_end = next_start - 1
            gaps.append({
                "start_date": MonthPoint(gap_start // 12, gap_start % 12 + 1).iso(),
                "end_date": MonthPoint(gap_end // 12, gap_end % 12 + 1).iso(),
                "duration_months": gap_months,
                "message": f"Có khoảng thời gian {gap_months} tháng chưa được mô tả trong CV.",
                "needs_verification": True,
            })

    average_confidence = (
        round(sum(item["confidence"] for item in experiences) / len(experiences), 2)
        if experiences else 0.0
    )
    return {
        "experiences": experiences,
        "total_experience_months": _months_count(all_intervals),
        "skill_experience_months": skill_months,
        "gaps": gaps,
        "future_periods": future_periods,
        "future_date_detected": bool(future_periods) or any(item.get("future_date_detected") for item in experiences),
        "overlap_detected": sum(item["duration_months"] for item in experiences) > _months_count(all_intervals),
        "confidence": average_confidence,
        "insufficient_data": not experiences,
        "source_scope": source_scope,
    }
