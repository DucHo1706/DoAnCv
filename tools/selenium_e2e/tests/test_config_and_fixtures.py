from __future__ import annotations

import os
import tempfile
import unittest
from unittest.mock import patch
from collections import Counter
from hashlib import sha256
from pathlib import Path

from tools.selenium_e2e.config import E2EConfig
from tools.selenium_e2e.fixtures import build_candidate_fixtures
from tools.selenium_e2e.job_candidate_fixtures import (
    build_job_candidate_fixtures,
    expected_coverage_scale,
)
from tools.selenium_e2e.job_fixtures import build_job_fixtures


WORKSPACE = Path(__file__).resolve().parents[3]


class ConfigTests(unittest.TestCase):
    def test_write_guard_blocks_by_default(self) -> None:
        previous = os.environ.pop("E2E_ALLOW_WRITES", None)
        try:
            config = E2EConfig.from_environment(WORKSPACE, Path("missing.env"))
            with self.assertRaises(PermissionError):
                config.require_write_access()
        finally:
            if previous is not None:
                os.environ["E2E_ALLOW_WRITES"] = previous

    def test_job_creation_defaults_to_pending_for_manual_admin_review(self) -> None:
        previous_count = os.environ.pop("E2E_JOB_COUNT", None)
        previous_approval = os.environ.pop("E2E_APPROVE_CREATED_JOBS", None)
        try:
            config = E2EConfig.from_environment(WORKSPACE, Path("missing.env"))
            self.assertEqual(24, config.job_count)
            self.assertFalse(config.approve_created_jobs)
        finally:
            if previous_count is not None:
                os.environ["E2E_JOB_COUNT"] = previous_count
            if previous_approval is not None:
                os.environ["E2E_APPROVE_CREATED_JOBS"] = previous_approval

    def test_application_worker_count_is_capped_at_eight(self) -> None:
        with patch.dict(os.environ, {"E2E_APPLICATION_WORKERS": "9"}, clear=False):
            config = E2EConfig.from_environment(WORKSPACE, Path("missing.env"))
        self.assertEqual(8, config.application_workers)

    def test_can_enable_reusing_candidate_accounts_across_jobs(self) -> None:
        with patch.dict(
            os.environ,
            {"E2E_REUSE_CANDIDATE_ACCOUNTS": "true"},
            clear=False,
        ):
            config = E2EConfig.from_environment(WORKSPACE, Path("missing.env"))
        self.assertTrue(config.reuse_candidate_accounts)

    def test_can_generate_ephemeral_candidate_password_for_new_batch(self) -> None:
        with patch.dict(
            os.environ,
            {"E2E_AUTO_GENERATE_CANDIDATE_PASSWORD": "true"},
            clear=False,
        ):
            config = E2EConfig.from_environment(WORKSPACE, Path("missing.env"))

        self.assertGreaterEqual(len(config.candidate_password), 6)
        self.assertTrue(config.auto_generate_candidate_password)
        config.require_candidate_credentials()


class FixtureTests(unittest.TestCase):
    def test_builds_detailed_structured_job_catalog(self) -> None:
        fixtures = build_job_fixtures(24)
        self.assertEqual(24, len(fixtures))
        self.assertEqual(24, len({item.position for item in fixtures}))
        self.assertGreaterEqual(len({item.branch for item in fixtures}), 7)
        self.assertGreaterEqual(len({item.level_path for item in fixtures}), 4)
        self.assertTrue(any(len(item.category_path) > 1 for item in fixtures))
        for fixture in fixtures:
            self.assertGreaterEqual(len(fixture.description), 900)
            self.assertGreaterEqual(len(fixture.requirements), 700)
            self.assertNotIn("TEST-DATA", fixture.description.upper())
            self.assertNotIn("TEST-IT", fixture.description.upper())
            self.assertEqual(8, len(fixture.criteria))
            self.assertEqual(100, sum(item.weight for item in fixture.criteria))
            self.assertEqual(4, sum(item.group == "Kỹ năng" for item in fixture.criteria))
            self.assertEqual(
                1,
                sum(item.group == "Tổng kinh nghiệm liên quan" for item in fixture.criteria),
            )

    def test_builds_stratified_detailed_distinct_documents(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            fixtures = build_candidate_fixtures(
                workspace=WORKSPACE,
                output_dir=Path(directory),
                benchmark_job_id="job--information-technology--backend-developer--junior",
                count=15,
                run_id="unit-test",
                email_domain="example.test",
            )
            self.assertEqual(15, len(fixtures))
            self.assertEqual(15, len({item.layout for item in fixtures}))
            self.assertEqual({".docx", ".pdf"}, {item.document_path.suffix for item in fixtures})
            self.assertEqual([".docx", ".pdf", ".pdf"], [item.document_path.suffix for item in fixtures[:3]])
            self.assertIn("scan", fixtures[2].layout.casefold())
            self.assertEqual(15, len({item.source_cv_id for item in fixtures}))
            self.assertEqual(
                {"strong_same_role": 5, "partial_same_domain": 5, "negative_cross_domain": 5},
                dict(Counter(item.match_scenario for item in fixtures)),
            )
            self.assertEqual(
                {
                    "strong_documented": 3,
                    "preferred_skill_gap": 3,
                    "experience_below_requirement": 3,
                    "transferable_education": 3,
                    "language_needs_verification": 3,
                },
                dict(Counter(item.case_type for item in fixtures)),
            )
            self.assertEqual(
                15,
                len({(item.match_scenario, item.case_type) for item in fixtures}),
            )
            scores_by_scenario = {
                scenario: [item.expected_offline_score for item in fixtures if item.match_scenario == scenario]
                for scenario in {item.match_scenario for item in fixtures}
            }
            self.assertGreater(
                min(scores_by_scenario["strong_same_role"]),
                max(scores_by_scenario["partial_same_domain"]),
            )
            self.assertGreater(
                min(scores_by_scenario["partial_same_domain"]),
                max(scores_by_scenario["negative_cross_domain"]),
            )
            for fixture in fixtures:
                self.assertTrue(fixture.document_path.exists())
                self.assertGreater(fixture.document_path.stat().st_size, 8_000)

    def test_builds_twenty_distinct_job_specific_cvs_with_spread_coverage(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            job = build_job_fixtures(1)[0]
            fixtures = build_job_candidate_fixtures(
                jobs=[job],
                output_dir=Path(directory),
                run_id="job-matrix-unit",
                email_domain="example.test",
            )
            self.assertEqual(20, len(fixtures))
            self.assertEqual(20, len({item.profile_key for item in fixtures}))
            self.assertEqual(20, len({item.email for item in fixtures}))
            self.assertEqual(20, len({item.layout for item in fixtures}))
            self.assertEqual(expected_coverage_scale(), tuple(item.expected_criterion_coverage for item in fixtures))
            self.assertEqual((0, 100), (min(expected_coverage_scale()), max(expected_coverage_scale())))
            self.assertEqual(20, len(set(expected_coverage_scale())))
            self.assertTrue(all(item.word_count >= 900 for item in fixtures))
            red_flag_rules = {
                item.profile_key: item.expected_red_flag_rules
                for item in fixtures
                if item.expected_red_flag_rules
            }
            self.assertEqual(
                {
                    "experience-skill": ("timeline_future_end",),
                    "skills-experience": ("timeline_reversed",),
                },
                red_flag_rules,
            )
            self.assertEqual({".docx", ".pdf"}, {item.document_path.suffix for item in fixtures})
            document_hashes = {
                sha256(item.document_path.read_bytes()).hexdigest() for item in fixtures
            }
            self.assertEqual(20, len(document_hashes))

    def test_replacement_batch_prefix_keeps_candidate_accounts_distinct(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            job = build_job_fixtures(1)[0]
            original = build_job_candidate_fixtures(
                jobs=[job],
                output_dir=Path(directory) / "original",
                run_id="local-create-jobs-ui-20260824",
                email_domain="example.test",
            )
            replacement = build_job_candidate_fixtures(
                jobs=[job],
                output_dir=Path(directory) / "replacement",
                run_id="replacement-local-create-jobs-ui-20260824",
                email_domain="example.test",
            )
            self.assertTrue(
                {item.email for item in original}.isdisjoint(
                    {item.email for item in replacement}
                )
            )

    def test_can_reuse_twenty_candidate_identities_across_jobs(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            fixtures = build_job_candidate_fixtures(
                jobs=build_job_fixtures(2),
                output_dir=Path(directory),
                run_id="shared-candidate-unit",
                email_domain="example.test",
                reuse_candidate_accounts=True,
            )

            self.assertEqual(40, len(fixtures))
            self.assertEqual(20, len({item.email for item in fixtures}))
            for profile_key in {item.profile_key for item in fixtures}:
                identities = {
                    (item.email, item.full_name)
                    for item in fixtures
                    if item.profile_key == profile_key
                }
                self.assertEqual(1, len(identities))


if __name__ == "__main__":
    unittest.main()
