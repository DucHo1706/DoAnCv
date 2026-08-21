"""Chạy benchmark CV/JD, Apriori và HUIM hoàn toàn offline.

Runner chỉ đọc catalog/bộ dữ liệu JSON và ghi báo cáo vào thư mục test_data.
Nó không khởi động ASP.NET Core, không đọc appsettings, không gọi Gemini và
không kết nối SQL Server. Các kịch bản strong/partial/negative là quan hệ được
tạo có chủ đích để kiểm tra tính đơn điệu của điểm, không phải nhãn thị trường.
"""

from __future__ import annotations

import argparse
import csv
import itertools
import json
import math
import statistics
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Iterable


PYTHON_ROOT = Path(__file__).resolve().parents[1]
TOOLS_ROOT = Path(__file__).resolve().parent
if str(PYTHON_ROOT) not in sys.path:
    sys.path.insert(0, str(PYTHON_ROOT))
if str(TOOLS_ROOT) not in sys.path:
    sys.path.insert(0, str(TOOLS_ROOT))

import nlp_processor  # noqa: E402
from generate_offline_benchmark import (  # noqa: E402
    DEFAULT_CATALOG,
    DEFAULT_OUTPUT as DEFAULT_DATASET_DIR,
    build_dataset,
    write_dataset,
)
from services.apriori_service import AprioriAlgorithm  # noqa: E402
from services.criterion_validation_service import validate_criteria  # noqa: E402
from services.huim_service import TwoPhaseHUIM  # noqa: E402
from services.scoring_service import (  # noqa: E402
    reconcile_structured_criteria,
    reconcile_timeline_criteria,
)
from services.section_segmentation_service import segment_cv_sections  # noqa: E402
from services.timeline_service import extract_experience_timeline  # noqa: E402


DEFAULT_REPORT_DIR = PYTHON_ROOT / "test_data" / "offline_benchmark" / "results"
SCENARIO_ORDER = {
    "strong_same_role": 3,
    "partial_same_domain": 2,
    "negative_cross_domain": 1,
}


def _percentile(values: list[float], percentile: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, math.ceil(percentile * len(ordered)) - 1))
    return round(ordered[index], 3)


def _word_count(value: str) -> int:
    return len(str(value or "").split())


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _load_or_generate(catalog_path: Path, dataset_dir: Path, regenerate: bool) -> dict[str, Any]:
    required = ["metadata.json", "taxonomy.json", "jobs.json", "cvs.json", "pairs.json"]
    if regenerate or any(not (dataset_dir / name).exists() for name in required):
        catalog = _load_json(catalog_path)
        write_dataset(build_dataset(catalog), dataset_dir)
    return {
        "metadata": _load_json(dataset_dir / "metadata.json"),
        "taxonomy": _load_json(dataset_dir / "taxonomy.json"),
        "jobs": _load_json(dataset_dir / "jobs.json"),
        "cvs": _load_json(dataset_dir / "cvs.json"),
        "pairs": _load_json(dataset_dir / "pairs.json"),
    }


def _blank_scoring_result(criteria: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "total_score": 0,
        "classification": "Chưa đánh giá",
        "criteria_results": [
            {
                "criterion_name": item["name"],
                "weight": item["weight"],
                "score": 0,
                "max_score": item["weight"],
                "comment": "Chờ bộ luật đối sánh kiểm tra.",
                "match_level": "INSUFFICIENT_DATA",
                "confidence": 0.0,
                "evidence_text": "",
                "evidence_section": "",
                "extracted_value": "",
                "needs_verification": True,
            }
            for item in criteria
        ],
        "matched_skills": [],
        "missing_skills": [],
        "extracted_info": {},
        "ExtractedInfo": {},
    }


def _prepare_cv(candidate: dict[str, Any]) -> dict[str, Any]:
    extracted = nlp_processor.extract_information(candidate["text"])
    sections = segment_cv_sections(candidate["text"])
    timeline = extract_experience_timeline(candidate["text"], extracted["skills"])
    expected = set(candidate["skills"])
    found = set(extracted["skills"])
    return {
        "skills": sorted(found),
        "sections": sections,
        "timeline": timeline,
        "skill_recall": len(found & expected) / len(expected) if expected else 1.0,
        "unexpected_skills": sorted(found - expected),
        "word_count": _word_count(candidate["text"]),
        "char_count": len(candidate["text"]),
    }


def _score_pair(
    candidate: dict[str, Any],
    prepared_cv: dict[str, Any],
    job: dict[str, Any],
) -> dict[str, Any]:
    started = time.perf_counter()
    criteria = validate_criteria(job["criteria"])
    result = _blank_scoring_result(criteria)
    result = reconcile_timeline_criteria(result, criteria, prepared_cv["timeline"])
    result = reconcile_structured_criteria(
        result,
        criteria,
        candidate["text"],
        prepared_cv["skills"],
        prepared_cv["sections"],
    )
    elapsed_ms = (time.perf_counter() - started) * 1000
    criteria_results = result["criteria_results"]
    return {
        "score": int(result["total_score"]),
        "elapsed_ms": round(elapsed_ms, 3),
        "full_count": sum(item["match_level"] == "FULL" for item in criteria_results),
        "partial_count": sum(item["match_level"] == "PARTIAL" for item in criteria_results),
        "not_found_count": sum(item["match_level"] == "NOT_FOUND" for item in criteria_results),
        "insufficient_count": sum(item["match_level"] == "INSUFFICIENT_DATA" for item in criteria_results),
        "evidence_count": sum(bool(str(item.get("evidence_text") or "").strip()) for item in criteria_results),
    }


def _matching_benchmark(dataset: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    taxonomy = set(dataset["taxonomy"])
    previous_skill_db = nlp_processor.SKILL_DB
    previous_skill_aliases = nlp_processor.SKILL_ALIASES
    nlp_processor.SKILL_DB = taxonomy
    _, nlp_processor.SKILL_ALIASES = nlp_processor.build_canonical_map(taxonomy)
    try:
        candidates = {item["id"]: item for item in dataset["cvs"]}
        jobs = {item["id"]: item for item in dataset["jobs"]}
        prepared = {candidate_id: _prepare_cv(item) for candidate_id, item in candidates.items()}
        rows: list[dict[str, Any]] = []
        for pair in dataset["pairs"]:
            candidate = candidates[pair["cv_id"]]
            job = jobs[pair["job_id"]]
            score = _score_pair(candidate, prepared[pair["cv_id"]], job)
            rows.append(
                {
                    "cv_id": candidate["id"],
                    "job_id": job["id"],
                    "cv_domain": candidate["domain_name"],
                    "job_domain": job["domain_name"],
                    "position": job["title"],
                    "level": job["level_name"],
                    "scenario": pair["scenario"],
                    **score,
                }
            )
    finally:
        nlp_processor.SKILL_DB = previous_skill_db
        nlp_processor.SKILL_ALIASES = previous_skill_aliases

    by_scenario: dict[str, list[dict[str, Any]]] = defaultdict(list)
    by_cv: dict[str, dict[str, int]] = defaultdict(dict)
    for row in rows:
        by_scenario[row["scenario"]].append(row)
        by_cv[row["cv_id"]][row["scenario"]] = row["score"]

    monotonic_failures = []
    for cv_id, values in by_cv.items():
        if not (
            values.get("strong_same_role", -1)
            > values.get("partial_same_domain", -1)
            > values.get("negative_cross_domain", -1)
        ):
            monotonic_failures.append({"cv_id": cv_id, **values})

    scenario_metrics = {}
    for scenario, scenario_rows in sorted(by_scenario.items(), key=lambda item: -SCENARIO_ORDER[item[0]]):
        scores = [item["score"] for item in scenario_rows]
        times = [item["elapsed_ms"] for item in scenario_rows]
        scenario_metrics[scenario] = {
            "count": len(scores),
            "score_min": min(scores),
            "score_mean": round(statistics.fmean(scores), 2),
            "score_median": round(statistics.median(scores), 2),
            "score_p95": _percentile([float(item) for item in scores], 0.95),
            "score_max": max(scores),
            "latency_p50_ms": _percentile(times, 0.50),
            "latency_p95_ms": _percentile(times, 0.95),
        }

    prepared_values = list(prepared.values())
    parser_metrics = {
        "cv_count": len(prepared_values),
        "min_words": min(item["word_count"] for item in prepared_values),
        "mean_words": round(statistics.fmean(item["word_count"] for item in prepared_values), 1),
        "min_characters": min(item["char_count"] for item in prepared_values),
        "mean_characters": round(statistics.fmean(item["char_count"] for item in prepared_values), 1),
        "min_recognized_sections": min(item["sections"]["recognized_section_count"] for item in prepared_values),
        "mean_recognized_sections": round(statistics.fmean(
            item["sections"]["recognized_section_count"] for item in prepared_values
        ), 2),
        "mean_skill_recall": round(statistics.fmean(item["skill_recall"] for item in prepared_values), 4),
        "timeline_exact_count": sum(
            prepared[item["id"]]["timeline"]["total_experience_months"] == item["experience_months"]
            for item in dataset["cvs"]
        ),
        "timeline_insufficient_count": sum(item["timeline"]["insufficient_data"] for item in prepared_values),
        "unexpected_skill_count": sum(len(item["unexpected_skills"]) for item in prepared_values),
    }
    return {
        "pair_count": len(rows),
        "scenario_metrics": scenario_metrics,
        "strict_monotonic_count": len(by_cv) - len(monotonic_failures),
        "strict_monotonic_rate": round((len(by_cv) - len(monotonic_failures)) / len(by_cv), 4),
        "monotonic_failures": monotonic_failures[:20],
        "parser_metrics": parser_metrics,
    }, rows


def _support(transactions: list[set[str]], itemset: Iterable[str]) -> float:
    target = set(itemset)
    return sum(target.issubset(transaction) for transaction in transactions) / len(transactions)


def _exact_utility(
    transactions: list[dict[str, Any]],
    itemset: Iterable[str],
    utilities: dict[str, float],
) -> tuple[float, int]:
    target = set(itemset)
    value = 0.0
    support_count = 0
    for transaction in transactions:
        if not target.issubset(transaction["items"]):
            continue
        support_count += 1
        value += sum(
            float(transaction["quantities"].get(skill, 1.0)) * utilities[skill]
            for skill in target
        )
    return round(value, 2), support_count


def _mining_benchmark(dataset: dict[str, Any]) -> dict[str, Any]:
    jobs_by_key = {
        (item["domain_code"], item["position_code"], item["level_code"]): item
        for item in dataset["jobs"]
    }
    taxonomy_index = {skill: index for index, skill in enumerate(dataset["taxonomy"])}
    cvs_by_domain: dict[str, list[dict[str, Any]]] = defaultdict(list)
    domain_names = {}
    for candidate in dataset["cvs"]:
        cvs_by_domain[candidate["domain_code"]].append(candidate)
        domain_names[candidate["domain_code"]] = candidate["domain_name"]

    domain_results = []
    all_checks_passed = True
    started_all = time.perf_counter()
    for domain_code, candidates in sorted(cvs_by_domain.items()):
        transactions: list[set[str]] = []
        utility_transactions: list[dict[str, Any]] = []
        domain_taxonomy: set[str] = set()
        for candidate_index, candidate in enumerate(candidates):
            job = jobs_by_key[(domain_code, candidate["target_position_code"], candidate["level_code"])]
            mining_skills = list(dict.fromkeys(
                job["common_skills"] + job["required_skills"][:3] + job["preferred_skills"][:1]
            ))
            skill_set = set(mining_skills)
            domain_taxonomy.update(skill_set)
            transactions.append(skill_set)
            quantities = {
                skill: 2 + ((candidate_index + taxonomy_index[skill]) % 4)
                for skill in skill_set
            }
            utility_transactions.append({"items": set(skill_set), "quantities": quantities})

        apriori_started = time.perf_counter()
        apriori = AprioriAlgorithm(min_support=0.25, min_confidence=0.65)
        frequent_itemsets, rules = apriori.run(transactions)
        apriori_ms = (time.perf_counter() - apriori_started) * 1000
        support_errors = []
        for itemset, reported_support in frequent_itemsets.items():
            expected = _support(transactions, itemset)
            if abs(expected - reported_support) > 1e-9:
                support_errors.append({"itemset": list(itemset), "expected": expected, "actual": reported_support})
        confidence_errors = []
        for rule in rules:
            union_support = _support(transactions, rule["antecedent"] + rule["consequent"])
            antecedent_support = _support(transactions, rule["antecedent"])
            expected = round(union_support / antecedent_support, 3) if antecedent_support else 0
            if abs(expected - float(rule["confidence"])) > 1e-9:
                confidence_errors.append({"rule": rule, "expected": expected})

        utilities = {
            skill: float(1 + (taxonomy_index[skill] % 5))
            for skill in domain_taxonomy
        }
        min_utility = max(20.0, round(len(candidates) * 4.0, 2))
        huim_started = time.perf_counter()
        huim_input = [
            {"items": set(item["items"]), "quantities": dict(item["quantities"])}
            for item in utility_transactions
        ]
        itemsets = TwoPhaseHUIM(min_utility=min_utility, max_itemset_size=3).run(huim_input, utilities)
        huim_ms = (time.perf_counter() - huim_started) * 1000
        huim_errors = []
        for item in itemsets:
            expected_utility, expected_support = _exact_utility(
                utility_transactions, item["itemset"], utilities
            )
            if expected_utility != float(item["utility"]) or expected_support != int(item["support_count"]):
                huim_errors.append(
                    {
                        "itemset": item["itemset"],
                        "expected_utility": expected_utility,
                        "actual_utility": item["utility"],
                        "expected_support": expected_support,
                        "actual_support": item["support_count"],
                    }
                )

        foreign_items = sorted(
            {
                skill
                for item in list(frequent_itemsets) + [tuple(result["itemset"]) for result in itemsets]
                for skill in item
                if skill not in domain_taxonomy
            }
        )
        domain_passed = bool(rules) and bool(itemsets) and not (
            support_errors or confidence_errors or huim_errors or foreign_items
        )
        all_checks_passed = all_checks_passed and domain_passed
        domain_results.append(
            {
                "domain_code": domain_code,
                "domain_name": domain_names[domain_code],
                "transaction_count": len(transactions),
                "taxonomy_size": len(domain_taxonomy),
                "apriori": {
                    "min_support": 0.25,
                    "min_confidence": 0.65,
                    "frequent_itemset_count": len(frequent_itemsets),
                    "rule_count": len(rules),
                    "support_error_count": len(support_errors),
                    "confidence_error_count": len(confidence_errors),
                    "elapsed_ms": round(apriori_ms, 3),
                },
                "huim": {
                    "utility_kind": "trọng số hư cấu 1-5 chỉ để kiểm tra phép tính",
                    "min_utility": min_utility,
                    "itemset_count": len(itemsets),
                    "exact_utility_error_count": len(huim_errors),
                    "elapsed_ms": round(huim_ms, 3),
                },
                "foreign_item_count": len(foreign_items),
                "passed": domain_passed,
            }
        )
    return {
        "domain_count": len(domain_results),
        "all_domains_passed": all_checks_passed,
        "elapsed_ms": round((time.perf_counter() - started_all) * 1000, 3),
        "domains": domain_results,
    }


def _coverage_metrics(dataset: dict[str, Any]) -> dict[str, Any]:
    jobs_by_domain = Counter(item["domain_name"] for item in dataset["jobs"])
    cvs_by_domain = Counter(item["domain_name"] for item in dataset["cvs"])
    positions_by_domain = defaultdict(set)
    levels_by_domain = defaultdict(set)
    for job in dataset["jobs"]:
        positions_by_domain[job["domain_name"]].add(job["position_code"])
        levels_by_domain[job["domain_name"]].add(job["level_name"])
    total_cvs = len(dataset["cvs"])
    it_cvs = cvs_by_domain.get("Công nghệ thông tin", 0)
    candidates_by_job = defaultdict(set)
    for pair in dataset["pairs"]:
        candidates_by_job[pair["job_id"]].add(pair["cv_id"])
    candidate_counts = [len(items) for items in candidates_by_job.values()]
    cases = Counter(item.get("case_type", "unspecified") for item in dataset["cvs"])
    return {
        "domain_count": len(jobs_by_domain),
        "job_count": len(dataset["jobs"]),
        "cv_count": total_cvs,
        "pair_count": len(dataset["pairs"]),
        "position_count": len({(item["domain_code"], item["position_code"]) for item in dataset["jobs"]}),
        "level_count": len({item["level_name"] for item in dataset["jobs"]}),
        "taxonomy_size": len(dataset["taxonomy"]),
        "it_cv_share": round(it_cvs / total_cvs, 4) if total_cvs else 0,
        "candidate_case_counts": dict(cases),
        "min_distinct_candidates_per_job": min(candidate_counts) if candidate_counts else 0,
        "max_distinct_candidates_per_job": max(candidate_counts) if candidate_counts else 0,
        "jobs_by_domain": dict(jobs_by_domain),
        "cvs_by_domain": dict(cvs_by_domain),
        "positions_by_domain": {key: len(value) for key, value in positions_by_domain.items()},
        "levels_by_domain": {key: len(value) for key, value in levels_by_domain.items()},
        "jd_min_words": min(_word_count(item["description"]) for item in dataset["jobs"]),
        "jd_mean_words": round(statistics.fmean(_word_count(item["description"]) for item in dataset["jobs"]), 1),
    }


def _evaluate_checks(report: dict[str, Any]) -> list[dict[str, Any]]:
    coverage = report["coverage"]
    matching = report["matching"]
    parser = matching["parser_metrics"]
    checks = [
        ("Ít nhất 8 ngành", coverage["domain_count"] >= 8, coverage["domain_count"]),
        ("CNTT có ít nhất 12 vị trí", coverage["positions_by_domain"].get("Công nghệ thông tin", 0) >= 12, coverage["positions_by_domain"].get("Công nghệ thông tin", 0)),
        ("CNTT chiếm ít nhất 40% CV", coverage["it_cv_share"] >= 0.4, coverage["it_cv_share"]),
        ("Mỗi JD được đối sánh với ít nhất 15 CV", coverage["min_distinct_candidates_per_job"] >= 15, coverage["min_distinct_candidates_per_job"]),
        ("Có đủ 5 kịch bản bằng chứng CV", len(coverage["candidate_case_counts"]) >= 5, len(coverage["candidate_case_counts"])),
        ("Mỗi CV có ít nhất 900 từ", parser["min_words"] >= 900, parser["min_words"]),
        ("Mỗi JD có ít nhất 800 từ", coverage["jd_min_words"] >= 800, coverage["jd_min_words"]),
        ("Mỗi CV nhận diện ít nhất 7 section", parser["min_recognized_sections"] >= 7, parser["min_recognized_sections"]),
        ("Trích xuất đủ kỹ năng fixture", parser["mean_skill_recall"] == 1.0, parser["mean_skill_recall"]),
        ("Timeline đúng cho toàn bộ CV", parser["timeline_exact_count"] == parser["cv_count"], f"{parser['timeline_exact_count']}/{parser['cv_count']}"),
        ("Ít nhất 95% CV giữ đúng thứ tự ba kịch bản", matching["strict_monotonic_rate"] >= 0.95, matching["strict_monotonic_rate"]),
        ("Apriori/HUIM đúng phép tính và tách domain", report["mining"]["all_domains_passed"], report["mining"]["all_domains_passed"]),
    ]
    return [{"name": name, "passed": passed, "actual": actual} for name, passed, actual in checks]


def _write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def _write_markdown(path: Path, report: dict[str, Any]) -> None:
    coverage = report["coverage"]
    matching = report["matching"]
    parser = matching["parser_metrics"]
    lines = [
        "# Báo cáo benchmark thuật toán offline",
        "",
        "> Dữ liệu trong báo cáo là dữ liệu hư cấu có cấu trúc. Kết quả chứng minh độ bao phủ và tính nhất quán trên bộ test này, không phải độ chính xác trên thị trường lao động.",
        "",
        "## Phạm vi dữ liệu",
        "",
        f"- {coverage['domain_count']} ngành, {coverage['position_count']} vị trí, {coverage['level_count']} cấp bậc.",
        f"- {coverage['job_count']} JD, {coverage['cv_count']} CV dài và {coverage['pair_count']} cặp đối sánh.",
        f"- CNTT chiếm {coverage['it_cv_share'] * 100:.1f}% số CV và có {coverage['positions_by_domain'].get('Công nghệ thông tin', 0)} vị trí con.",
        f"- Mỗi JD được đối sánh với từ {coverage['min_distinct_candidates_per_job']} đến {coverage['max_distinct_candidates_per_job']} CV thuộc {len(coverage['candidate_case_counts'])} kịch bản bằng chứng.",
        f"- CV ngắn nhất {parser['min_words']} từ; JD ngắn nhất {coverage['jd_min_words']} từ.",
        "",
        "| Ngành | Vị trí | JD | CV |",
        "|---|---:|---:|---:|",
    ]
    for domain, job_count in coverage["jobs_by_domain"].items():
        lines.append(
            f"| {domain} | {coverage['positions_by_domain'][domain]} | {job_count} | {coverage['cvs_by_domain'][domain]} |"
        )
    lines.extend(
        [
            "",
            "## Đối sánh tiêu chí có cấu trúc",
            "",
            "| Kịch bản | Số cặp | Điểm nhỏ nhất | Trung bình | Trung vị | P95 | Lớn nhất | P95 thời gian (ms) |",
            "|---|---:|---:|---:|---:|---:|---:|---:|",
        ]
    )
    for scenario, values in matching["scenario_metrics"].items():
        lines.append(
            f"| {scenario} | {values['count']} | {values['score_min']} | {values['score_mean']} | "
            f"{values['score_median']} | {values['score_p95']} | {values['score_max']} | {values['latency_p95_ms']} |"
        )
    lines.extend(
        [
            "",
            f"Thứ tự `cùng vị trí > cùng ngành khác vị trí > trái ngành` đạt {matching['strict_monotonic_count']}/{parser['cv_count']} CV.",
            "Các ngoại lệ được giữ trong báo cáo vì kỹ năng chuyển đổi có thể làm một CV trái ngành khớp hơn vai trò liền kề; benchmark không ép điểm để đạt 100% nhân tạo.",
            "",
            "## Parser và timeline trên văn bản dài",
            "",
            f"- Số section nhận diện: nhỏ nhất {parser['min_recognized_sections']}, trung bình {parser['mean_recognized_sections']}.",
            f"- Tỷ lệ kỹ năng fixture được trích xuất trung bình: {parser['mean_skill_recall'] * 100:.2f}%.",
            f"- Timeline đúng tổng tháng: {parser['timeline_exact_count']}/{parser['cv_count']}; thiếu timeline: {parser['timeline_insufficient_count']}.",
            "",
            "## Apriori và HUIM theo từng ngành",
            "",
            "HUIM dùng trọng số hư cấu 1–5 để kiểm tra phép tính; không diễn giải thành độ hiếm, lương hay giá trị thị trường.",
            "",
            "| Ngành | Giao dịch | Taxonomy | Luật Apriori | Tập HUIM | Sai số | Thời gian (ms) |",
            "|---|---:|---:|---:|---:|---:|---:|",
        ]
    )
    for item in report["mining"]["domains"]:
        errors = (
            item["apriori"]["support_error_count"]
            + item["apriori"]["confidence_error_count"]
            + item["huim"]["exact_utility_error_count"]
            + item["foreign_item_count"]
        )
        elapsed = item["apriori"]["elapsed_ms"] + item["huim"]["elapsed_ms"]
        lines.append(
            f"| {item['domain_name']} | {item['transaction_count']} | {item['taxonomy_size']} | "
            f"{item['apriori']['rule_count']} | {item['huim']['itemset_count']} | {errors} | {elapsed:.3f} |"
        )
    lines.extend(
        [
            "",
            "## Điều kiện kiểm tra tự động",
            "",
            "| Điều kiện | Kết quả | Giá trị thực tế |",
            "|---|---|---|",
        ]
    )
    for check in report["checks"]:
        lines.append(f"| {check['name']} | {'Đạt' if check['passed'] else 'Không đạt'} | {check['actual']} |")
    lines.extend(
        [
            "",
            "## Giới hạn diễn giải",
            "",
            "- Không có truy cập database, backend hoặc Gemini trong phép chạy này.",
            "- Kịch bản được sinh từ catalog nên chỉ kiểm tra tính đúng nội bộ và khả năng phân biệt domain, không thay cho đánh giá CV thật đã ẩn danh.",
            "- Benchmark OCR/layout nằm ở corpus riêng; phép chạy này tập trung vào nội dung dài, section, timeline, tiêu chí và khai phá kỹ năng.",
        ]
    )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def run(catalog_path: Path, dataset_dir: Path, report_dir: Path, regenerate: bool) -> dict[str, Any]:
    started = time.perf_counter()
    dataset = _load_or_generate(catalog_path, dataset_dir, regenerate)
    matching, rows = _matching_benchmark(dataset)
    report = {
        "metadata": {
            **dataset["metadata"],
            "runner": "run_offline_algorithm_benchmark.py",
            "uses_backend": False,
            "uses_database": False,
            "uses_network": False,
            "uses_gemini": False,
        },
        "coverage": _coverage_metrics(dataset),
        "matching": matching,
        "mining": _mining_benchmark(dataset),
    }
    report["checks"] = _evaluate_checks(report)
    report["passed"] = all(item["passed"] for item in report["checks"])
    report["elapsed_ms"] = round((time.perf_counter() - started) * 1000, 3)
    report_dir.mkdir(parents=True, exist_ok=True)
    _write_csv(report_dir / "matching_results.csv", rows)
    (report_dir / "benchmark_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    _write_markdown(report_dir / "BENCHMARK_REPORT.md", report)
    return report


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET_DIR)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT_DIR)
    parser.add_argument("--regenerate", action="store_true")
    args = parser.parse_args()
    report = run(args.catalog, args.dataset, args.report, args.regenerate)
    print(
        f"Benchmark {'ĐẠT' if report['passed'] else 'CHƯA ĐẠT'}: "
        f"{report['coverage']['cv_count']} CV, {report['coverage']['job_count']} JD, "
        f"{report['matching']['pair_count']} cặp, {report['elapsed_ms']} ms."
    )
    print(f"Báo cáo: {args.report / 'BENCHMARK_REPORT.md'}")
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
