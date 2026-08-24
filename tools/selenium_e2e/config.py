from __future__ import annotations

import os
import secrets
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse


TRUE_VALUES = {"1", "true", "yes", "on"}


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in TRUE_VALUES


def _as_int(value: str | None, default: int, minimum: int = 0) -> int:
    try:
        parsed = int(value or default)
    except (TypeError, ValueError):
        parsed = default
    return max(minimum, parsed)


def load_env_file(path: Path) -> None:
    """Nạp tệp env đơn giản, không ghi đè biến đã có của tiến trình."""
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            os.environ.setdefault(key, value)


@dataclass(frozen=True)
class E2EConfig:
    workspace: Path
    base_url: str
    browser: str
    driver_path: Path | None
    headless: bool
    timeout_seconds: int
    page_load_seconds: int
    allow_writes: bool
    allow_remote_writes: bool
    ignore_certificate_errors: bool
    artifacts_root: Path
    run_id: str
    target_job_id: str
    target_job_title: str
    benchmark_job_id: str
    candidate_count: int
    candidate_email_domain: str
    candidate_batch_tag: str
    candidate_password: str
    hr_email: str
    hr_password: str
    admin_email: str
    admin_password: str
    sourcing_domain: str
    sourcing_position: str
    wait_ai_seconds: int
    submit_timeout_seconds: int
    job_count: int
    approve_created_jobs: bool
    applications_per_job: int
    application_job_batch_size: int
    application_pause_seconds: int
    application_workers: int
    auto_generate_candidate_password: bool
    reuse_candidate_accounts: bool

    @classmethod
    def from_environment(cls, workspace: Path, env_file: Path | None = None) -> "E2EConfig":
        load_env_file(env_file or workspace / "tools" / "selenium_e2e" / ".env")
        run_id = os.getenv("E2E_RUN_ID", "").strip()
        if not run_id:
            from datetime import datetime

            run_id = datetime.now().strftime("%Y%m%d-%H%M%S")

        candidate_password = os.getenv("E2E_CANDIDATE_PASSWORD", "").strip()
        auto_generate_candidate_password = _as_bool(
            os.getenv("E2E_AUTO_GENERATE_CANDIDATE_PASSWORD"), False
        )
        if auto_generate_candidate_password and len(candidate_password) < 6:
            # Chỉ dùng trong tiến trình hiện tại cho lô tài khoản mới; không ghi ra file/log.
            candidate_password = secrets.token_urlsafe(18)

        return cls(
            workspace=workspace,
            base_url=os.getenv("E2E_BASE_URL", "http://localhost:5173").strip().rstrip("/"),
            browser=os.getenv("E2E_BROWSER", "chrome").strip().lower(),
            driver_path=(
                Path(os.getenv("E2E_DRIVER_PATH", "").strip()).expanduser().resolve()
                if os.getenv("E2E_DRIVER_PATH", "").strip()
                else None
            ),
            headless=_as_bool(os.getenv("E2E_HEADLESS"), True),
            timeout_seconds=_as_int(os.getenv("E2E_TIMEOUT_SECONDS"), 25, 5),
            page_load_seconds=_as_int(os.getenv("E2E_PAGE_LOAD_SECONDS"), 60, 10),
            allow_writes=_as_bool(os.getenv("E2E_ALLOW_WRITES")),
            allow_remote_writes=_as_bool(os.getenv("E2E_ALLOW_REMOTE_WRITES")),
            ignore_certificate_errors=_as_bool(os.getenv("E2E_IGNORE_CERTIFICATE_ERRORS")),
            artifacts_root=workspace / ".local" / "selenium-e2e",
            run_id=run_id,
            target_job_id=os.getenv("E2E_TARGET_JOB_ID", "").strip(),
            target_job_title=os.getenv("E2E_TARGET_JOB_TITLE", "Backend Developer").strip(),
            benchmark_job_id=os.getenv(
                "E2E_BENCHMARK_JOB_ID",
                "job--information-technology--backend-developer--junior",
            ).strip(),
            candidate_count=min(_as_int(os.getenv("E2E_CANDIDATE_COUNT"), 15, 1), 50),
            candidate_email_domain=os.getenv("E2E_CANDIDATE_EMAIL_DOMAIN", "example.test").strip(),
            candidate_batch_tag=os.getenv("E2E_CANDIDATE_BATCH_TAG", "").strip(),
            candidate_password=candidate_password,
            hr_email=os.getenv("E2E_HR_EMAIL", "").strip(),
            hr_password=os.getenv("E2E_HR_PASSWORD", "").strip(),
            admin_email=os.getenv("E2E_ADMIN_EMAIL", "").strip(),
            admin_password=os.getenv("E2E_ADMIN_PASSWORD", "").strip(),
            sourcing_domain=os.getenv("E2E_SOURCING_DOMAIN", "Công nghệ thông tin").strip(),
            sourcing_position=os.getenv("E2E_SOURCING_POSITION", "Backend Developer").strip(),
            wait_ai_seconds=_as_int(os.getenv("E2E_WAIT_AI_SECONDS"), 0, 0),
            submit_timeout_seconds=_as_int(os.getenv("E2E_SUBMIT_TIMEOUT_SECONDS"), 180, 45),
            job_count=min(_as_int(os.getenv("E2E_JOB_COUNT"), 24, 1), 24),
            approve_created_jobs=_as_bool(os.getenv("E2E_APPROVE_CREATED_JOBS"), False),
            applications_per_job=min(
                _as_int(os.getenv("E2E_APPLICATIONS_PER_JOB"), 20, 20),
                20,
            ),
            application_job_batch_size=min(
                _as_int(os.getenv("E2E_APPLICATION_JOB_BATCH_SIZE"), 1, 1),
                24,
            ),
            application_pause_seconds=min(
                _as_int(os.getenv("E2E_APPLICATION_PAUSE_SECONDS"), 5, 0),
                120,
            ),
            application_workers=min(
                _as_int(os.getenv("E2E_APPLICATION_WORKERS"), 1, 1),
                8,
            ),
            auto_generate_candidate_password=auto_generate_candidate_password,
            reuse_candidate_accounts=_as_bool(
                os.getenv("E2E_REUSE_CANDIDATE_ACCOUNTS"), False
            ),
        )

    @property
    def run_dir(self) -> Path:
        return self.artifacts_root / self.run_id

    def validate_browser(self) -> None:
        if self.browser not in {"chrome", "edge"}:
            raise ValueError("E2E_BROWSER chỉ hỗ trợ chrome hoặc edge.")
        if self.driver_path is not None and not self.driver_path.is_file():
            raise ValueError(f"E2E_DRIVER_PATH không tồn tại hoặc không phải tệp: {self.driver_path}")
        parsed = urlparse(self.base_url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("E2E_BASE_URL phải là URL HTTP/HTTPS hợp lệ.")

    def require_write_access(self) -> None:
        if not self.allow_writes:
            raise PermissionError(
                "Kịch bản này tạo dữ liệu. Hãy đặt E2E_ALLOW_WRITES=true sau khi kiểm tra đúng môi trường."
            )

        host = (urlparse(self.base_url).hostname or "").lower()
        is_local = host in {"localhost", "127.0.0.1", "::1"}
        if not is_local and not self.allow_remote_writes:
            raise PermissionError(
                "URL không phải local. Muốn ghi dữ liệu từ xa phải đặt thêm E2E_ALLOW_REMOTE_WRITES=true."
            )

    def require_candidate_credentials(self) -> None:
        if len(self.candidate_password) < 6:
            raise ValueError("Thiếu E2E_CANDIDATE_PASSWORD (tối thiểu 6 ký tự).")

    def require_hr_credentials(self) -> None:
        if not self.hr_email or not self.hr_password:
            raise ValueError("Thiếu E2E_HR_EMAIL hoặc E2E_HR_PASSWORD.")

    def require_admin_credentials(self) -> None:
        if not self.admin_email or not self.admin_password:
            raise ValueError("Thiếu E2E_ADMIN_EMAIL hoặc E2E_ADMIN_PASSWORD.")
