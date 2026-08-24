import json
import unittest
from unittest.mock import Mock, patch

from services import gemini_service


class LlmRouterServiceTests(unittest.TestCase):
    def setUp(self):
        gemini_service._mark_router_available()

    def tearDown(self):
        gemini_service._mark_router_available()

    def test_router_returns_valid_json_without_exposing_credentials(self):
        response = Mock()
        response.text = json.dumps({
            "choices": [{"message": {"content": '{"status":"ok"}'}}]
        })
        response.json.return_value = json.loads(response.text)
        response.raise_for_status.return_value = None

        with patch.object(gemini_service, "LLM_ROUTER_ENABLED", True), \
             patch.object(gemini_service, "LLM_ROUTER_BASE_URL", "http://127.0.0.1:20128/v1"), \
             patch.object(gemini_service, "LLM_ROUTER_MODELS", ["test/model"]), \
             patch.object(gemini_service.requests, "post", return_value=response) as post:
            result = gemini_service._generate_router_content(
                [{"role": "user", "content": "JSON"}],
                is_json=True,
            )

        self.assertEqual(json.loads(result), {"status": "ok"})
        payload = post.call_args.kwargs["json"]
        self.assertFalse(payload["stream"])
        self.assertEqual(payload["model"], "test/model")

    def test_router_parses_streaming_compatibility_response(self):
        response = Mock()
        response.text = (
            'data: {"choices":[{"delta":{"content":"O"}}]}\n\n'
            'data: {"choices":[{"delta":{"content":"K"}}]}\n\n'
            'data: [DONE]\n'
        )
        self.assertEqual(gemini_service._router_response_text(response), "OK")

    def test_router_stops_when_total_budget_is_exhausted(self):
        with patch.object(gemini_service, "LLM_ROUTER_ENABLED", True), \
             patch.object(gemini_service, "LLM_ROUTER_BASE_URL", "http://127.0.0.1:20128/v1"), \
             patch.object(gemini_service, "LLM_ROUTER_MODELS", ["first", "second"]), \
             patch.object(gemini_service, "LLM_ROUTER_TOTAL_BUDGET_SECONDS", 15), \
             patch.object(gemini_service.time, "monotonic", side_effect=[100, 100, 116]), \
             patch.object(
                 gemini_service.requests,
                 "post",
                 side_effect=TimeoutError("provider timeout"),
             ) as post:
            with self.assertRaises(ConnectionError):
                gemini_service._generate_router_content(
                    [{"role": "user", "content": "JSON"}],
                    is_json=True,
                )

        self.assertEqual(post.call_count, 1)
        self.assertEqual(post.call_args.kwargs["timeout"], 15)

    def test_failed_router_enters_cooldown_and_skips_next_request(self):
        with patch.object(gemini_service, "LLM_ROUTER_ENABLED", True), \
             patch.object(gemini_service, "clients", []), \
             patch.object(
                 gemini_service,
                 "_generate_router_content",
                 side_effect=ConnectionError("router unavailable"),
             ) as generate:
            with self.assertRaises(ConnectionError):
                gemini_service.generate_content_with_retry("first")
            with self.assertRaises(ConnectionError):
                gemini_service.generate_content_with_retry("second")

        self.assertEqual(generate.call_count, 1)
        self.assertTrue(gemini_service._router_is_cooling_down())


if __name__ == "__main__":
    unittest.main()
