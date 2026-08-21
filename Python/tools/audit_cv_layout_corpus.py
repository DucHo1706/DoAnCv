from __future__ import annotations

import json
import mimetypes
import statistics
import sys
import time
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from services.doc_parser_service import extract_document_from_file
from services.section_segmentation_service import segment_cv_sections
from services.timeline_service import extract_experience_timeline
from nlp_processor import extract_information
from services.scoring_service import is_document_a_resume

CORPUS = ROOT / "test_data" / "cv_layout_corpus"
REPORT_JSON = CORPUS / "audit_results.json"
REPORT_MD = CORPUS / "AUDIT_REPORT.md"


def normalized_phone(value: str) -> str:
    return "".join(character for character in value if character.isdigit())


def normalized_text_key(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value.casefold())
    without_marks = "".join(character for character in decomposed if not unicodedata.combining(character))
    return " ".join(without_marks.replace("đ", "d").split())


def main() -> int:
    truth = json.loads((CORPUS / "ground_truth.json").read_text(encoding="utf-8"))
    results = []
    for case in truth:
        path = CORPUS / case["file"]
        content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        started = time.perf_counter()
        extraction = extract_document_from_file(path.read_bytes(), path.name, content_type)
        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        sections = segment_cv_sections(extraction.text)
        timeline = extract_experience_timeline(extraction.text, case.get("expected_skills", []))
        compact_text = " ".join(extraction.text.casefold().split())
        contact = extract_information(extraction.text)
        expected_skills = case.get("expected_skills", [])
        found_skills = [skill for skill in expected_skills if " ".join(skill.casefold().split()) in compact_text]
        actual_is_cv, validation_reason = is_document_a_resume(extraction.text)
        expected_is_cv = bool(case.get("expected_is_cv", True))
        row = {
            **case,
            "method": extraction.method,
            "quality_score": extraction.quality_score,
            "quality_level": extraction.quality_level,
            "word_count": len(extraction.text.split()),
            "block_count": len(extraction.blocks),
            "elapsed_ms": elapsed_ms,
            "email_found": case["expected_email"].casefold() in compact_text if expected_is_cv else None,
            "phone_found": normalized_phone(contact.get("phone") or "") == normalized_phone(case["expected_phone"]) if expected_is_cv else None,
            "name_exact_found": case.get("expected_name", "").casefold() in compact_text if expected_is_cv else None,
            "name_found": normalized_text_key(case.get("expected_name", "")) in normalized_text_key(extraction.text) if expected_is_cv else None,
            "role_found": case.get("expected_role", "").casefold() in compact_text if expected_is_cv else None,
            "skill_coverage": round(len(found_skills) / len(expected_skills) * 100, 1) if expected_skills else 0,
            "expected_is_cv": expected_is_cv,
            "actual_is_cv": actual_is_cv,
            "validation_correct": actual_is_cv == expected_is_cv,
            "validation_reason": validation_reason,
            "recognized_sections": sections["recognized_section_count"],
            "insufficient_structure": sections["insufficient_structure"],
            "timeline_count": len(timeline["experiences"]),
            "overlap_detected": timeline["overlap_detected"],
            "warnings": extraction.warnings,
        }
        row["usable"] = extraction.quality_level != "insufficient" and row["word_count"] >= 20
        row["case_passed"] = (
            row["usable"] and row["validation_correct"] and (
                not expected_is_cv or (
                    row["email_found"] and row["phone_found"] and row["name_found"]
                    and row["role_found"] and row["skill_coverage"] >= 75
                    and not row["insufficient_structure"]
                )
            )
        )
        results.append(row)
        print(f'{path.name}|{row["quality_level"]}|{row["quality_score"]}|{elapsed_ms}ms|words={row["word_count"]}|is_cv={row["actual_is_cv"]}|expected={row["expected_is_cv"]}')

    REPORT_JSON.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    valid_results = [item for item in results if item["expected_is_cv"]]
    negative_results = [item for item in results if not item["expected_is_cv"]]
    usable = sum(item["usable"] for item in valid_results)
    email = sum(bool(item["email_found"]) for item in valid_results)
    phone = sum(bool(item["phone_found"]) for item in valid_results)
    names = sum(bool(item["name_found"]) for item in valid_results)
    exact_names = sum(bool(item["name_exact_found"]) for item in valid_results)
    roles = sum(bool(item["role_found"]) for item in valid_results)
    average_skill_coverage = statistics.mean(item["skill_coverage"] for item in valid_results)
    validation_correct = sum(item["validation_correct"] for item in results)
    times = [item["elapsed_ms"] for item in results]
    lines = [
        "# Báo cáo kiểm thử corpus CV đa bố cục",
        "",
        f"- Số mẫu: {len(results)} ({len(valid_results)} CV hợp lệ, {len(negative_results)} tài liệu đối chứng không phải CV)",
        f"- Phân loại CV/không phải CV đúng: {validation_correct}/{len(results)}",
        f"- CV trích xuất sử dụng được: {usable}/{len(valid_results)}",
        f"- Nhận đúng email: {email}/{len(valid_results)}",
        f"- Nhận đúng số điện thoại: {phone}/{len(valid_results)}",
        f"- Nhận diện được tên ứng viên khi chuẩn hóa dấu OCR: {names}/{len(valid_results)}",
        f"- Giữ nguyên chính xác dấu trong tên: {exact_names}/{len(valid_results)}",
        f"- Nhận đúng vai trò: {roles}/{len(valid_results)}",
        f"- Bao phủ chuỗi kỹ năng kỳ vọng trung bình: {average_skill_coverage:.1f}%",
        f"- Thời gian trung vị: {statistics.median(times):.2f} ms",
        f"- Thời gian lớn nhất: {max(times):.2f} ms",
        "",
        "| Mẫu | Kỳ vọng | Phân loại | Mức | Điểm CL | Từ | Email | SĐT | Tên | Vai trò | Skill | Section | Thời gian |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for item in results:
        lines.append(
            f'| {item["file"]} | {"CV" if item["expected_is_cv"] else "Không phải CV"} | {"Đúng" if item["validation_correct"] else "Sai"} | '
            f'{item["quality_level"]} | {item["quality_score"]} | {item["word_count"]} | '
            f'{"N/A" if item["email_found"] is None else "Có" if item["email_found"] else "Không"} | '
            f'{"N/A" if item["phone_found"] is None else "Có" if item["phone_found"] else "Không"} | '
            f'{"N/A" if item["name_found"] is None else "Có" if item["name_found"] else "Không"} | '
            f'{"N/A" if item["role_found"] is None else "Có" if item["role_found"] else "Không"} | '
            f'{item["skill_coverage"]}% | {item["recognized_sections"]} | {item["elapsed_ms"]} ms |'
        )
    lines += ["", "## Mẫu cần xem lại"]
    failures = [item for item in results if not item["case_passed"]]
    if failures:
        for item in failures:
            lines.append(f'- `{item["file"]}`: method={item["method"]}; warnings={"; ".join(item["warnings"]) or "không có"}.')
    else:
        lines.append("- Không có mẫu nào thất bại theo ngưỡng smoke test.")
    REPORT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Report: {REPORT_MD}")
    return 0 if not failures else 2


if __name__ == "__main__":
    raise SystemExit(main())
