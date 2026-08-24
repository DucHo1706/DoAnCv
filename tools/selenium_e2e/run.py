from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
import json
import sys
import threading
import time
from dataclasses import asdict
from pathlib import Path
from typing import Any, Callable


SCRIPT_DIR = Path(__file__).resolve().parent
WORKSPACE = SCRIPT_DIR.parents[1]
if str(WORKSPACE) not in sys.path:
    sys.path.insert(0, str(WORKSPACE))

from tools.selenium_e2e.artifacts import E2EReport, redact  # noqa: E402
from tools.selenium_e2e.config import E2EConfig  # noqa: E402
from tools.selenium_e2e.fixtures import CandidateFixture, build_candidate_fixtures  # noqa: E402
from tools.selenium_e2e.job_candidate_fixtures import (  # noqa: E402
    JobCandidateFixture,
    build_job_candidate_fixtures,
)
from tools.selenium_e2e.job_fixtures import JobFixture, build_job_fixtures  # noqa: E402
from tools.selenium_e2e.webapp import RecruitInsightBrowser  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Kiểm thử RecruitInsightAI qua Chrome/Edge và lưu bằng chứng theo từng bước."
    )
    parser.add_argument(
        "command",
        choices=[
            "doctor",
            "fixtures",
            "job-cv-fixtures",
            "seed-applications",
            "seed-job-applications",
            "repair-job-criteria",
            "audit-job-scores",
            "create-jobs",
            "candidate-search",
            "repost",
            "dashboard",
            "portal-audit",
            "all",
        ],
    )
    parser.add_argument("--env-file", type=Path, default=SCRIPT_DIR / ".env")
    return parser.parse_args()


def serialize_fixtures(fixtures: list[CandidateFixture], target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    payload = []
    for fixture in fixtures:
        item = asdict(fixture)
        item["document_path"] = str(fixture.document_path)
        item["synthetic_web_e2e"] = True
        payload.append(item)
    target.write_text(json.dumps(redact(payload), ensure_ascii=False, indent=2), encoding="utf-8")


def serialize_job_candidate_fixtures(
    fixtures: list[JobCandidateFixture],
    target: Path,
    merge: bool = False,
) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    payload = []
    for fixture in fixtures:
        item = asdict(fixture)
        item["document_path"] = str(fixture.document_path)
        item["synthetic_web_e2e"] = True
        payload.append(item)
    if merge and target.exists():
        try:
            existing = json.loads(target.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            existing = []
        combined = {
            str(item.get("email")): item
            for item in existing
            if isinstance(item, dict) and item.get("email")
        }
        combined.update({str(item["email"]): item for item in payload})
        payload = list(combined.values())
    target.write_text(
        json.dumps(redact(payload), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def make_fixtures(config: E2EConfig) -> list[CandidateFixture]:
    output_dir = config.run_dir / "fixtures"
    fixtures = build_candidate_fixtures(
        workspace=config.workspace,
        output_dir=output_dir,
        benchmark_job_id=config.benchmark_job_id,
        count=config.candidate_count,
        run_id=config.run_id,
        email_domain=config.candidate_email_domain,
    )
    serialize_fixtures(fixtures, config.run_dir / "fixture-manifest.json")
    return fixtures


def run_browser_command(
    config: E2EConfig,
    report: E2EReport,
    action: Callable[[RecruitInsightBrowser], None],
) -> None:
    browser = RecruitInsightBrowser(config)
    try:
        report.add_step("Khởi động trình duyệt", browser.start)
        action(browser)
    finally:
        try:
            browser.write_browser_logs()
        finally:
            browser.close()


def command_doctor(config: E2EConfig, report: E2EReport) -> None:
    def action(browser: RecruitInsightBrowser) -> None:
        report.add_step("Mở trang chủ", lambda: browser.open("/"), browser.screenshot)
        report.metadata["public_job_titles"] = report.add_step(
            "Đọc danh sách việc làm công khai",
            browser.public_job_titles,
            browser.screenshot,
        )
        report.metadata["target_job_url"] = report.add_step(
            "Xác nhận tin mục tiêu đang cho ứng tuyển",
            lambda: browser.assert_target_job_available(
                config.target_job_id, config.target_job_title
            ),
            browser.screenshot,
        )
        report.add_step("Mở trang đăng nhập", lambda: browser.open("/login"), browser.screenshot)
        browser.screenshot("doctor-final")

    run_browser_command(config, report, action)


def command_seed_applications(
    config: E2EConfig,
    report: E2EReport,
    fixtures: list[CandidateFixture],
) -> None:
    config.require_write_access()
    config.require_candidate_credentials()

    def action(browser: RecruitInsightBrowser) -> None:
        outcomes: list[dict[str, str]] = []
        for fixture in fixtures:
            prefix = f"CV {fixture.index:02d} - {fixture.full_name}"

            def register() -> str:
                return browser.register_candidate(
                    fixture.full_name, fixture.email, config.candidate_password
                )

            registration = report.add_step(f"{prefix}: đăng ký", register, browser.screenshot)
            report.add_step(
                f"{prefix}: đăng nhập",
                lambda item=fixture: browser.login(item.email, config.candidate_password),
                browser.screenshot,
            )
            report.add_step(
                f"{prefix}: nộp CV qua giao diện",
                lambda item=fixture: browser.apply_to_job(
                    item.document_path, config.target_job_id, config.target_job_title
                ),
                browser.screenshot,
            )
            ai_status = report.add_step(
                f"{prefix}: kiểm tra trạng thái AI",
                lambda item=fixture: browser.wait_for_ai_result(item.email),
                browser.screenshot,
            )
            outcomes.append(
                {
                    "email": fixture.email,
                    "registration": registration,
                    "application": "submitted",
                    "ai": ai_status,
                }
            )
            browser.clear_session()
        report.metadata["application_outcomes"] = outcomes

    run_browser_command(config, report, action)


def command_seed_job_applications(
    config: E2EConfig,
    report: E2EReport,
    jobs: list[JobFixture],
) -> None:
    config.require_write_access()
    config.require_candidate_credentials()

    job_progress_path = config.run_dir / "job-progress.json"
    if not job_progress_path.exists():
        raise FileNotFoundError(
            "Chưa có job-progress.json. Hãy chạy create-jobs với cùng E2E_RUN_ID trước."
        )
    try:
        job_progress = json.loads(job_progress_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as error:
        raise ValueError("Không đọc được job-progress.json của lượt tạo tin.") from error

    created_raw = job_progress.get("created_by_key") or {}
    created_by_key: dict[str, dict[str, str]] = {}
    for key, value in created_raw.items():
        if isinstance(value, dict):
            created_by_key[str(key)] = {
                "title": str(value.get("title") or ""),
                "job_id": str(value.get("job_id") or ""),
            }
        elif value:
            created_by_key[str(key)] = {"title": str(value), "job_id": ""}

    repair_progress_path = config.run_dir / "job-criteria-repair-progress.json"
    try:
        repair_progress = (
            json.loads(repair_progress_path.read_text(encoding="utf-8"))
            if repair_progress_path.exists()
            else {}
        )
    except (json.JSONDecodeError, OSError):
        repair_progress = {}
    replaced_job_keys = set((repair_progress.get("replaced_jobs") or {}).keys())

    missing_jobs = [job.key for job in jobs if job.key not in created_by_key]
    if missing_jobs:
        raise ValueError(
            "Chưa tạo đủ tin cho ma trận CV: " + ", ".join(missing_jobs[:5])
        )
    missing_ids = [job.key for job in jobs if not created_by_key[job.key]["job_id"]]
    if missing_ids:
        raise ValueError(
            "Progress cũ thiếu JobID chính xác cho: "
            + ", ".join(missing_ids[:5])
            + ". Không dùng tiêu đề để đoán vì có thể nộp nhầm tin trùng tên."
        )

    application_progress_path = config.run_dir / "job-application-progress.json"
    try:
        application_progress = (
            json.loads(application_progress_path.read_text(encoding="utf-8"))
            if application_progress_path.exists()
            else {}
        )
    except (json.JSONDecodeError, OSError):
        application_progress = {}
    job_states = application_progress.setdefault("jobs", {})

    pending_with_index = [
        (index, job)
        for index, job in enumerate(jobs)
        if not bool((job_states.get(job.key) or {}).get("completed"))
    ]
    selected_with_index = pending_with_index[: config.application_job_batch_size]
    if not selected_with_index:
        report.metadata["matrix_status"] = "completed"
        report.metadata["completed_job_count"] = len(jobs)
        return

    progress_lock = threading.Lock()

    def write_application_progress_unlocked() -> None:
        application_progress_path.write_text(
            json.dumps(redact(application_progress), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    selected_jobs = [job for _, job in selected_with_index]
    # Mỗi lượt mặc định xử lý một job để không đẩy 480 tác vụ AI cùng lúc.
    all_fixtures: list[JobCandidateFixture] = []
    for original_index, job in selected_with_index:
        fixture_run_parts = []
        if config.candidate_batch_tag:
            fixture_run_parts.append(config.candidate_batch_tag)
        if job.key in replaced_job_keys:
            fixture_run_parts.append("replacement")
        fixture_run_parts.append(config.run_id)
        generated = build_job_candidate_fixtures(
            jobs=[job],
            output_dir=config.run_dir / "job-cv-fixtures",
            run_id="-".join(fixture_run_parts),
            email_domain=config.candidate_email_domain,
            applications_per_job=config.applications_per_job,
            job_index_offset=original_index,
            reuse_candidate_accounts=config.reuse_candidate_accounts,
        )
        all_fixtures.extend(generated)
    serialize_job_candidate_fixtures(
        all_fixtures,
        config.run_dir / "job-cv-fixture-manifest.json",
        merge=True,
    )

    outcomes: list[dict[str, object]] = []

    def process_jobs(
        browser: RecruitInsightBrowser,
        assigned_jobs: list[tuple[int, JobFixture]],
    ) -> None:
        for job_position, job in assigned_jobs:
            del job_position
            created = created_by_key[job.key]
            with progress_lock:
                state = job_states.setdefault(
                    job.key,
                    {
                        "job_id": created["job_id"],
                        "title": created["title"],
                        "submitted_profiles": {},
                        "completed": False,
                    },
                )
                submitted_profiles = state.setdefault("submitted_profiles", {})
            job_fixtures = [item for item in all_fixtures if item.job_key == job.key]
            for fixture in job_fixtures:
                if fixture.profile_key in submitted_profiles:
                    continue
                prefix = f"{job.position} · CV {fixture.index:02d}/20"
                completed_fixture = False
                for attempt in range(1, 3):
                    attempt_suffix = "" if attempt == 1 else " · thử lại"
                    try:
                        registration = report.add_step(
                            f"{prefix}: đăng ký{attempt_suffix}",
                            lambda item=fixture: browser.register_candidate(
                                item.full_name,
                                item.email,
                                config.candidate_password,
                            ),
                            browser.screenshot,
                        )
                        report.add_step(
                            f"{prefix}: đăng nhập{attempt_suffix}",
                            lambda item=fixture: browser.login(
                                item.email,
                                config.candidate_password,
                            ),
                            browser.screenshot,
                        )
                        application_status = report.add_step(
                            f"{prefix}: nộp CV vào đúng JobID{attempt_suffix}",
                            lambda item=fixture, target=created: browser.apply_to_job(
                                item.document_path,
                                target["job_id"],
                                target["title"],
                            ),
                            browser.screenshot,
                        )
                    except Exception as error:
                        if attempt == 2:
                            with progress_lock:
                                outcomes.append(
                                    {
                                        "job_key": job.key,
                                        "job_id": created["job_id"],
                                        "profile": fixture.profile_key,
                                        "expected_criterion_coverage": fixture.expected_criterion_coverage,
                                        "application": "failed",
                                        "error_type": type(error).__name__,
                                    }
                                )
                        try:
                            browser.clear_session()
                        except Exception:
                            pass
                        continue

                    try:
                        ai_status = report.add_step(
                            f"{prefix}: đọc trạng thái AI{attempt_suffix}",
                            lambda item=fixture: browser.wait_for_ai_result(item.email),
                            browser.screenshot,
                        )
                    except Exception:
                        # Hồ sơ đã nộp thành công vẫn phải được checkpoint; AI có thể hoàn tất nền sau đó.
                        ai_status = "unknown"

                    with progress_lock:
                        submitted_profiles[fixture.profile_key] = {
                            "email": fixture.email,
                            "expected_criterion_coverage": fixture.expected_criterion_coverage,
                            "application": application_status,
                            "ai": ai_status,
                        }
                        outcomes.append(
                            {
                                "job_key": job.key,
                                "job_id": created["job_id"],
                                "profile": fixture.profile_key,
                                "expected_criterion_coverage": fixture.expected_criterion_coverage,
                                "registration": registration,
                                "application": application_status,
                                "ai": ai_status,
                            }
                        )
                        write_application_progress_unlocked()
                    completed_fixture = True
                    try:
                        browser.clear_session()
                    except Exception:
                        pass
                    break

                if not completed_fixture:
                    continue
                if config.application_pause_seconds:
                    time.sleep(config.application_pause_seconds)

            with progress_lock:
                state["completed"] = len(submitted_profiles) == config.applications_per_job
                write_application_progress_unlocked()

    worker_count = min(config.application_workers, len(selected_with_index))
    if worker_count <= 1:
        run_browser_command(
            config,
            report,
            lambda browser: process_jobs(browser, selected_with_index),
        )
    else:
        buckets = [selected_with_index[index::worker_count] for index in range(worker_count)]

        def worker(worker_index: int, assigned_jobs: list[tuple[int, JobFixture]]) -> None:
            browser = RecruitInsightBrowser(config)
            try:
                report.add_step(
                    f"Khởi động trình duyệt worker {worker_index}",
                    browser.start,
                )
                process_jobs(browser, assigned_jobs)
            finally:
                try:
                    browser.write_browser_logs(f"worker-{worker_index}")
                finally:
                    browser.close()

        with ThreadPoolExecutor(max_workers=worker_count) as executor:
            futures = [
                executor.submit(worker, index + 1, bucket)
                for index, bucket in enumerate(buckets)
                if bucket
            ]
            for future in futures:
                future.result()

    report.metadata["application_matrix_outcomes"] = outcomes
    report.metadata["processed_job_keys"] = [job.key for job in selected_jobs]
    report.metadata["applications_per_job"] = config.applications_per_job
    report.metadata["application_workers"] = worker_count
    report.metadata["reuse_candidate_accounts"] = config.reuse_candidate_accounts
    report.metadata["remaining_job_count"] = sum(
        not bool((job_states.get(job.key) or {}).get("completed")) for job in jobs
    )


def command_repair_job_criteria(
    config: E2EConfig,
    report: E2EReport,
    jobs: list[JobFixture],
) -> None:
    config.require_write_access()
    config.require_hr_credentials()
    config.require_admin_credentials()
    job_progress_path = config.run_dir / "job-progress.json"
    if not job_progress_path.exists():
        raise FileNotFoundError(
            "Chưa có job-progress.json. Không thể xác định chính xác các JobID cần sửa."
        )
    job_progress = json.loads(job_progress_path.read_text(encoding="utf-8"))
    created_by_key = job_progress.get("created_by_key") or {}
    if any(not isinstance(created_by_key.get(job.key), dict) for job in jobs):
        raise ValueError("Checkpoint tạo tin không có đủ JobID cho toàn bộ danh mục kiểm thử.")

    repair_path = config.run_dir / "job-criteria-repair-progress.json"
    try:
        repair_progress = (
            json.loads(repair_path.read_text(encoding="utf-8"))
            if repair_path.exists()
            else {}
        )
    except (json.JSONDecodeError, OSError):
        repair_progress = {}
    repaired_keys = set(repair_progress.get("repaired_keys") or [])
    approved_keys = set(repair_progress.get("approved_keys") or [])
    replaced_jobs = dict(repair_progress.get("replaced_jobs") or {})
    application_progress_path = config.run_dir / "job-application-progress.json"
    try:
        application_progress = (
            json.loads(application_progress_path.read_text(encoding="utf-8"))
            if application_progress_path.exists()
            else {"jobs": {}}
        )
    except (json.JSONDecodeError, OSError):
        application_progress = {"jobs": {}}
    application_job_states = application_progress.setdefault("jobs", {})

    def save_job_progress() -> None:
        job_progress["created_by_key"] = created_by_key
        job_progress_path.write_text(
            json.dumps(redact(job_progress), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def save_progress() -> None:
        repair_path.write_text(
            json.dumps(
                {
                    "criterion_group": "Kỹ năng",
                    "repaired_keys": sorted(repaired_keys),
                    "approved_keys": sorted(approved_keys),
                    "replaced_jobs": replaced_jobs,
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )

    def action(browser: RecruitInsightBrowser) -> None:
        report.add_step(
            "Admin đăng nhập để kiểm tra danh mục tiêu chí",
            lambda: browser.login(config.admin_email, config.admin_password),
            browser.screenshot,
        )
        report.metadata["skill_group_status"] = report.add_step(
            "Bảo đảm nhóm Kỹ năng đang hoạt động",
            lambda: browser.admin_ensure_criterion_group_active("Kỹ năng"),
            browser.screenshot,
        )

        pending_repairs = [job for job in jobs if job.key not in repaired_keys]
        if pending_repairs:
            browser.clear_session()
            report.add_step(
                "HR đăng nhập để sửa đúng nhóm bốn tiêu chí kỹ năng",
                lambda: browser.login(config.hr_email, config.hr_password),
                browser.screenshot,
            )
            for job in pending_repairs:
                created = created_by_key[job.key]
                existing_application_state = (
                    application_job_states.get(job.key) or {}
                )
                has_existing_applications = bool(
                    existing_application_state.get("submitted_profiles")
                )
                if has_existing_applications:
                    replacement = report.add_step(
                        f"Tạo tin thay thế có tiêu chí đúng · {job.position}",
                        lambda item=job: browser.recruiter_create_job(item),
                        browser.screenshot,
                    )
                    replaced_jobs[job.key] = {
                        "old_job_id": str(created["job_id"]),
                        "new_job_id": str(replacement["job_id"]),
                        "reason": "Tin cũ đã có ứng viên nên backend không cho đổi tiêu chí chấm điểm.",
                    }
                    created_by_key[job.key] = replacement
                    save_job_progress()
                    superseded = application_progress.setdefault("superseded_jobs", {})
                    superseded[job.key] = existing_application_state
                    application_job_states.pop(job.key, None)
                    application_progress_path.write_text(
                        json.dumps(redact(application_progress), ensure_ascii=False, indent=2),
                        encoding="utf-8",
                    )
                else:
                    report.add_step(
                        f"Sửa nhóm tiêu chí · {job.position}",
                        lambda item=job, target=created: browser.recruiter_repair_job_skill_groups(
                            str(target["job_id"]),
                            tuple(criterion.name for criterion in item.criteria[:4]),
                        ),
                        browser.screenshot,
                    )
                repaired_keys.add(job.key)
                save_progress()
                if config.application_pause_seconds:
                    time.sleep(config.application_pause_seconds)

        pending_approvals = [job for job in jobs if job.key not in approved_keys]
        if pending_approvals:
            browser.clear_session()
            report.add_step(
                "Admin đăng nhập để duyệt lại đúng các tin đã sửa",
                lambda: browser.login(config.admin_email, config.admin_password),
                browser.screenshot,
            )
            for job in pending_approvals:
                created = created_by_key[job.key]
                report.add_step(
                    f"Duyệt lại tin · {job.position}",
                    lambda item=job, target=created: browser.admin_approve_job(
                        str(target["title"]), str(target["job_id"])
                    ),
                    browser.screenshot,
                )
                approved_keys.add(job.key)
                save_progress()
                if config.application_pause_seconds:
                    time.sleep(config.application_pause_seconds)

        report.metadata["criteria_repair"] = {
            "repaired_job_count": len(repaired_keys),
            "approved_job_count": len(approved_keys),
            "total_job_count": len(jobs),
        }

    run_browser_command(config, report, action)


def command_audit_job_scores(config: E2EConfig, report: E2EReport) -> None:
    config.require_hr_credentials()
    job_progress_path = config.run_dir / "job-progress.json"
    application_progress_path = config.run_dir / "job-application-progress.json"
    if not job_progress_path.exists() or not application_progress_path.exists():
        raise FileNotFoundError(
            "Chưa có đủ checkpoint tạo tin và nộp CV để đọc phân bố điểm."
        )
    job_progress = json.loads(job_progress_path.read_text(encoding="utf-8"))
    application_progress = json.loads(application_progress_path.read_text(encoding="utf-8"))
    created_by_key = job_progress.get("created_by_key") or {}
    job_states = application_progress.get("jobs") or {}
    completed_keys = [
        str(key) for key, state in job_states.items()
        if isinstance(state, dict) and state.get("completed")
    ]
    if not completed_keys:
        raise ValueError("Chưa có job nào nộp đủ 20 CV để kiểm tra điểm.")

    def parse_analysis(value: object) -> tuple[dict[str, Any], str]:
        if isinstance(value, dict):
            return value, "json"
        text_value = str(value or "").strip()
        if not text_value:
            return {}, "missing"
        json_start = text_value.find("{")
        if json_start < 0:
            return {}, "legacy_text"
        try:
            parsed, _ = json.JSONDecoder().raw_decode(text_value[json_start:])
            return (parsed, "json") if isinstance(parsed, dict) else ({}, "invalid_json")
        except (json.JSONDecodeError, TypeError, ValueError):
            return {}, "invalid_json"

    def as_mapping(value: object) -> dict[str, Any]:
        return value if isinstance(value, dict) else {}

    def as_items(value: object) -> list[Any]:
        return value if isinstance(value, list) else []

    def language_state(language_review: dict[str, Any]) -> str:
        if not language_review:
            return "missing"
        if language_review.get("insufficient_data") is True:
            reason = str(language_review.get("insufficient_reason") or "unknown")
            return f"insufficient:{reason}"
        if language_review.get("is_fallback") is True:
            return "local_fallback"
        return "ai"

    def score_bucket(score: float) -> str:
        if score <= 0:
            return "0"
        if score >= 100:
            return "100"
        lower = int(score // 10) * 10
        return f"{lower}-{lower + 9}"

    def action(browser: RecruitInsightBrowser) -> None:
        report.add_step(
            "HR đăng nhập để audit snapshot AI",
            lambda: browser.login(config.hr_email, config.hr_password),
            browser.screenshot,
        )
        audit_rows: list[dict[str, object]] = []
        job_summaries: list[dict[str, object]] = []
        missing_profile_total = 0
        extra_application_total = 0
        for key in completed_keys:
            created = created_by_key.get(key) or {}
            job_id = str(created.get("job_id") or "") if isinstance(created, dict) else ""
            title = str(created.get("title") or key) if isinstance(created, dict) else str(created)
            if not job_id:
                raise ValueError(f"Job {key} không có JobID trong checkpoint.")
            actual_rows: list[dict[str, Any]] = report.add_step(
                f"Đọc snapshot AI · {title}",
                lambda target_id=job_id: browser.recruiter_job_ai_snapshots(target_id),
                browser.screenshot,
            )
            submitted_profiles = ((job_states.get(key) or {}).get("submitted_profiles") or {})
            expected_by_email: dict[str, tuple[str, dict[str, Any]]] = {}
            for profile_key, item in submitted_profiles.items():
                if not isinstance(item, dict):
                    continue
                email_key = str(item.get("email") or "").casefold()
                if email_key:
                    expected_by_email[email_key] = (str(profile_key), item)

            matched_profile_keys: set[str] = set()
            job_rows_before = len(audit_rows)
            for item in actual_rows:
                email_key = str(item.get("accountEmail") or item.get("email") or "").casefold()
                expected = expected_by_email.get(email_key)
                if expected is None:
                    extra_application_total += 1
                    continue
                profile_key, expected_profile = expected
                matched_profile_keys.add(profile_key)
                criteria_results = [
                    criterion
                    for criterion in as_items(item.get("criteriaResults"))
                    if isinstance(criterion, dict)
                ]
                analysis, parse_state = parse_analysis(item.get("aiReason"))
                score_analysis = as_mapping(analysis.get("score_analysis"))
                extraction_quality = as_mapping(analysis.get("extraction_quality"))
                language_review = as_mapping(analysis.get("language_review"))
                red_flags = as_items(score_analysis.get("red_flags"))
                red_flag_suspicions = as_items(score_analysis.get("red_flag_suspicions"))
                has_evaluation = bool(
                    str(item.get("aiReason") or "").strip()
                    or criteria_results
                    or as_items(item.get("matchedSkills"))
                    or as_items(item.get("missingSkills"))
                )
                raw_score = item.get("aiScore")
                try:
                    actual_score = float(raw_score) if has_evaluation and raw_score is not None else None
                except (TypeError, ValueError):
                    actual_score = None
                criteria_with_evidence = sum(
                    bool(str(criterion.get("evidenceText") or criterion.get("evidence_text") or "").strip())
                    for criterion in criteria_results
                )
                criteria_needing_verification = sum(
                    criterion.get("needsVerification") is True
                    or criterion.get("needs_verification") is True
                    for criterion in criteria_results
                )
                audit_rows.append(
                    {
                        "job_key": key,
                        "profile_key": profile_key,
                        "expected_criterion_coverage": expected_profile.get("expected_criterion_coverage"),
                        "actual_ai_score": actual_score,
                        "snapshot_state": parse_state,
                        "analysis_version": analysis.get("analysis_version"),
                        "extraction_level": extraction_quality.get("quality_level") or "missing",
                        "extraction_safe": extraction_quality.get("analysis_safe"),
                        "deep_analysis_status": score_analysis.get("deep_analysis_status") or "missing",
                        "language_state": language_state(language_review),
                        "criteria_count": len(criteria_results),
                        "criteria_with_evidence": criteria_with_evidence,
                        "criteria_needing_verification": criteria_needing_verification,
                        "red_flag_count": len(red_flags),
                        "red_flag_suspicion_count": len(red_flag_suspicions),
                        "has_star_content": bool(as_items(analysis.get("optimization_tips"))),
                        "has_interview_content": bool(as_items(analysis.get("mock_interview"))),
                    }
                )

            missing_profiles = sorted(set(submitted_profiles) - matched_profile_keys)
            missing_profile_total += len(missing_profiles)
            current_rows = audit_rows[job_rows_before:]
            current_scores = [
                float(row["actual_ai_score"])
                for row in current_rows
                if row.get("actual_ai_score") is not None
            ]
            job_summaries.append(
                {
                    "job_key": key,
                    "job_title": title,
                    "expected_profiles": len(submitted_profiles),
                    "audited_profiles": len(current_rows),
                    "missing_profile_keys": missing_profiles,
                    "extra_applications_not_in_checkpoint": max(0, len(actual_rows) - len(current_rows)),
                    "completed_score_count": len(current_scores),
                    "unique_score_count": len(set(current_scores)),
                    "minimum_score": min(current_scores) if current_scores else None,
                    "maximum_score": max(current_scores) if current_scores else None,
                    "average_score": round(sum(current_scores) / len(current_scores), 2) if current_scores else None,
                }
            )

        completed_scores = [
            float(item["actual_ai_score"])
            for item in audit_rows
            if item.get("actual_ai_score") is not None
        ]
        snapshot_states = Counter(str(item.get("snapshot_state") or "missing") for item in audit_rows)
        extraction_levels = Counter(str(item.get("extraction_level") or "missing") for item in audit_rows)
        deep_states = Counter(str(item.get("deep_analysis_status") or "missing") for item in audit_rows)
        language_states = Counter(str(item.get("language_state") or "missing") for item in audit_rows)
        analysis_versions = Counter(str(item.get("analysis_version") or "missing") for item in audit_rows)
        score_groups: dict[str, list[float]] = defaultdict(list)
        for item in audit_rows:
            score = item.get("actual_ai_score")
            coverage = item.get("expected_criterion_coverage")
            if score is not None:
                score_groups[str(coverage) if coverage is not None else "missing"].append(float(score))

        out_of_range_scores = [score for score in completed_scores if score < 0 or score > 100]
        missing_evaluation_count = sum(item.get("actual_ai_score") is None for item in audit_rows)
        missing_criteria_count = sum(int(item.get("criteria_count") or 0) == 0 for item in audit_rows)
        invalid_snapshot_count = snapshot_states.get("invalid_json", 0)
        structural_findings: list[str] = []
        if missing_profile_total:
            structural_findings.append(f"Thiếu {missing_profile_total} hồ sơ so với checkpoint.")
        if missing_evaluation_count:
            structural_findings.append(f"Có {missing_evaluation_count} hồ sơ chưa có snapshot điểm AI.")
        if invalid_snapshot_count:
            structural_findings.append(f"Có {invalid_snapshot_count} snapshot JSON không đọc được.")
        if out_of_range_scores:
            structural_findings.append(f"Có {len(out_of_range_scores)} điểm ngoài khoảng 0-100.")
        if len(set(completed_scores)) <= 1 and completed_scores:
            structural_findings.append("Tất cả hồ sơ đang có cùng một mức điểm.")

        criteria_total = sum(int(item.get("criteria_count") or 0) for item in audit_rows)
        evidence_total = sum(int(item.get("criteria_with_evidence") or 0) for item in audit_rows)
        score_audit = {
            "rows": audit_rows,
            "jobs": job_summaries,
            "summary": {
                "job_count": len(completed_keys),
                "checkpoint_application_count": sum(
                    len(((job_states.get(key) or {}).get("submitted_profiles") or {}))
                    for key in completed_keys
                ),
                "audited_application_count": len(audit_rows),
                "missing_checkpoint_profile_count": missing_profile_total,
                "extra_application_count": extra_application_total,
                "completed_ai_count": len(completed_scores),
                "missing_evaluation_count": missing_evaluation_count,
                "missing_criteria_count": missing_criteria_count,
                "unique_actual_scores": sorted(set(completed_scores)),
                "unique_actual_score_count": len(set(completed_scores)),
                "minimum_actual_score": min(completed_scores) if completed_scores else None,
                "maximum_actual_score": max(completed_scores) if completed_scores else None,
                "average_actual_score": round(sum(completed_scores) / len(completed_scores), 2) if completed_scores else None,
                "score_distribution": dict(sorted(Counter(score_bucket(score) for score in completed_scores).items())),
                "score_by_expected_coverage": {
                    key: {
                        "count": len(values),
                        "minimum": min(values),
                        "maximum": max(values),
                        "average": round(sum(values) / len(values), 2),
                    }
                    for key, values in sorted(score_groups.items())
                },
                "snapshot_states": dict(snapshot_states),
                "analysis_versions": dict(analysis_versions),
                "extraction_levels": dict(extraction_levels),
                "extraction_safe_count": sum(item.get("extraction_safe") is True for item in audit_rows),
                "deep_analysis_states": dict(deep_states),
                "language_states": dict(language_states),
                "criteria_total": criteria_total,
                "criteria_with_evidence": evidence_total,
                "criteria_evidence_ratio": round(evidence_total / criteria_total, 4) if criteria_total else 0,
                "applications_with_red_flags": sum(int(item.get("red_flag_count") or 0) > 0 for item in audit_rows),
                "red_flag_total": sum(int(item.get("red_flag_count") or 0) for item in audit_rows),
                "applications_with_unverified_red_flag_suspicions": sum(
                    int(item.get("red_flag_suspicion_count") or 0) > 0 for item in audit_rows
                ),
                "red_flag_suspicion_total": sum(
                    int(item.get("red_flag_suspicion_count") or 0) for item in audit_rows
                ),
                "star_content_count": sum(item.get("has_star_content") is True for item in audit_rows),
                "interview_content_count": sum(item.get("has_interview_content") is True for item in audit_rows),
                "structural_gate_passed": not structural_findings,
                "structural_findings": structural_findings,
            },
        }
        (config.run_dir / "job-score-audit.json").write_text(
            json.dumps(redact(score_audit), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        report.metadata["job_score_audit"] = score_audit["summary"]

        representative_keys = [
            completed_keys[index]
            for index in sorted({0, len(completed_keys) // 2, len(completed_keys) - 1})
        ]
        ui_checks: list[dict[str, object]] = []
        for key in representative_keys:
            created = created_by_key.get(key) or {}
            job_id = str(created.get("job_id") or "") if isinstance(created, dict) else ""
            title = str(created.get("title") or key) if isinstance(created, dict) else str(created)
            visible_rows = report.add_step(
                f"Đối chiếu UI chiến dịch · {title}",
                lambda target_id=job_id: browser.recruiter_campaign_scores(target_id),
                browser.screenshot,
            )
            ui_checks.append(
                {
                    "job_key": key,
                    "visible_application_count": len(visible_rows),
                    "visible_score_count": sum(item.get("score") is not None for item in visible_rows),
                }
            )
        report.metadata["representative_ui_checks"] = ui_checks

    run_browser_command(config, report, action)


def command_candidate_search(
    config: E2EConfig,
    report: E2EReport,
    fixture: CandidateFixture,
) -> None:
    config.require_write_access()
    config.require_candidate_credentials()
    config.require_hr_credentials()

    def action(browser: RecruitInsightBrowser) -> None:
        report.add_step(
            "Ứng viên đăng nhập",
            lambda: browser.login(fixture.email, config.candidate_password),
            browser.screenshot,
        )
        report.add_step(
            "Ứng viên bật quyền tìm kiếm, liên hệ và xem CV",
            browser.enable_candidate_discovery,
            browser.screenshot,
        )
        browser.clear_session()
        report.add_step(
            "HR đăng nhập",
            lambda: browser.login(config.hr_email, config.hr_password),
            browser.screenshot,
        )
        report.add_step(
            "HR tìm và lưu ứng viên vào Talent Pool",
            lambda: browser.recruiter_search_and_save(
                fixture.full_name, config.sourcing_domain, config.sourcing_position
            ),
            browser.screenshot,
        )

    run_browser_command(config, report, action)


def command_create_jobs(
    config: E2EConfig,
    report: E2EReport,
    fixtures: list[JobFixture],
) -> None:
    config.require_write_access()
    if config.approve_created_jobs:
        config.require_admin_credentials()

    progress_path = config.run_dir / "job-progress.json"
    try:
        progress = json.loads(progress_path.read_text(encoding="utf-8")) if progress_path.exists() else {}
    except (json.JSONDecodeError, OSError):
        progress = {}
    created_by_key: dict[str, dict[str, str]] = {}
    for key, value in (progress.get("created_by_key") or {}).items():
        if not key or not value:
            continue
        if isinstance(value, dict):
            created_by_key[str(key)] = {
                "title": str(value.get("title") or ""),
                "job_id": str(value.get("job_id") or ""),
            }
        else:
            # Tương thích progress cũ chỉ lưu tiêu đề. Ma trận CV sẽ từ chối
            # chạy nếu chưa có JobID chính xác thay vì đoán theo tên trùng.
            created_by_key[str(key)] = {"title": str(value), "job_id": ""}
    approved_keys = {str(value) for value in (progress.get("approved_keys") or []) if value}
    needs_creation = any(fixture.key not in created_by_key for fixture in fixtures)
    if needs_creation:
        config.require_hr_credentials()

    def save_progress() -> None:
        progress_path.write_text(
            json.dumps(
                {
                    "created_by_key": created_by_key,
                    "approved_keys": sorted(approved_keys),
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )

    def action(browser: RecruitInsightBrowser) -> None:
        created_titles: list[str] = []
        created_job_ids: list[str] = []
        skipped_creation: list[str] = []
        if needs_creation:
            report.add_step(
                "HR đăng nhập để tạo tin",
                lambda: browser.login(config.hr_email, config.hr_password),
                browser.screenshot,
            )
        for index, fixture in enumerate(fixtures, start=1):
            if fixture.key in created_by_key:
                created_titles.append(created_by_key[fixture.key]["title"])
                created_job_ids.append(created_by_key[fixture.key]["job_id"])
                skipped_creation.append(fixture.position)
                continue
            created = report.add_step(
                f"Tin {index:02d}/{len(fixtures):02d}: tạo {fixture.position}",
                lambda item=fixture: browser.recruiter_create_job(item),
                browser.screenshot,
            )
            created_titles.append(created["title"])
            created_job_ids.append(created["job_id"])
            created_by_key[fixture.key] = created
            save_progress()

        approved_titles: list[str] = []
        skipped_approval: list[str] = []
        if config.approve_created_jobs:
            browser.clear_session()
            report.add_step(
                "Admin đăng nhập để duyệt tin",
                lambda: browser.login(config.admin_email, config.admin_password),
                browser.screenshot,
            )
            for index, fixture in enumerate(fixtures, start=1):
                title = created_by_key[fixture.key]["title"]
                if fixture.key in approved_keys:
                    approved_titles.append(title)
                    skipped_approval.append(title)
                    continue
                report.add_step(
                    f"Tin {index:02d}/{len(created_titles):02d}: Admin duyệt {title}",
                    lambda item=title, job_id=created_by_key[fixture.key]["job_id"]: browser.admin_approve_job(item, job_id),
                    browser.screenshot,
                )
                approved_titles.append(title)
                approved_keys.add(fixture.key)
                save_progress()

        report.metadata["created_job_titles"] = created_titles
        report.metadata["created_job_ids"] = created_job_ids
        report.metadata["approved_job_titles"] = approved_titles
        report.metadata["skipped_creation_from_progress"] = skipped_creation
        report.metadata["skipped_approval_from_progress"] = skipped_approval
        report.metadata["criteria_per_job"] = len(fixtures[0].criteria) if fixtures else 0

    run_browser_command(config, report, action)


def command_repost(config: E2EConfig, report: E2EReport) -> None:
    config.require_write_access()
    config.require_hr_credentials()

    def action(browser: RecruitInsightBrowser) -> None:
        report.add_step(
            "HR đăng nhập",
            lambda: browser.login(config.hr_email, config.hr_password),
            browser.screenshot,
        )
        repost_title = report.add_step(
            "HR đăng lại tin hết hạn",
            lambda: browser.recruiter_repost_expired_job(config.target_job_title),
            browser.screenshot,
        )
        report.metadata["repost_title"] = repost_title
        if config.admin_email and config.admin_password:
            browser.clear_session()
            report.add_step(
                "Admin đăng nhập",
                lambda: browser.login(config.admin_email, config.admin_password),
                browser.screenshot,
            )
            report.add_step(
                "Admin duyệt đợt tuyển dụng mới",
                lambda: browser.admin_approve_job(repost_title or config.target_job_title),
                browser.screenshot,
            )
        else:
            report.metadata["admin_approval"] = "skipped_missing_credentials"

    run_browser_command(config, report, action)


def command_dashboard(config: E2EConfig, report: E2EReport) -> None:
    config.require_hr_credentials()

    def action(browser: RecruitInsightBrowser) -> None:
        report.add_step(
            "HR đăng nhập",
            lambda: browser.login(config.hr_email, config.hr_password),
            browser.screenshot,
        )
        report.metadata["hr_dashboard"] = report.add_step(
            "Đọc chỉ số dashboard HR",
            lambda: browser.dashboard_snapshot("hr"),
            browser.screenshot,
        )
        if config.admin_email and config.admin_password:
            browser.clear_session()
            report.add_step(
                "Admin đăng nhập",
                lambda: browser.login(config.admin_email, config.admin_password),
                browser.screenshot,
            )
            report.metadata["admin_dashboard"] = report.add_step(
                "Đọc chỉ số dashboard Admin",
                lambda: browser.dashboard_snapshot("admin"),
                browser.screenshot,
            )

    run_browser_command(config, report, action)


def command_portal_audit(config: E2EConfig, report: E2EReport) -> None:
    """Kiểm tra read-only toàn bộ route menu HR/Admin trên ba breakpoint."""
    config.require_hr_credentials()
    config.require_admin_credentials()
    viewports = [
        ("desktop", 1440, 1000),
        ("tablet", 820, 1180),
        ("mobile", 390, 844),
    ]
    role_routes = {
        "HR": [
            "/recruiter/dashboard",
            "/recruiter/jobs",
            "/recruiter/applications",
            "/recruiter/schedules",
            "/recruiter/talent-pool",
            "/recruiter/candidate-search",
            "/recruiter/email-logs",
            "/recruiter/profile",
        ],
        "Admin": [
            "/admin/dashboard",
            "/admin/approval",
            "/admin/users",
            "/admin/recruiter-performance",
            "/admin/roles",
            "/admin/organization",
            "/admin/audit-logs",
            "/admin/settings",
            "/admin/profile",
        ],
    }

    def action(browser: RecruitInsightBrowser) -> None:
        results: list[dict[str, object]] = []
        failures: list[str] = []
        for role, routes in role_routes.items():
            browser.clear_session()
            credentials = (
                (config.hr_email, config.hr_password)
                if role == "HR"
                else (config.admin_email, config.admin_password)
            )
            report.add_step(
                f"{role}: đăng nhập để audit giao diện",
                lambda email=credentials[0], password=credentials[1]: browser.login(email, password),
                browser.screenshot,
            )
            # Mỗi route chỉ tải dữ liệu một lần. Hai breakpoint còn lại resize chính
            # trang đã tải để audit responsive, tránh tự vượt quota 100 request/phút.
            for path in routes:
                for viewport_index, (viewport_name, width, height) in enumerate(viewports):
                    step_name = f"{role} {viewport_name}: {path}"
                    try:
                        result = report.add_step(
                            step_name,
                            lambda route=path, name=viewport_name, w=width, h=height, should_reload=viewport_index == 0: browser.audit_portal_route(
                                route, name, w, h, reload_route=should_reload
                            ),
                            browser.screenshot,
                        )
                        results.append(result)
                    except Exception as error:
                        failures.append(f"{step_name}: {type(error).__name__}: {error}")
        report.metadata["portal_audit"] = results
        report.metadata["portal_audit_failures"] = failures
        if failures:
            raise AssertionError(
                f"Portal audit có {len(failures)} route/viewport lỗi; xem report.json và screenshots."
            )

    run_browser_command(config, report, action)


def main() -> int:
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if callable(reconfigure):
            reconfigure(encoding="utf-8", errors="replace")
    args = parse_args()
    config = E2EConfig.from_environment(WORKSPACE, args.env_file)
    config.validate_browser()
    config.run_dir.mkdir(parents=True, exist_ok=True)
    report = E2EReport(
        run_id=config.run_id,
        command=args.command,
        base_url=config.base_url,
        synthetic_data=args.command not in {"doctor", "dashboard"},
    )
    exit_code = 0
    try:
        if args.command == "doctor":
            command_doctor(config, report)
        elif args.command == "fixtures":
            fixtures = report.add_step("Sinh bộ CV chi tiết đa bố cục", lambda: make_fixtures(config))
            report.metadata["fixture_count"] = len(fixtures)
        elif args.command == "job-cv-fixtures":
            jobs = report.add_step(
                "Chuẩn bị danh mục tin cho ma trận CV",
                lambda: build_job_fixtures(config.job_count),
            )
            fixtures = report.add_step(
                "Sinh 20 CV khác nhau cho mỗi tin",
                lambda: build_job_candidate_fixtures(
                    jobs=jobs,
                    output_dir=config.run_dir / "job-cv-fixtures",
                    run_id=config.run_id,
                    email_domain=config.candidate_email_domain,
                    applications_per_job=config.applications_per_job,
                ),
            )
            serialize_job_candidate_fixtures(
                fixtures,
                config.run_dir / "job-cv-fixture-manifest.json",
            )
            report.metadata["fixture_count"] = len(fixtures)
            report.metadata["job_count"] = len(jobs)
        elif args.command == "seed-applications":
            fixtures = report.add_step("Sinh bộ CV chi tiết đa bố cục", lambda: make_fixtures(config))
            command_seed_applications(config, report, fixtures)
        elif args.command == "seed-job-applications":
            jobs = report.add_step(
                "Chuẩn bị danh mục tin cho ma trận ứng tuyển",
                lambda: build_job_fixtures(config.job_count),
            )
            command_seed_job_applications(config, report, jobs)
        elif args.command == "repair-job-criteria":
            jobs = report.add_step(
                "Chuẩn bị danh mục tin cần sửa tiêu chí",
                lambda: build_job_fixtures(config.job_count),
            )
            command_repair_job_criteria(config, report, jobs)
        elif args.command == "audit-job-scores":
            command_audit_job_scores(config, report)
        elif args.command == "create-jobs":
            job_fixtures = report.add_step(
                "Chuẩn bị bộ tin tuyển dụng chi tiết",
                lambda: build_job_fixtures(config.job_count),
            )
            command_create_jobs(config, report, job_fixtures)
        elif args.command == "candidate-search":
            fixtures = report.add_step("Sinh hồ sơ dùng cho sourcing", lambda: make_fixtures(config))
            command_candidate_search(config, report, fixtures[0])
        elif args.command == "repost":
            command_repost(config, report)
        elif args.command == "dashboard":
            command_dashboard(config, report)
        elif args.command == "portal-audit":
            command_portal_audit(config, report)
        elif args.command == "all":
            fixtures = report.add_step("Sinh bộ CV chi tiết đa bố cục", lambda: make_fixtures(config))
            command_seed_applications(config, report, fixtures)
            command_candidate_search(config, report, fixtures[0])
            command_repost(config, report)
            command_dashboard(config, report)
    except Exception as error:
        exit_code = 1
        report.metadata["fatal_error"] = f"{type(error).__name__}: {error}"
        print(f"[FAILED] {type(error).__name__}: {error}", file=sys.stderr)
    finally:
        report.finish()
        report_path = report.write(config.run_dir)
        passed = sum(step.status == "passed" for step in report.steps)
        failed = sum(step.status == "failed" for step in report.steps)
        print(f"Báo cáo: {report_path}")
        print(f"Kết quả: {passed} bước đạt, {failed} bước lỗi.")
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
