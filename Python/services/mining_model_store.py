"""Lưu kết quả khai phá tách theo domain và ghi file nguyên tử."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any


def _read_json(path: str) -> Any:
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError, TypeError):
        return None


def load_models(result_path: str, metadata_path: str, result_key: str) -> dict[str, dict[str, Any]]:
    raw = _read_json(result_path)
    if isinstance(raw, dict) and isinstance(raw.get("models"), dict):
        return raw["models"]
    if isinstance(raw, list):
        metadata = _read_json(metadata_path)
        metadata = metadata if isinstance(metadata, dict) else {}
        return {
            "legacy": {
                "domain": metadata.get("domain") or "legacy",
                "metadata": metadata,
                result_key: raw,
            }
        }
    return {}


def save_domain_model(
    result_path: str,
    metadata_path: str,
    domain: str,
    result_key: str,
    results: list[dict[str, Any]],
    metadata: dict[str, Any],
    reset_models: bool = False,
) -> None:
    key = " ".join((domain or "unknown").strip().casefold().split())
    models = {} if reset_models else load_models(result_path, metadata_path, result_key)
    models.pop("legacy", None)
    models[key] = {
        "domain": domain,
        "metadata": metadata,
        result_key: results,
    }
    _atomic_write(result_path, {"version": 2, "models": models})
    _atomic_write(metadata_path, {
        "status": "success",
        "version": 2,
        "models": {model_key: model.get("metadata", {}) for model_key, model in models.items()},
    })


def flatten_results(result_path: str, metadata_path: str, result_key: str) -> list[dict[str, Any]]:
    flattened: list[dict[str, Any]] = []
    for model in load_models(result_path, metadata_path, result_key).values():
        domain = model.get("domain")
        metadata = model.get("metadata") if isinstance(model.get("metadata"), dict) else {}
        for raw in model.get(result_key, []) if isinstance(model.get(result_key), list) else []:
            if not isinstance(raw, dict):
                continue
            item = dict(raw)
            item["domain"] = domain
            item["dataset_id"] = metadata.get("dataset_id")
            flattened.append(item)
    return flattened


def successful_metadata(metadata_path: str) -> list[dict[str, Any]]:
    raw = _read_json(metadata_path)
    if not isinstance(raw, dict):
        return []
    models = raw.get("models")
    if isinstance(models, dict):
        return [value for value in models.values() if isinstance(value, dict) and value.get("status") == "success"]
    return [raw] if raw.get("status") == "success" else []


def _atomic_write(path: str, payload: Any) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_suffix(target.suffix + ".tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(temporary, target)
