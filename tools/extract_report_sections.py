from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from PyPDF2 import PdfReader


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--pages", help="One-based pages/ranges, e.g. 9-12,40,52-60")
    parser.add_argument("--headings", action="store_true")
    args = parser.parse_args()

    reader = PdfReader(str(args.pdf))
    if args.headings:
        pattern = re.compile(r"^(?:CHƯƠNG\s+\d+|\d+(?:\.\d+){0,3})\s+\S", re.IGNORECASE)
        for index, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            matches = [line.strip() for line in text.splitlines() if pattern.match(line.strip())]
            if matches:
                print(f"PDF_PAGE={index}: " + " | ".join(matches))
        return

    selected: set[int] = set()
    for item in (args.pages or f"1-{len(reader.pages)}").split(","):
        start_text, separator, end_text = item.strip().partition("-")
        start = int(start_text)
        end = int(end_text) if separator else start
        selected.update(range(start, end + 1))

    for page_number in sorted(selected):
        text = reader.pages[page_number - 1].extract_text() or ""
        print(f"\n--- PDF PAGE {page_number} ---\n{text}")


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        sys.exit(0)
