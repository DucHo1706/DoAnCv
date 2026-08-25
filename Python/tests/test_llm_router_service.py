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
             patch.object(gemini_service.time, "monotonic", side_effect=[100, 100, 100, 116, 116]), \
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

    def test_router_uses_models_selected_for_current_feature(self):
        response = Mock()
        response.text = json.dumps({
            "choices": [{"message": {"content": "Phản hồi nhanh"}}]
        })
        response.json.return_value = json.loads(response.text)
        response.raise_for_status.return_value = None

        with patch.object(gemini_service, "LLM_ROUTER_ENABLED", True), \
             patch.object(gemini_service, "LLM_ROUTER_BASE_URL", "http://127.0.0.1:20128/v1"), \
             patch.object(gemini_service, "LLM_ROUTER_MODELS", ["slow/global-model"]), \
             patch.object(gemini_service.requests, "post", return_value=response) as post:
            result = gemini_service._generate_router_content(
                [{"role": "user", "content": "chat"}],
                is_json=False,
                models=["Gemini", "deepseek"],
            )

        self.assertEqual(result, "Phản hồi nhanh")
        self.assertEqual(post.call_args.kwargs["json"]["model"], "Gemini")

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

    def test_generate_forwards_feature_specific_router_models(self):
        with patch.object(gemini_service, "LLM_ROUTER_ENABLED", True), \
             patch.object(
                 gemini_service,
                 "_generate_router_content",
                 return_value="Phản hồi chatbot",
             ) as generate_router:
            result = gemini_service.generate_content_with_retry(
                "chat",
                is_json=False,
                router_first=True,
                router_budget_seconds=12,
                router_models=["Gemini", "deepseek"],
            )

        self.assertEqual(result, "Phản hồi chatbot")
        self.assertEqual(
            generate_router.call_args.kwargs["models"],
            ["Gemini", "deepseek"],
        )

    def test_direct_first_returns_gemini_response_without_calling_router(self):
        direct_client = Mock()
        direct_client.models.generate_content.return_value = Mock(
            text='{"provider":"gemini"}'
        )

        with patch.object(gemini_service, "LLM_ROUTER_ENABLED", True), \
             patch.object(gemini_service, "clients", [direct_client]), \
             patch.object(gemini_service, "_available_clients", return_value=[(0, direct_client)]), \
             patch.object(gemini_service, "_create_client", return_value=direct_client), \
             patch.object(gemini_service, "_generate_router_content") as generate_router:
            result = gemini_service.generate_content_with_retry(
                "chat",
                models=["direct-test-model"],
                router_first=False,
                total_budget_ms=20000,
            )

        self.assertEqual(json.loads(result), {"provider": "gemini"})
        generate_router.assert_not_called()

    def test_direct_first_falls_back_to_router_after_transient_failure(self):
        direct_client = Mock()
        direct_client.models.generate_content.side_effect = RuntimeError(
            "503 UNAVAILABLE"
        )

        with patch.object(gemini_service, "LLM_ROUTER_ENABLED", True), \
             patch.object(gemini_service, "clients", [direct_client]), \
             patch.object(gemini_service, "_available_clients", return_value=[(0, direct_client)]), \
             patch.object(gemini_service, "_create_client", return_value=direct_client), \
             patch.object(
                 gemini_service,
                 "_generate_router_content",
                 return_value='{"provider":"router"}',
             ) as generate_router:
            result = gemini_service.generate_content_with_retry(
                "chat",
                models=["direct-fallback-test-model"],
                router_first=False,
                total_budget_ms=20000,
                router_budget_seconds=8,
            )

        self.assertEqual(json.loads(result), {"provider": "router"})
        generate_router.assert_called_once()
        self.assertEqual(
            generate_router.call_args.kwargs["total_budget_seconds"],
            8,
        )

    def test_vision_router_data_uri_echo_is_discarded(self):
        with patch.object(gemini_service, "LLM_ROUTER_ENABLED", True), \
             patch.object(gemini_service, "clients", []), \
             patch.object(
                 gemini_service,
                 "_generate_router_content",
                 return_value="data:image/jpeg;base64,/9j/echoed-payload",
             ):
            result = gemini_service.generate_vision_content_with_retry(
                image_bytes=b"jpeg-bytes",
                mime_type="image/jpeg",
                prompt="OCR",
            )

        self.assertEqual(result, "")
        self.assertTrue(gemini_service._router_is_cooling_down())


if __name__ == "__main__":
    unittest.main()
