import unittest
from unittest.mock import patch

from services.interview_service import get_fallback_mock_interview, get_fallback_star_tips
from services.scoring_service import (
    _is_complete_chat_response,
    build_local_language_review,
    chat_with_candidate,
    classify_gemini_unavailable_reason,
)


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

    @patch("services.scoring_service.generate_content_with_retry")
    def test_chatbot_prioritizes_fast_router_models_with_bounded_fallback(self, generate):
        generate.return_value = "Phản hồi"

        result = chat_with_candidate("Tư vấn CV giúp tôi")

        self.assertEqual(result, "Phản hồi")
        kwargs = generate.call_args.kwargs
        self.assertTrue(kwargs["router_first"])
        self.assertEqual(kwargs["router_budget_seconds"], 12)
        self.assertEqual(kwargs["total_budget_ms"], 12000)
        self.assertEqual(kwargs["request_timeout_ms"], 10000)
        self.assertEqual(kwargs["router_models"], ["Gemini", "deepseek"])

    @patch("services.scoring_service.generate_content_with_retry")
    def test_chatbot_provider_failure_is_not_returned_as_successful_reply(self, generate):
        generate.side_effect = TimeoutError("provider timeout")

        with self.assertRaises(RuntimeError):
            chat_with_candidate("Tư vấn CV giúp tôi")

    def test_chat_validator_accepts_short_but_complete_reply(self):
        self.assertTrue(_is_complete_chat_response("Chào bạn!"))

    def test_chat_validator_rejects_only_clear_truncation_signals(self):
        self.assertFalse(_is_complete_chat_response("Gợi ý **Kỹ sư Kiểm thử"))
        self.assertFalse(_is_complete_chat_response("Nội dung ```python"))
        self.assertFalse(_is_complete_chat_response("[RECOMMEND_JOB: 12 | Backend"))


if __name__ == "__main__":
    unittest.main()
