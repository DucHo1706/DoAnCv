import unittest
from datetime import date
from unittest.mock import patch

from services.scoring_service import (
    build_default_scoring_result,
    collect_reclassified_improvements,
    merge_analysis_improvements,
    normalize_language_review,
    generate_cv_language_review,
    normalize_scoring_result,
    partition_red_flags,
    reconcile_structured_criteria,
    sanitize_red_flags,
)


class ScoringEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.criteria = [{"name": "ASP.NET Core", "weight": 100}]

    def test_keeps_evidence_that_exists_in_cv(self):
        result = normalize_scoring_result({
            "criteria_results": [{
                "criterion_name": "ASP.NET Core",
                "score": 90,
                "comment": "Có kinh nghiệm thực tế.",
                "match_level": "FULL",
                "confidence": 0.9,
                "evidence_text": "Phát triển REST API bằng ASP.NET Core",
                "evidence_section": "EXPERIENCE",
                "needs_verification": False,
            }]
        }, self.criteria, "Từ năm 2024: Phát triển REST API bằng ASP.NET Core cho hệ thống nội bộ.")

        criterion = result["criteria_results"][0]
        self.assertEqual(criterion["evidence_text"], "Phát triển REST API bằng ASP.NET Core")
        self.assertEqual(criterion["match_level"], "FULL")

    def test_rejects_hallucinated_evidence(self):
        result = normalize_scoring_result({
            "criteria_results": [{
                "criterion_name": "ASP.NET Core",
                "score": 100,
                "match_level": "FULL",
                "confidence": 0.95,
                "evidence_text": "Có 5 năm kinh nghiệm ASP.NET Core",
                "evidence_section": "EXPERIENCE",
                "needs_verification": False,
            }]
        }, self.criteria, "Kỹ năng: C#, SQL Server.")

        criterion = result["criteria_results"][0]
        self.assertEqual(criterion["evidence_text"], "")
        self.assertEqual(criterion["match_level"], "PARTIAL")
        self.assertLessEqual(criterion["confidence"], 0.4)
        self.assertTrue(criterion["needs_verification"])
        self.assertLessEqual(criterion["score"], 70)
        self.assertLessEqual(result["total_score"], 70)

    def test_local_fallback_cannot_award_full_score(self):
        result = build_default_scoring_result(
            self.criteria,
            cv_skills=["Docker", "Linux"],
            jd_skills=["Docker", "Linux"],
        )

        self.assertEqual(result["criteria_results"][0]["match_level"], "PARTIAL")
        self.assertEqual(result["criteria_results"][0]["confidence"], 0.35)
        self.assertLessEqual(result["total_score"], 60)

    def test_structured_skill_rule_uses_configured_section_and_literal_evidence(self):
        criteria = [{
            "name": "Docker",
            "weight": 100,
            "criterionType": "SKILL",
            "priorityLevel": "REQUIRED",
            "operator": "EXISTS",
            "targetValue": "Docker",
            "evidenceSources": "SKILLS,EXPERIENCE",
        }]
        base = build_default_scoring_result(criteria, ["docker"], ["docker"])
        result = reconcile_structured_criteria(
            base,
            criteria,
            "KỸ NĂNG\nDocker, Linux",
            ["docker", "linux"],
            {"sections": [{"type": "skills", "content": "Docker, Linux"}]},
        )
        item = result["criteria_results"][0]
        self.assertEqual(item["match_level"], "FULL")
        self.assertEqual(item["score"], 100)
        self.assertEqual(item["evidence_text"], "Docker, Linux")

    def test_structured_skill_rule_accepts_taxonomy_alias_on_the_evidence_line(self):
        criteria = [{
            "name": "ASP.NET Core",
            "weight": 100,
            "criterionType": "SKILL",
            "priorityLevel": "REQUIRED",
            "operator": "EXISTS",
            "targetValue": "ASP.NET Core",
            "evidenceSources": "SKILLS,EXPERIENCE",
        }]
        base = build_default_scoring_result(criteria, ["ASP.NET Core"], ["ASP.NET Core"])
        with patch("nlp_processor.SKILL_ALIASES", {"dotnet core": "ASP.NET Core"}):
            result = reconcile_structured_criteria(
                base,
                criteria,
                "KỸ NĂNG\ndotnet core, Linux",
                ["ASP.NET Core", "Linux"],
                {"sections": [{"type": "skills", "content": "dotnet core, Linux"}]},
            )
        item = result["criteria_results"][0]
        self.assertEqual(item["match_level"], "FULL")
        self.assertEqual(item["score"], 100)
        self.assertEqual(item["evidence_text"], "dotnet core, Linux")

    def test_structured_skill_rule_tolerates_dot_replaced_by_space(self):
        criteria = [{
            "name": "ASP.NET Core",
            "weight": 100,
            "criterionType": "SKILL",
            "priorityLevel": "REQUIRED",
            "operator": "EXISTS",
            "targetValue": "ASP.NET Core",
            "evidenceSources": "EXPERIENCE",
        }]
        base = build_default_scoring_result(criteria, ["ASP.NET Core"], ["ASP.NET Core"])
        result = reconcile_structured_criteria(
            base,
            criteria,
            "KINH NGHIỆM\nPhát triển dịch vụ bằng asp net core.",
            ["ASP.NET Core"],
            {"sections": [{"type": "experience", "content": "Phát triển dịch vụ bằng asp net core."}]},
        )
        item = result["criteria_results"][0]
        self.assertEqual(item["match_level"], "FULL")
        self.assertEqual(item["score"], 100)
        self.assertEqual(item["evidence_text"], "Phát triển dịch vụ bằng asp net core.")

    def test_dotnet_symbol_is_not_reduced_to_generic_net_word(self):
        criteria = [{
            "name": ".NET",
            "weight": 100,
            "criterionType": "SKILL",
            "priorityLevel": "REQUIRED",
            "operator": "EXISTS",
            "targetValue": ".NET",
            "evidenceSources": "EXPERIENCE",
        }]
        base = build_default_scoring_result(criteria, [".NET"], [".NET"])
        result = reconcile_structured_criteria(
            base,
            criteria,
            "KINH NGHIỆM\nQuản trị net nội bộ và hỗ trợ người dùng.",
            [".NET"],
            {"sections": [{"type": "experience", "content": "Quản trị net nội bộ và hỗ trợ người dùng."}]},
        )
        item = result["criteria_results"][0]
        self.assertEqual(item["match_level"], "NOT_FOUND")
        self.assertEqual(item["score"], 0)

    def test_structured_rule_does_not_search_outside_evidence_source(self):
        criteria = [{
            "name": "TOEIC 650",
            "weight": 100,
            "criterionType": "LANGUAGE",
            "priorityLevel": "REQUIRED",
            "operator": "EXISTS",
            "targetValue": "TOEIC 650",
            "evidenceSources": "LANGUAGES",
        }]
        base = build_default_scoring_result(criteria, [], [])
        result = reconcile_structured_criteria(
            base,
            criteria,
            "MỤC TIÊU\nMong muốn đạt TOEIC 650\nNGÔN NGỮ\nTiếng Anh giao tiếp",
            [],
            {"sections": [
                {"type": "summary", "content": "Mong muốn đạt TOEIC 650"},
                {"type": "languages", "content": "Tiếng Anh giao tiếp"},
            ]},
        )
        item = result["criteria_results"][0]
        self.assertEqual(item["match_level"], "NOT_FOUND")
        self.assertEqual(item["score"], 0)

    def test_removes_unsupported_future_and_ocr_red_flag_for_current_year(self):
        flags = [{
            "type": "OTHER",
            "title": "Bất hợp lý mốc thời gian và lỗi định dạng",
            "description": "Thời gian làm việc chứa các mốc trong tương lai (năm 2026) không rõ ràng và văn bản bị lỗi font/OCR nghiêm trọng.",
        }]
        result = sanitize_red_flags(
            flags,
            "Kinh nghiệm\n01/2024 - 2026\nPhát triển hệ thống nội bộ.",
            {"quality_level": "high", "warnings": []},
            date(2026, 8, 20),
        )
        self.assertEqual(result, [])

    def test_ocr_problem_is_never_candidate_red_flag_even_when_extraction_is_partial(self):
        flags = [{
            "type": "OTHER",
            "title": "Lỗi font và OCR",
            "description": "Văn bản sai dấu do quá trình quét.",
            "evidence_text": "tiéunghé Xess ooo",
            "confidence": 0.9,
        }]
        result = sanitize_red_flags(
            flags,
            "Kinh nghiệm tiéunghé Xess ooo",
            {"quality_level": "partial", "method": "tesseract_psm_6", "warnings": []},
            date(2026, 8, 20),
        )
        self.assertEqual(result, [])

    def test_keeps_explicit_future_month_red_flag(self):
        flags = [{
            "type": "OTHER",
            "title": "Mốc tương lai",
            "description": "CV ghi một mốc trong tương lai.",
            "evidence_text": "01/2024 - 10/2026",
            "confidence": 0.9,
        }]
        result = sanitize_red_flags(
            flags,
            "Kinh nghiệm: 01/2024 - 10/2026",
            {"quality_level": "high", "warnings": []},
            date(2026, 8, 20),
        )
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["evidence_text"], "01/2024 - 10/2026")
        self.assertTrue(result[0]["needs_verification"])

    def test_detects_future_experience_period_without_ai_red_flag(self):
        result = sanitize_red_flags(
            [],
            "KINH NGHIỆM LÀM VIỆC\n01/2024 - 10/2026 | Backend Developer\nPhát triển API.",
            {"quality_level": "high", "analysis_safe": True},
            date(2026, 8, 24),
        )

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["rule_id"], "timeline_future_end")
        self.assertEqual(result[0]["evidence_text"], "01/2024 - 10/2026")
        self.assertTrue(result[0]["needs_verification"])

    def test_detects_reversed_experience_period_without_ai_red_flag(self):
        result = sanitize_red_flags(
            [],
            "KINH NGHIỆM\n08/2025 - 03/2025 | QA Engineer\nKiểm thử sản phẩm.",
            {"quality_level": "high", "analysis_safe": True},
            date(2026, 8, 24),
        )

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["rule_id"], "timeline_reversed")

    def test_does_not_create_deterministic_date_flag_from_unreliable_ocr(self):
        result = sanitize_red_flags(
            [],
            "KINH NGHIỆM\n01/2024 - 10/2026 | Backend Developer",
            {"quality_level": "low", "analysis_safe": False},
            date(2026, 8, 24),
        )

        self.assertEqual(result, [])

    def test_red_flag_evidence_is_not_treated_as_verified_truth(self):
        flags = [{
            "type": "INTERNAL_CONTRADICTION",
            "title": "Quy mô nhóm không nhất quán",
            "description": "CV nêu hai quy mô khác nhau trong cùng mô tả.",
            "evidence_text": "Phụ trách đồng thời nhóm 10 và 20 nhân sự",
            "confidence": 0.95,
            "needs_verification": False,
        }]
        result = sanitize_red_flags(
            flags,
            "Kinh nghiệm: Phụ trách đồng thời nhóm 10 và 20 nhân sự.",
            {"quality_level": "high", "warnings": []},
            date(2026, 8, 20),
        )
        self.assertTrue(result[0]["needs_verification"])
        self.assertIn("tự khai", result[0]["evidence_notice"])

    def test_red_flag_retrieves_original_cv_text_across_punctuation_and_newlines(self):
        flags = [{
            "type": "KEYWORD_STUFFING",
            "title": "Cụm kỹ năng lặp bất thường",
            "description": "Cần kiểm tra ngữ cảnh của cụm kỹ năng.",
            "evidence_text": "Phát triển REST API ASP.NET Core phục vụ 10.000 người dùng",
            "confidence": 0.86,
        }]
        cv_text = "Kinh nghiệm\nPhát triển REST API ASP.NET Core;\nphục vụ 10.000 người dùng."

        result = sanitize_red_flags(flags, cv_text, {"quality_level": "high"})

        self.assertEqual(len(result), 1)
        self.assertEqual(
            result[0]["evidence_text"],
            "Phát triển REST API ASP.NET Core;\nphục vụ 10.000 người dùng",
        )

    def test_red_flag_recovers_one_minor_character_error_but_returns_cv_source(self):
        flags = [{
            "type": "CREDENTIAL_INCONSISTENCY",
            "title": "Thông tin chứng nhận chưa nhất quán",
            "description": "Cần đối chiếu lại thông tin được nêu.",
            "evidence_text": "Triển khai hệ thống quản lý nội bộ cho phòng nhân sự",
            "confidence": 0.8,
        }]
        cv_text = "Kinh nghiệm: Triên khai hệ thống quản lý nội bộ cho phòng nhân sự."

        result = sanitize_red_flags(flags, cv_text, {"quality_level": "high"})

        self.assertEqual(len(result), 1)
        self.assertEqual(
            result[0]["evidence_text"],
            "Triên khai hệ thống quản lý nội bộ cho phòng nhân sự",
        )

    def test_red_flag_rejects_paraphrase_changed_number_and_changed_negation(self):
        cv_text = "Điều phối nhóm 10 nhân sự và chưa đạt mục tiêu doanh thu quý."
        flags = [
            {
                "type": "INTERNAL_CONTRADICTION",
                "title": "Quy mô nhóm",
                "description": "Cần làm rõ.",
                "evidence_text": "Quản lý thành công đội ngũ 20 nhân sự",
                "confidence": 0.9,
            },
            {
                "type": "INTERNAL_CONTRADICTION",
                "title": "Kết quả doanh thu",
                "description": "Cần làm rõ.",
                "evidence_text": "đã đạt mục tiêu doanh thu quý",
                "confidence": 0.9,
            },
        ]

        result = sanitize_red_flags(flags, cv_text, {"quality_level": "high"})

        self.assertEqual(result, [])

    def test_red_flag_without_grounded_quote_is_returned_as_unverified_suspicion(self):
        flags = [{
            "type": "INTERNAL_CONTRADICTION",
            "title": "Quy mô nhóm không nhất quán",
            "description": "AI đề xuất đối chiếu lại hai thông tin về quy mô nhóm.",
            "evidence_text": "Quản lý thành công đội ngũ 20 nhân sự",
            "confidence": 0.9,
        }]

        verified, suspicions = partition_red_flags(
            flags,
            "Kinh nghiệm: Điều phối nhóm 10 nhân sự trong dự án nội bộ.",
            {"quality_level": "high", "analysis_safe": True},
        )

        self.assertEqual(verified, [])
        self.assertEqual(len(suspicions), 1)
        self.assertEqual(suspicions[0]["evidence_text"], "")
        self.assertEqual(suspicions[0]["evidence_status"], "unverified")
        self.assertLessEqual(suspicions[0]["confidence"], 0.4)
        self.assertTrue(suspicions[0]["needs_verification"])

    def test_generic_and_missing_metric_improvements_are_not_red_flags(self):
        source_items = [
                {
                    "type": "GENERIC_CV",
                    "title": "Mô tả kinh nghiệm chung chung",
                    "description": "Nên mô tả vai trò rõ hơn.",
                    "evidence_text": "Tham gia phát triển hệ thống",
                },
                {
                    "type": "MISSING_METRICS",
                    "title": "Thiếu số liệu định lượng",
                    "description": "Nên bổ sung kết quả đo lường.",
                    "evidence_text": "Tối ưu hiệu năng hệ thống",
                },
            ]
        verified, suspicions = partition_red_flags(
            source_items,
            "Kinh nghiệm: Tham gia phát triển hệ thống. Tối ưu hiệu năng hệ thống.",
            {"quality_level": "high", "analysis_safe": True},
        )

        self.assertEqual(verified, [])
        self.assertEqual(suspicions, [])
        improvements = collect_reclassified_improvements(source_items)
        self.assertEqual(len(improvements), 2)
        self.assertIn("Mô tả kinh nghiệm chung chung", improvements[0])
        self.assertIn("Thiếu số liệu định lượng", improvements[1])

    def test_reclassified_improvements_are_merged_without_duplicates(self):
        result = merge_analysis_improvements(
            ["Thiếu số liệu định lượng"],
            ["Thiếu số liệu định lượng", "Thiếu kỹ năng Docker"],
        )

        self.assertEqual(result, ["Thiếu số liệu định lượng", "Thiếu kỹ năng Docker"])

    def test_ocr_issue_is_not_returned_as_candidate_suspicion(self):
        verified, suspicions = partition_red_flags(
            [{
                "type": "OTHER",
                "title": "Lỗi OCR nghiêm trọng",
                "description": "CV bị lỗi font và sai dấu.",
                "evidence_text": "",
            }],
            "KINH NGHIỆM\nPhát triển phần mềm.",
            {"quality_level": "high", "analysis_safe": True},
        )

        self.assertEqual(verified, [])
        self.assertEqual(suspicions, [])

    def test_language_review_never_claims_ai_authorship(self):
        result = normalize_language_review({
            "overall_language_score": 70,
            "weak_phrases": [{"original": "có nhiều kinh nghiệm", "suggestion": "Nêu phạm vi", "reason": "Mơ hồ"}],
            "uncertain_statements": [{
                "title": "Cần làm rõ",
                "description": "Thiếu phạm vi.",
                "evidence_text": "có nhiều kinh nghiệm",
            }],
            "ai_generation_risk": {"detected": True, "score": 99, "section": "Kinh nghiệm", "comment": "Do AI tạo"},
        }, "Tôi có nhiều kinh nghiệm phát triển phần mềm.")
        self.assertFalse(result["ai_generation_risk"]["detected"])
        self.assertEqual(result["ai_generation_risk"]["score"], 0)
        self.assertTrue(result["authorship_not_assessed"])

    def test_language_review_keeps_unverified_ai_observation_separate(self):
        result = normalize_language_review({
            "overall_language_score": 65,
            "weak_phrases": [{
                "original": "luôn đạt hiệu quả vượt trội",
                "suggestion": "Bổ sung số liệu và phạm vi đo lường.",
                "reason": "Nhận định chưa có số liệu cụ thể.",
            }],
            "uncertain_statements": [],
        }, "Kinh nghiệm: Phát triển API và tối ưu truy vấn SQL.")

        self.assertEqual(result["weak_phrases"], [])
        self.assertEqual(len(result["unverified_language_observations"]), 1)
        self.assertEqual(
            result["unverified_language_observations"][0]["evidence_status"],
            "unverified",
        )

    def test_language_review_keeps_declared_unverified_observation_without_quote(self):
        result = normalize_language_review({
            "overall_language_score": 68,
            "weak_phrases": [],
            "uncertain_statements": [],
            "unverified_language_observations": [{
                "type": "uncertain_statement",
                "title": "Phạm vi trách nhiệm cần làm rõ",
                "description": "AI đề xuất hỏi thêm về vai trò trực tiếp.",
                "suggestion": "Bổ sung phạm vi và kết quả đo lường.",
            }],
        }, "Kinh nghiệm: Phát triển API và phối hợp nhóm sản phẩm.")

        self.assertEqual(len(result["unverified_language_observations"]), 1)
        self.assertEqual(
            result["unverified_language_observations"][0]["title"],
            "Phạm vi trách nhiệm cần làm rõ",
        )

    @patch("services.scoring_service.generate_content_with_retry")
    def test_language_review_does_not_depend_on_skill_mining_scope(self, mocked_generate):
        mocked_generate.return_value = "{}"

        result = generate_cv_language_review(
            "Kinh nghiệm phát triển REST API bằng ASP.NET Core.",
            "Tuyển Backend Developer có kinh nghiệm ASP.NET Core.",
        )

        self.assertNotIn("skill_mining_context", result)
        mocked_generate.assert_called_once()


if __name__ == "__main__":
    unittest.main()
