"""Benchmark the local extraction pipeline against the 1,000 mock CV dataset.

This benchmark measures document extraction only. It deliberately does not call
Gemini and must not be presented as an end-to-end AI accuracy benchmark.
"""

from __future__ import annotations

import argparse
import csv
import json
import statistics
import time
from pathlib import Path

from services.doc_parser_service import extract_text_from_file


def percentile(values: list[float], percentile_value: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = (len(ordered) - 1) * percentile_value
    lower = int(index)
    upper = min(lower + 1, len(ordered) - 1)
    fraction = index - lower
    return ordered[lower] + (ordered[upper] - ordered[lower]) * fraction


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input-dir",
        default="../RecruitmentBackend/RecruitmentBackend/Uploads",
    )
    parser.add_argument("--pattern", default="cv_mock_*.pdf")
    parser.add_argument("--limit", type=int, default=1000)
    parser.add_argument("--min-words", type=int, default=35)
    parser.add_argument("--output-dir", default="../TaiLieuBaoCao/BenchmarkResults")
    args = parser.parse_args()

    base_dir = Path(__file__).resolve().parent
    input_dir = (base_dir / args.input_dir).resolve()
    output_dir = (base_dir / args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    def numeric_suffix(path: Path) -> int:
        value = path.stem.rsplit("_", 1)[-1]
        return int(value) if value.isdigit() else 10**9

    files = sorted(input_dir.glob(args.pattern), key=numeric_suffix)[: args.limit]
    if not files:
        raise SystemExit(f"Không tìm thấy dữ liệu tại {input_dir} với mẫu {args.pattern}")

    rows: list[dict[str, object]] = []
    durations: list[float] = []
    successful = 0
    started = time.perf_counter()

    for index, path in enumerate(files, start=1):
        item_started = time.perf_counter()
        error = ""
        text = ""
        try:
            text = extract_text_from_file(path.read_bytes(), path.name, "application/pdf") or ""
        except Exception as exc:  # benchmark must record and continue
            error = f"{type(exc).__name__}: {exc}"

        elapsed_ms = (time.perf_counter() - item_started) * 1000
        word_count = len(text.split())
        is_success = not error and word_count >= args.min_words
        if is_success:
            successful += 1
        durations.append(elapsed_ms)
        rows.append(
            {
                "file": path.name,
                "size_bytes": path.stat().st_size,
                "word_count": word_count,
                "elapsed_ms": round(elapsed_ms, 3),
                "success": is_success,
                "error": error,
            }
        )
        if index % 100 == 0 or index == len(files):
            print(f"Processed {index}/{len(files)} CV files")

    total_seconds = time.perf_counter() - started
    summary = {
        "scope": "Trích xuất văn bản cục bộ; không bao gồm Gemini/chấm điểm AI",
        "dataset_path": str(input_dir),
        "pattern": args.pattern,
        "total_files": len(files),
        "minimum_word_threshold": args.min_words,
        "successful_files": successful,
        "failed_or_insufficient_files": len(files) - successful,
        "success_rate_percent": round(successful * 100 / len(files), 2),
        "total_seconds": round(total_seconds, 3),
        "throughput_files_per_second": round(len(files) / total_seconds, 3),
        "average_ms": round(statistics.mean(durations), 3),
        "median_ms": round(statistics.median(durations), 3),
        "p95_ms": round(percentile(durations, 0.95), 3),
        "max_ms": round(max(durations), 3),
    }

    csv_path = output_dir / "cv_extraction_1000_details.csv"
    json_path = output_dir / "cv_extraction_1000_summary.json"
    with csv_path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    json_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps(summary, ensure_ascii=True, indent=2))
    print(f"Details: {csv_path}")
    print(f"Summary: {json_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
