import unittest
from unittest.mock import patch

from services.interview_service import get_fallback_mock_interview, get_fallback_star_tips
from services.scoring_service import build_local_language_review, classify_gemini_unavailable_reason


class LocalAnalysisFallbackTests(unittest.TestCase):
    def setUp(self):
        self.cv_text = """
        Nguyễn Minh Anh - Lập trình viên Backend
        Phát triển REST API bằng ASP.NET Core cho hệ thống quản lý nội bộ.
        Hỗ trợ nhóm frontend xử lý lỗi trong dự án.
        Tối ưu truy vấn SQL, giảm 25% thời gian tải dữ liệu.
        """

    def test_star_fallback_uses_real_cv_evidence(self):
        tips = get_fallback_star_tips(
            ["ASP.NET Core", "SQL Server"], ["Docker"], self.cv_text
        )

        self.assertTrue(tips)
        self.assertTrue(all(item["is_fallback"] for item in tips))
        quoted_lines = [item.get("example_before") for item in tips if item.get("example_before")]
        self.assertTrue(any(line in self.cv_text for line in quoted_lines))

    def test_study_plan_prioritizes_missing_jd_skill(self):
        topics = get_fallback_mock_interview(["ASP.NET Core"], ["Docker"])

        self.assertEqual("Docker", topics[0]["question"])
        self.assertTrue(topics[0]["is_fallback"])
        self.assertIn("docs.docker.com", topics[0]["best_answer"])

    def test_language_fallback_does_not_claim_fraud_detection(self):
        result = build_local_language_review(self.cv_text)

        self.assertTrue(result["is_fallback"])
        self.assertFalse(result["insufficient_data"])
        self.assertFalse(result["ai_generation_risk"]["detected"])
        self.assertIn("không thể xác minh", result["language_comment"].lower())

    def test_disabled_local_mode_is_not_reported_as_quota_exhausted(self):
        with patch("services.scoring_service.GEMINI_ENABLED", False):
            reason = classify_gemini_unavailable_reason(Exception("Không cấu hình API keys trực tiếp."))
        self.assertEqual(reason, "disabled_for_local_bulk")

    def test_timeout_is_not_reported_as_quota_exhausted(self):
        with patch("services.scoring_service.GEMINI_ENABLED", True):
            reason = classify_gemini_unavailable_reason(
                TimeoutError("504 DEADLINE_EXCEEDED")
            )
        self.assertEqual(reason, "overloaded_or_timeout")

    def test_explicit_rate_limit_has_own_reason(self):
        with patch("services.scoring_service.GEMINI_ENABLED", True):
            reason = classify_gemini_unavailable_reason(
                RuntimeError("429 RESOURCE_EXHAUSTED quota exceeded")
            )
        self.assertEqual(reason, "quota_or_rate_limit")


if __name__ == "__main__":
    unittest.main()
