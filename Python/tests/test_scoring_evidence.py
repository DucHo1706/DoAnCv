import unittest
from datetime import date
from unittest.mock import patch

from services.scoring_service import (
    build_default_scoring_result,
    normalize_language_review,
    generate_cv_language_review,
    normalize_scoring_result,
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

    def test_red_flag_evidence_is_not_treated_as_verified_truth(self):
        flags = [{
            "type": "OTHER",
            "title": "Thông tin cần làm rõ",
            "description": "Cần hỏi thêm trong phỏng vấn.",
            "evidence_text": "Tăng doanh thu 300%",
            "confidence": 0.95,
            "needs_verification": False,
        }]
        result = sanitize_red_flags(
            flags,
            "Thành tích: Tăng doanh thu 300% trong một quý.",
            {"quality_level": "high", "warnings": []},
            date(2026, 8, 20),
        )
        self.assertTrue(result[0]["needs_verification"])
        self.assertIn("tự khai", result[0]["evidence_notice"])

    def test_red_flag_retrieves_original_cv_text_across_punctuation_and_newlines(self):
        flags = [{
            "type": "MISSING_METRICS",
            "title": "Kết quả cần làm rõ",
            "description": "Cần bổ sung phạm vi đo lường.",
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
            "type": "GENERIC_CV",
            "title": "Phạm vi chưa rõ",
            "description": "Cần hỏi thêm về vai trò.",
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
                "type": "OTHER",
                "title": "Quy mô nhóm",
                "description": "Cần làm rõ.",
                "evidence_text": "Quản lý thành công đội ngũ 20 nhân sự",
                "confidence": 0.9,
            },
            {
                "type": "OTHER",
                "title": "Kết quả doanh thu",
                "description": "Cần làm rõ.",
                "evidence_text": "đã đạt mục tiêu doanh thu quý",
                "confidence": 0.9,
            },
        ]

        result = sanitize_red_flags(flags, cv_text, {"quality_level": "high"})

        self.assertEqual(result, [])

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
