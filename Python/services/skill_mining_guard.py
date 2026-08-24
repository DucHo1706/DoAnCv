"""Input validation and provenance helpers for Apriori/HUIM mining.

Mining must never treat arbitrary OCR tokens as canonical skills. The accepted
taxonomy must be supplied from the reviewed SQL skill catalog; algorithm code
does not carry a hidden list of domain answers.
"""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from typing import Any, Iterable, Mapping

_MOJIBAKE = re.compile(r"(?:Ã.|Â.|áº|Ä.|�)")


def normalize_skill(value: Any) -> str:
    return " ".join(str(value or "").strip().lower().split())


def normalize_match_key(value: Any) -> str:
    """Chuẩn hóa chính tả kỹ thuật, không quyết định hai skill có đồng nghĩa hay không."""
    decomposed = unicodedata.normalize("NFKD", str(value or "").strip().casefold())
    output: list[str] = []
    symbol_words = {".": "dot", "#": "sharp", "+": "plus", "&": "and"}
    for character in decomposed:
        if unicodedata.category(character) == "Mn":
            continue
        if character.isalnum():
            output.append(character)
        elif character in symbol_words:
            output.extend((" ", symbol_words[character], " "))
        else:
            output.append(" ")
    return " ".join("".join(output).split())


def is_suspicious_skill(value: str) -> bool:
    if not value or len(value) > 64 or len(value.split()) > 5:
        return True
    return bool(_MOJIBAKE.search(value))


def taxonomy_for(domain: str | None, supplied: Iterable[str] | None = None) -> set[str]:
    del domain
    return {
        normalize_skill(value)
        for value in supplied or []
        if normalize_skill(value) and not is_suspicious_skill(normalize_skill(value))
    }


def build_canonical_map(
    taxonomy_skills: Iterable[str] | None,
    taxonomy_aliases: Mapping[str, str] | None = None,
) -> tuple[set[str], dict[str, str]]:
    allowed = taxonomy_for(None, taxonomy_skills)
    canonical_map = {
        normalize_match_key(canonical): canonical
        for canonical in allowed
        if normalize_match_key(canonical)
    }
    for raw_alias, raw_canonical in (taxonomy_aliases or {}).items():
        alias_key = normalize_match_key(raw_alias)
        canonical = normalize_skill(raw_canonical)
        if alias_key and canonical in allowed:
            canonical_map[alias_key] = canonical
    return allowed, canonical_map


def canonicalize_skill_values(
    values: Iterable[str] | None,
    taxonomy_skills: Iterable[str] | None,
    taxonomy_aliases: Mapping[str, str] | None = None,
) -> list[str]:
    _, canonical_map = build_canonical_map(taxonomy_skills, taxonomy_aliases)
    accepted = {
        canonical_map[key]
        for value in values or []
        if (key := normalize_match_key(value)) in canonical_map
    }
    return sorted(accepted)


def canonicalize_transactions(
    transactions: Iterable[Iterable[str]],
    domain: str | None = None,
    taxonomy_skills: Iterable[str] | None = None,
    taxonomy_aliases: Mapping[str, str] | None = None,
) -> tuple[list[set[str]], dict[str, Any]]:
    accepted, _, metadata = canonicalize_transactions_with_indices(
        transactions, domain, taxonomy_skills, taxonomy_aliases
    )
    return accepted, metadata


def canonicalize_transactions_with_indices(
    transactions: Iterable[Iterable[str]],
    domain: str | None = None,
    taxonomy_skills: Iterable[str] | None = None,
    taxonomy_aliases: Mapping[str, str] | None = None,
) -> tuple[list[set[str]], list[int], dict[str, Any]]:
    """Chuẩn hóa giao dịch và giữ chỉ số dòng gốc để quantity không bị lệch."""
    allowed, canonical_map = build_canonical_map(taxonomy_skills, taxonomy_aliases)
    accepted: list[set[str]] = []
    accepted_indices: list[int] = []
    rejected: dict[str, int] = {}
    aliases_used: dict[str, str] = {}

    for source_index, raw_transaction in enumerate(transactions):
        row: set[str] = set()
        for raw in raw_transaction or []:
            original = normalize_skill(raw)
            match_key = normalize_match_key(raw)
            candidate = canonical_map.get(match_key, "")
            if not candidate or is_suspicious_skill(candidate) or candidate not in allowed:
                if original:
                    rejected[original] = rejected.get(original, 0) + 1
                continue
            if normalize_match_key(candidate) != match_key:
                aliases_used[original] = candidate
            row.add(candidate)
        if row:
            accepted.append(row)
            accepted_indices.append(source_index)

    return accepted, accepted_indices, {
        "domain": normalize_skill(domain) or None,
        "taxonomy_size": len(allowed),
        "taxonomy_alias_count": max(0, len(canonical_map) - len(allowed)),
        "accepted_transactions": len(accepted),
        "rejected_skills": rejected,
        "aliases_used": aliases_used,
    }


def rarity_label(support_rate: float) -> str:
    if support_rate < 0.05:
        return "hiếm trong tập dữ liệu"
    if support_rate < 0.15:
        return "ít phổ biến trong tập dữ liệu"
    return "phổ biến trong tập dữ liệu"


def write_metadata(path: str, metadata: dict[str, Any]) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
