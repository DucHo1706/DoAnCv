import unittest
from unittest.mock import patch

from services import gemini_service


class _Response:
    def __init__(self, text):
        self.text = text


class _Models:
    def __init__(self, behavior, calls):
        self._behavior = behavior
        self._calls = calls

    def generate_content(self, model, contents, config):
        self._calls.append(model)
        value = self._behavior[model]
        if isinstance(value, Exception):
            raise value
        return _Response(value)


class _Client:
    def __init__(self, behavior, calls):
        self.models = _Models(behavior, calls)


class GeminiFailoverTests(unittest.TestCase):
    def setUp(self):
        gemini_service._unavailable_models.clear()
        gemini_service._key_cooldowns.clear()
        gemini_service._model_cooldowns.clear()
        gemini_service._model_key_cooldowns.clear()
        gemini_service._network_unavailable_until = 0.0

    def test_503_tries_next_project_key_on_same_model(self):
        calls = []
        overloaded = _Client({"busy": Exception("503 UNAVAILABLE high demand")}, calls)
        healthy = _Client({"busy": '{"status":"ok"}'}, calls)

        with patch.object(
            gemini_service,
            "_available_clients",
            return_value=[(0, overloaded), (1, healthy)],
        ):
            result = gemini_service.generate_content_with_retry(
                "test",
                models=["busy"],
            )

        self.assertEqual(result, '{"status":"ok"}')
        self.assertEqual(calls, ["busy", "busy"])
        self.assertNotIn("busy", gemini_service._model_cooldowns)
        self.assertIn(("busy", 0), gemini_service._model_key_cooldowns)

    def test_503_on_multiple_projects_then_moves_to_next_model(self):
        calls = []
        overloaded = _Client({"busy": Exception("503 UNAVAILABLE high demand")}, calls)
        healthy = _Client({"next": '{"status":"ok"}'}, calls)

        def available_clients(model_name):
            if model_name == "busy":
                return [(0, overloaded), (1, overloaded), (2, overloaded)]
            return [(0, healthy)]

        with patch.object(gemini_service, "_available_clients", side_effect=available_clients):
            result = gemini_service.generate_content_with_retry(
                "test",
                models=["busy", "next"],
            )

        self.assertEqual(result, '{"status":"ok"}')
        self.assertEqual(calls, ["busy", "busy", "next"])
        self.assertIn("busy", gemini_service._model_cooldowns)

    def test_never_sends_deadline_below_google_minimum(self):
        calls = []
        timeouts = []
        timed_out = _Client({"busy": Exception("504 DEADLINE_EXCEEDED")}, calls)
        healthy = _Client({"next": '{"status":"ok"}'}, calls)
        clients_by_key = {"key-1": timed_out, "key-2": timed_out, "key-3": healthy}

        def available_clients(model_name):
            if model_name == "busy":
                return [(0, timed_out), (1, timed_out)]
            return [(2, healthy)]

        def create_client(key, timeout_ms):
            timeouts.append(timeout_ms)
            return clients_by_key[key]

        with patch.object(gemini_service, "api_keys", ["key-1", "key-2", "key-3"]), \
             patch.object(gemini_service, "_available_clients", side_effect=available_clients), \
             patch.object(gemini_service, "_create_client", side_effect=create_client), \
             patch.object(gemini_service, "DEFAULT_REQUEST_TIMEOUT_MS", 30000), \
             patch.object(gemini_service, "TOTAL_REQUEST_BUDGET_MS", 32000), \
             patch.object(gemini_service, "TARGET_ATTEMPTS_PER_REQUEST", 3):
            result = gemini_service.generate_content_with_retry(
                "test",
                models=["busy", "next"],
            )

        self.assertEqual(result, '{"status":"ok"}')
        self.assertEqual(calls, ["busy", "busy", "next"])
        self.assertTrue(timeouts)
        self.assertTrue(all(timeout >= 10000 for timeout in timeouts))

    def test_504_or_timeout_also_tries_next_project_key(self):
        calls = []
        timed_out = _Client({"model": Exception("504 DEADLINE_EXCEEDED")}, calls)
        healthy = _Client({"model": '{"status":"ok"}'}, calls)

        with patch.object(
            gemini_service,
            "_available_clients",
            return_value=[(0, timed_out), (1, healthy)],
        ):
            result = gemini_service.generate_content_with_retry("test", models=["model"])

        self.assertEqual(result, '{"status":"ok"}')
        self.assertEqual(calls, ["model", "model"])

    def test_404_is_cached_for_the_process(self):
        calls = []
        client = _Client(
            {
                "removed": Exception("404 NOT_FOUND"),
                "current": '{"status":"ok"}',
            },
            calls,
        )
        with patch.object(gemini_service, "clients", [client]), \
             patch.object(gemini_service, "_available_clients", return_value=[(0, client)]):
            first = gemini_service.generate_content_with_retry(
                "test",
                models=["removed", "current"],
            )
            second = gemini_service.generate_content_with_retry(
                "test",
                models=["removed", "current"],
            )

        self.assertEqual(first, '{"status":"ok"}')
        self.assertEqual(second, '{"status":"ok"}')
        self.assertEqual(calls, ["removed", "current", "current"])


if __name__ == "__main__":
    unittest.main()
