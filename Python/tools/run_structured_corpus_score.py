from __future__ import annotations

import json
import mimetypes
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


ROOT = Path(__file__).resolve().parents[1]
CORPUS = ROOT / "test_data" / "cv_layout_corpus"
URL = "http://localhost:8000/score-cv"
JOB_DESCRIPTION = (
    "Kỹ sư DevOps xây dựng và vận hành pipeline CI/CD, triển khai Docker trên Linux, "
    "giám sát hệ thống và tự động hóa hạ tầng. Yêu cầu tối thiểu 2 năm kinh nghiệm liên quan; "
    "ưu tiên ứng viên có dự án thực tế."
)
CRITERIA = json.dumps(
    [
        {"name": "Docker", "weight": 30, "criterionType": "SKILL", "priorityLevel": "REQUIRED", "operator": "EXISTS", "targetValue": "Docker", "evidenceSources": "SKILLS,PROJECTS"},
        {"name": "Linux", "weight": 25, "criterionType": "SKILL", "priorityLevel": "REQUIRED", "operator": "EXISTS", "targetValue": "Linux", "evidenceSources": "SKILLS,EXPERIENCE"},
        {"name": "CI/CD", "weight": 25, "criterionType": "SKILL", "priorityLevel": "PREFERRED", "operator": "EXISTS", "targetValue": "CI/CD", "evidenceSources": "SKILLS,PROJECTS"},
        {"name": "Kinh nghiệm DevOps", "weight": 20, "criterionType": "TOTAL_EXPERIENCE", "priorityLevel": "PREFERRED", "operator": "MINIMUM", "targetValue": "24 tháng", "minDurationMonths": 24, "evidenceSources": "EXPERIENCE"},
    ],
    ensure_ascii=False,
)


def score(path: Path) -> dict:
    content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    with path.open("rb") as stream:
        response = requests.post(
            URL,
            files={"file": (path.name, stream, content_type)},
            data={"job_description": JOB_DESCRIPTION, "criteria": CRITERIA},
            timeout=240,
        )
    try:
        payload = response.json()
    except ValueError:
        payload = {"status": "invalid-json", "message": response.text[:200]}
    analysis = (
        payload.get("score_analysis")
        or payload.get("scoreAnalysis")
        or payload.get("matching_result")
        or payload.get("matchingResult")
        or payload.get("data")
        or payload
    )
    if not isinstance(analysis, dict):
        analysis = payload
    criteria = analysis.get("criteria_results") or analysis.get("criteriaResults") or payload.get("criteria_results") or payload.get("criteriaResults") or []
    score_value = analysis.get("total_score", analysis.get("score", analysis.get("fit_score", analysis.get("fitScore", payload.get("score")))))
    return {
        "file": path.name,
        "http": response.status_code,
        "status": payload.get("status"),
        "top_keys": sorted(payload.keys()),
        "analysis_keys": sorted(analysis.keys()),
        "score": score_value,
        "criteria": len(criteria) if isinstance(criteria, list) else 0,
        "needs_verification": sum(
            1 for item in criteria if isinstance(item, dict) and item.get("needs_verification", item.get("needsVerification")) is True
        ) if isinstance(criteria, list) else 0,
        "message": payload.get("message", ""),
    }


def main() -> int:
    paths = sorted(
        path for path in CORPUS.iterdir() if path.suffix.lower() in {".pdf", ".docx", ".png", ".jpg", ".jpeg", ".webp"}
    )
    if len(sys.argv) > 1:
        paths = [path for path in paths if path.name == sys.argv[1]]
    results = []
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {executor.submit(score, path): path for path in paths}
        for future in as_completed(futures):
            try:
                row = future.result()
            except Exception as error:  # noqa: BLE001 - report each corpus failure
                row = {"file": futures[future].name, "http": 0, "status": "exception", "score": None, "criteria": 0, "needs_verification": 0, "message": str(error)}
            results.append(row)
            print(json.dumps(row, ensure_ascii=False))
    results.sort(key=lambda row: row["file"])
    successes = sum(row["status"] == "success" for row in results)
    print(f"SUMMARY total={len(results)} success={successes} error={len(results) - successes}")
    return 0 if successes == len(results) else 2


if __name__ == "__main__":
    raise SystemExit(main())
