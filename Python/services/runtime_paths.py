"""Đường dẫn dữ liệu runtime dùng chung cho Apriori/HUIM và taxonomy đã duyệt."""

from __future__ import annotations

import os
from pathlib import Path


RUNTIME_DATA_DIR = Path(os.getenv("MINING_DATA_DIR", "runtime-data"))


def runtime_file(filename: str) -> str:
    RUNTIME_DATA_DIR.mkdir(parents=True, exist_ok=True)
    return str(RUNTIME_DATA_DIR / filename)
