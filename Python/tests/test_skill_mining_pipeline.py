import json
import tempfile
import unittest
import uuid
from pathlib import Path
from unittest.mock import patch

from services import apriori_service, huim_service
from services.skill_mining_guard import canonicalize_transactions_with_indices


class SkillMiningPipelineTests(unittest.TestCase):
    def test_no_supplied_taxonomy_does_not_use_hidden_defaults(self):
        rows, indices, metadata = canonicalize_transactions_with_indices(
            [["Python", "SQL"]],
            domain="Công nghệ thông tin",
        )
        self.assertEqual(rows, [])
        self.assertEqual(indices, [])
        self.assertEqual(metadata["taxonomy_size"], 0)

    def test_canonicalization_keeps_source_indices(self):
        rows, indices, metadata = canonicalize_transactions_with_indices(
            [["khong-phai-skill"], ["Python", "SQL"]],
            domain="IT",
            taxonomy_skills=["python", "sql"],
        )
        self.assertEqual(indices, [1])
        self.assertEqual(rows, [{"python", "sql"}])
        self.assertEqual(metadata["accepted_transactions"], 1)

    def test_apriori_aliases_share_one_canonical_item(self):
        rows, _, metadata = canonicalize_transactions_with_indices(
            [["Node.js"], ["NodeJS"], ["Node JS"]],
            domain="IT",
            taxonomy_skills=["node.js"],
            taxonomy_aliases={"NodeJS": "node.js", "Node JS": "node.js"},
        )
        self.assertEqual(rows, [{"node.js"}, {"node.js"}, {"node.js"}])
        self.assertEqual(metadata["accepted_transactions"], 3)
        self.assertEqual(set(metadata["aliases_used"].values()), {"node.js"})

    def test_huim_quantities_follow_the_accepted_source_row(self):
        transactions = [
            {"items": ["khong-phai-skill"], "quantities": {"khong-phai-skill": 9}},
            {"items": ["python"], "quantities": {"python": 2}},
        ]
        with tempfile.TemporaryDirectory() as directory:
            result_file = str(Path(directory) / "huim.json")
            metadata_file = str(Path(directory) / "meta.json")
            with patch.object(huim_service, "HUIM_FILE", result_file), patch.object(
                huim_service, "HUIM_METADATA_FILE", metadata_file
            ):
                results = huim_service.train_and_save_huim(
                    transactions,
                    {"python": 10},
                    min_utility=1,
                    domain="IT",
                    taxonomy_skills=["python"],
                    min_support_count=1,
                )
            self.assertEqual(results[0]["itemset"], ["python"])
            self.assertEqual(results[0]["utility"], 20)
            self.assertTrue(Path(result_file).exists())
            self.assertEqual(json.loads(Path(metadata_file).read_text(encoding="utf-8"))["status"], "success")

    def test_huim_alias_quantity_and_utility_use_canonical_item(self):
        transactions = [{"items": ["NodeJS"], "quantities": {"NodeJS": 3}}]
        with tempfile.TemporaryDirectory() as directory:
            result_file = str(Path(directory) / "huim.json")
            metadata_file = str(Path(directory) / "meta.json")
            with patch.object(huim_service, "HUIM_FILE", result_file), patch.object(
                huim_service, "HUIM_METADATA_FILE", metadata_file
            ):
                results = huim_service.train_and_save_huim(
                    transactions,
                    {"Node JS": 10},
                    min_utility=1,
                    domain="IT",
                    taxonomy_skills=["node.js"],
                    taxonomy_aliases={"NodeJS": "node.js", "Node JS": "node.js"},
                    min_support_count=1,
                )

        self.assertEqual(results[0]["itemset"], ["node.js"])
        self.assertEqual(results[0]["utility"], 30)

    def test_apriori_keeps_models_of_multiple_domains(self):
        with tempfile.TemporaryDirectory() as directory:
            result_file = str(Path(directory) / "rules.json")
            metadata_file = str(Path(directory) / "meta.json")
            with patch.object(apriori_service, "RULES_FILE", result_file), patch.object(
                apriori_service, "RULES_METADATA_FILE", metadata_file
            ):
                domains_under_test = {
                    f"domain-{uuid.uuid4().hex}",
                    f"domain-{uuid.uuid4().hex}",
                }
                for domain in domains_under_test:
                    apriori_service.train_and_save_rules(
                        [["python", "sql"], ["python", "sql"]],
                        domain=domain,
                        taxonomy_skills=["python", "sql"],
                        min_support_count=2,
                    )
                domains = {item["domain"] for item in apriori_service.get_all_rules()}
                self.assertEqual(domains, domains_under_test)

                replacement_domain = f"domain-{uuid.uuid4().hex}"
                apriori_service.train_and_save_rules(
                    [["python", "sql"], ["python", "sql"]],
                    domain=replacement_domain,
                    taxonomy_skills=["python", "sql"],
                    min_support_count=2,
                    reset_models=True,
                )
                domains_after_reset = {item["domain"] for item in apriori_service.get_all_rules()}
                self.assertEqual(domains_after_reset, {replacement_domain})


if __name__ == "__main__":
    unittest.main()
