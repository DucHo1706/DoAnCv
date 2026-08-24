import ast
import json
import sys
import unittest
from collections import Counter
from pathlib import Path


PYTHON_ROOT = Path(__file__).resolve().parents[1]
TOOLS_ROOT = PYTHON_ROOT / "tools"
if str(TOOLS_ROOT) not in sys.path:
    sys.path.insert(0, str(TOOLS_ROOT))

from generate_offline_benchmark import DEFAULT_CATALOG, build_dataset


class OfflineBenchmarkDatasetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = json.loads(DEFAULT_CATALOG.read_text(encoding="utf-8"))
        cls.dataset = build_dataset(cls.catalog)

    def test_dataset_is_broad_but_weighted_toward_information_technology(self):
        metadata = self.dataset["metadata"]
        self.assertEqual(metadata["domain_count"], 8)
        self.assertGreaterEqual(metadata["position_count"], 54)
        self.assertGreaterEqual(metadata["cv_count"], 200)
        counts = Counter(item["domain_name"] for item in self.dataset["cvs"])
        self.assertGreaterEqual(
            counts["Công nghệ thông tin"] / metadata["cv_count"],
            0.4,
        )

    def test_every_document_is_long_and_every_job_has_valid_criteria(self):
        self.assertGreaterEqual(
            min(len(item["text"].split()) for item in self.dataset["cvs"]),
            900,
        )
        self.assertGreaterEqual(
            min(len(item["description"].split()) for item in self.dataset["jobs"]),
            800,
        )
        for job in self.dataset["jobs"]:
            self.assertEqual(sum(item["weight"] for item in job["criteria"]), 100)
            self.assertTrue(job["required_skills"])
            self.assertTrue(job["preferred_skills"])

    def test_cv_input_is_detailed_without_leaking_benchmark_labels(self):
        for candidate in self.dataset["cvs"]:
            text = candidate["text"]
            self.assertIn("BẰNG CHỨNG SỬ DỤNG KỸ NĂNG", text)
            self.assertGreaterEqual(text.count("Dự án "), 2)
            self.assertRegex(text, r"\d+%")
            self.assertNotIn("Kịch bản kiểm thử:", text)
            self.assertNotIn("ĐIỂM HỆ THỐNG CẦN KIỂM TRA", text)

    def test_each_cv_has_exactly_three_distinct_matching_scenarios(self):
        scenarios_by_cv = {}
        for pair in self.dataset["pairs"]:
            scenarios_by_cv.setdefault(pair["cv_id"], set()).add(pair["scenario"])
        self.assertEqual(set(scenarios_by_cv), {item["id"] for item in self.dataset["cvs"]})
        for scenarios in scenarios_by_cv.values():
            self.assertEqual(
                scenarios,
                {"strong_same_role", "partial_same_domain", "negative_cross_domain"},
            )

    def test_every_job_is_compared_with_at_least_fifteen_distinct_candidates(self):
        candidates_by_job = {}
        for pair in self.dataset["pairs"]:
            candidates_by_job.setdefault(pair["job_id"], set()).add(pair["cv_id"])
        self.assertEqual(set(candidates_by_job), {item["id"] for item in self.dataset["jobs"]})
        self.assertGreaterEqual(min(map(len, candidates_by_job.values())), 15)
        self.assertGreaterEqual(
            self.dataset["metadata"]["min_distinct_candidates_per_job"],
            15,
        )

    def test_dataset_covers_five_candidate_evidence_cases(self):
        expected = {
            "strong_documented",
            "preferred_skill_gap",
            "experience_below_requirement",
            "transferable_education",
            "language_needs_verification",
        }
        actual = Counter(item["case_type"] for item in self.dataset["cvs"])
        self.assertEqual(set(actual), expected)
        self.assertTrue(all(count > 0 for count in actual.values()))
        self.assertTrue(all(item["expected_findings"] for item in self.dataset["cvs"]))

    def test_offline_runner_does_not_import_database_network_or_backend_clients(self):
        source_path = TOOLS_ROOT / "run_offline_algorithm_benchmark.py"
        tree = ast.parse(source_path.read_text(encoding="utf-8"))
        imported_roots = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported_roots.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imported_roots.add(node.module.split(".")[0])
        self.assertTrue(
            imported_roots.isdisjoint(
                {"pyodbc", "pymssql", "sqlalchemy", "requests", "httpx", "subprocess"}
            )
        )


if __name__ == "__main__":
    unittest.main()
