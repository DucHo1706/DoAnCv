import unittest
import json
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import Mock, patch

import nlp_processor
from services import skills_sync_service
from services.skill_mining_guard import (
    build_canonical_map,
    canonicalize_transactions_with_indices,
    normalize_match_key,
)


class SkillTaxonomyAliasTests(unittest.TestCase):
    def setUp(self):
        self.original_skills = nlp_processor.SKILL_DB
        self.original_aliases = nlp_processor.SKILL_ALIASES
        taxonomy = {
            "asp.net core", "node.js", "power bi", "sql server",
            "sql", "kubernetes", "c", "c#",
        }
        aliases = {
            "ASPNet Core": "asp.net core",
            "NodeJS": "node.js",
            "PowerBI": "power bi",
            "MSSQL": "sql server",
            "K8s": "kubernetes",
        }
        _, canonical_map = build_canonical_map(taxonomy, aliases)
        nlp_processor.SKILL_DB = taxonomy
        nlp_processor.SKILL_ALIASES = canonical_map

    def tearDown(self):
        nlp_processor.SKILL_DB = self.original_skills
        nlp_processor.SKILL_ALIASES = self.original_aliases

    def test_extracts_multiple_spellings_as_canonical_skills(self):
        result = nlp_processor.extract_skills(
            "Backend: ASPNet Core, NodeJS, PowerBI, MSSQL, K8s và C Sharp."
        )
        self.assertEqual(result, [
            "asp.net core", "c#", "kubernetes", "node.js", "power bi", "sql server",
        ])

    def test_punctuation_normalization_is_generic(self):
        self.assertEqual(normalize_match_key("C#"), "c sharp")
        self.assertEqual(normalize_match_key("C++"), "c plus plus")
        self.assertEqual(normalize_match_key("Node.js"), "node dot js")
        self.assertEqual(normalize_match_key("CI/CD"), "ci cd")

    def test_more_specific_occurrence_does_not_create_parent_skill(self):
        self.assertEqual(nlp_processor.extract_skills("Dùng C# và SQL Server."), ["c#", "sql server"])
        self.assertEqual(
            nlp_processor.extract_skills("Dùng SQL Server; đồng thời tối ưu câu lệnh SQL."),
            ["sql", "sql server"],
        )

    def test_mining_uses_supplied_aliases_without_hidden_mapping(self):
        without_aliases, _, _ = canonicalize_transactions_with_indices(
            [["NodeJS"]], taxonomy_skills=["node.js"]
        )
        with_aliases, _, metadata = canonicalize_transactions_with_indices(
            [["NodeJS", "MSSQL"]],
            taxonomy_skills=["node.js", "sql server"],
            taxonomy_aliases={"NodeJS": "node.js", "MSSQL": "sql server"},
        )

        self.assertEqual(without_aliases, [])
        self.assertEqual(with_aliases, [{"node.js", "sql server"}])
        self.assertEqual(metadata["aliases_used"], {
            "nodejs": "node.js",
            "mssql": "sql server",
        })

    def test_backend_taxonomy_sync_persists_aliases_for_runtime(self):
        response = Mock(status_code=200)
        response.json.return_value = [{
            "id": 1,
            "name": "Node.js",
            "isApproved": True,
            "aliases": [{"id": 10, "alias": "NodeJS"}, {"id": 11, "alias": "Node JS"}],
        }]

        with tempfile.TemporaryDirectory() as directory, patch.object(
            skills_sync_service.requests, "get", return_value=response
        ), patch.object(
            skills_sync_service, "runtime_file",
            side_effect=lambda filename: str(Path(directory) / filename),
        ), patch.object(
            skills_sync_service.nlp_processor, "reload_knowledge_base", return_value=1
        ):
            self.assertTrue(skills_sync_service.fetch_skills_from_db_on_startup())
            taxonomy = json.loads(
                (Path(directory) / "approved_skill_taxonomy.json").read_text(encoding="utf-8")
            )

        self.assertEqual(taxonomy, [{"name": "node.js", "aliases": ["Node JS", "NodeJS"]}])

    def test_next_background_sync_uses_two_am_vietnam_time(self):
        one_am_vietnam = datetime(2026, 8, 21, 18, 0, tzinfo=timezone.utc)
        three_am_vietnam = datetime(2026, 8, 21, 20, 0, tzinfo=timezone.utc)

        self.assertEqual(skills_sync_service.seconds_until_next_sync(one_am_vietnam), 3600)
        self.assertEqual(skills_sync_service.seconds_until_next_sync(three_am_vietnam), 23 * 3600)


if __name__ == "__main__":
    unittest.main()
