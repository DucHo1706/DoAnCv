"""Smoke benchmark for the template-independent extraction pipeline."""

from __future__ import annotations

import argparse
from pathlib import Path

from services.doc_parser_service import extract_document_from_file


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", default="../RecruitmentBackend/RecruitmentBackend/Uploads")
    parser.add_argument("--pattern", default="cv_*.pdf")
    parser.add_argument("--limit", type=int, default=15)
    args = parser.parse_args()

    base = Path(__file__).resolve().parent
    paths = sorted((base / args.input_dir).resolve().glob(args.pattern))[: args.limit]
    if not paths:
        print("Không tìm thấy tệp phù hợp.")
        return 1

    success = 0
    for path in paths:
        content_type = "application/pdf" if path.suffix.lower() == ".pdf" else "application/octet-stream"
        result = extract_document_from_file(path.read_bytes(), path.name, content_type)
        if result.quality_level != "insufficient":
            success += 1
        print("|".join([
            path.name, result.method, str(result.quality_score), result.quality_level,
            f"blocks={len(result.blocks)}", f"words={len(result.text.split())}",
        ]))
    print(f"usable={success}/{len(paths)}")
    return 0 if success == len(paths) else 2


if __name__ == "__main__":
    raise SystemExit(main())
