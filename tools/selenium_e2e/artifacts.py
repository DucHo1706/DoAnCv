from __future__ import annotations

import json
import re
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable


SENSITIVE_KEY = re.compile(r"password|secret|token|api.?key|connection", re.IGNORECASE)


def redact(value: Any, key: str = "") -> Any:
    if SENSITIVE_KEY.search(key):
        return "[REDACTED]"
    if isinstance(value, dict):
        return {str(k): redact(v, str(k)) for k, v in value.items()}
    if isinstance(value, list):
        return [redact(item) for item in value]
    return value


def safe_name(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9_-]+", "-", value).strip("-").lower()
    return normalized[:80] or "step"


@dataclass
class StepResult:
    name: str
    status: str
    started_at: str
    duration_ms: int
    detail: str = ""
    screenshot: str | None = None


@dataclass
class E2EReport:
    run_id: str
    command: str
    base_url: str
    synthetic_data: bool
    started_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: str | None = None
    steps: list[StepResult] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    def add_step(
        self,
        name: str,
        function: Callable[[], Any],
        screenshot_on_error: Callable[[str], Path | None] | None = None,
    ) -> Any:
        started = time.perf_counter()
        started_at = datetime.now(timezone.utc).isoformat()
        try:
            result = function()
            self.steps.append(
                StepResult(
                    name=name,
                    status="passed",
                    started_at=started_at,
                    duration_ms=int((time.perf_counter() - started) * 1000),
                )
            )
            return result
        except Exception as error:
            screenshot = screenshot_on_error(safe_name(name)) if screenshot_on_error else None
            self.steps.append(
                StepResult(
                    name=name,
                    status="failed",
                    started_at=started_at,
                    duration_ms=int((time.perf_counter() - started) * 1000),
                    detail=f"{type(error).__name__}: {error}",
                    screenshot=str(screenshot) if screenshot else None,
                )
            )
            raise

    def finish(self) -> None:
        self.completed_at = datetime.now(timezone.utc).isoformat()

    def write(self, run_dir: Path) -> Path:
        run_dir.mkdir(parents=True, exist_ok=True)
        target = run_dir / "report.json"
        target.write_text(
            json.dumps(redact(asdict(self)), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return target
