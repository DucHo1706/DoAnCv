from google import genai
from google.genai import types
import os
import time
import requests
import json
import threading
import base64
from collections.abc import Callable
from dotenv import load_dotenv
from utils.logger import logger

# Tai cau hinh tu env
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path=env_path, override=True)

GEMINI_ENABLED = os.getenv("GEMINI_ENABLED", "true").strip().casefold() not in {
    "0", "false", "no", "off"
}
LLM_ROUTER_BASE_URL = os.getenv("LLM_ROUTER_BASE_URL", "").strip().rstrip("/")
LLM_ROUTER_API_KEY = os.getenv("LLM_ROUTER_API_KEY", "").strip()
LLM_ROUTER_MODELS = [
    value.strip()
    for value in os.getenv(
        "LLM_ROUTER_MODELS",
        "Gemini,deepseek,ag/gemini-3.5-flash-low",
    ).split(",")
    if value.strip()
]
LLM_ROUTER_CHAT_MODELS = [
    value.strip()
    for value in os.getenv(
        "LLM_ROUTER_CHAT_MODELS",
        "Gemini,deepseek",
    ).split(",")
    if value.strip()
]
LLM_ROUTER_TIMEOUT_SECONDS = max(
    10, int(os.getenv("LLM_ROUTER_TIMEOUT_SECONDS", "25"))
)
LLM_ROUTER_TOTAL_BUDGET_SECONDS = max(
    10, int(os.getenv("LLM_ROUTER_TOTAL_BUDGET_SECONDS", "25"))
)
LLM_ROUTER_COOLDOWN_SECONDS = max(
    30, int(os.getenv("LLM_ROUTER_COOLDOWN_SECONDS", "120"))
)
LLM_ROUTER_MAX_TOKENS = max(512, int(os.getenv("LLM_ROUTER_MAX_TOKENS", "12000")))
LLM_ROUTER_ENABLED = bool(LLM_ROUTER_BASE_URL and LLM_ROUTER_MODELS)
_router_unavailable_until = 0.0
_router_state_lock = threading.Lock()


class GeneratedContentValidationError(ValueError):
    """Provider trả nội dung có HTTP 200 nhưng chưa đạt điều kiện của chức năng."""


MIN_REQUEST_TIMEOUT_MS = max(10000, int(os.getenv("GEMINI_MIN_REQUEST_TIMEOUT_MS", "10000")))
DEFAULT_REQUEST_TIMEOUT_MS = max(
    MIN_REQUEST_TIMEOUT_MS,
    int(os.getenv("GEMINI_REQUEST_TIMEOUT_MS", "15000")),
)


def _create_client(api_key: str, timeout_ms: int = DEFAULT_REQUEST_TIMEOUT_MS):
    """Tắt retry nội bộ để lớp xoay model/key kiểm soát thời gian chờ thống nhất."""
    if hasattr(types, "HttpOptions") and hasattr(types, "HttpRetryOptions"):
        return genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(
                timeout=timeout_ms,
                retry_options=types.HttpRetryOptions(attempts=1),
            ),
        )
    return genai.Client(api_key=api_key)

api_keys = []
primary_key = os.getenv("GEMINI_API_KEY")
if primary_key:
    if "," in primary_key:
        api_keys.extend([k.strip() for k in primary_key.split(",") if k.strip()])
    else:
        api_keys.append(primary_key.strip())

extra_keys = os.getenv("GEMINI_API_KEYS")
if extra_keys:
    api_keys.extend([k.strip() for k in extra_keys.split(",") if k.strip()])

api_keys = list(dict.fromkeys(api_keys))

if not GEMINI_ENABLED:
    # Chế độ này chỉ tắt gọi dịch vụ ngoài trong tiến trình hiện tại. API key
    # vẫn giữ nguyên trong cấu hình và các kết quả phía sau phải mang nhãn fallback.
    api_keys = []

if not GEMINI_ENABLED:
    if LLM_ROUTER_ENABLED:
        logger.info(
            "[LLM Provider] Ưu tiên 9Router local; Gemini trực tiếp đã tắt nên "
            "không tiêu thụ quota Gemini khi router hoạt động."
        )
    else:
        logger.warning(
            "[Gemini Service] GEMINI_ENABLED=false; tiến trình dùng fallback cục bộ, "
            "không tiêu thụ quota Gemini."
        )
    clients = []
    client = None
elif not api_keys:
    logger.warning("[Gemini Service] Warning: No valid GEMINI_API_KEY found in environment. Python server will start with fallback AI modes.")
    clients = []
    client = None
else:
    clients = [_create_client(key) for key in api_keys]
    client = clients[0] if clients else None

DEFAULT_MODELS = [
    value.strip()
    for value in os.getenv(
        "GEMINI_MODELS",
        "gemini-3.6-flash,gemini-3.7-flash,gemini-3.5-flash,gemini-3.5-flash-lite,gemini-3.1-flash-lite",
    ).split(",")
    if value.strip()
]
VISION_MODELS = [
    value.strip()
    for value in os.getenv(
        "GEMINI_VISION_MODELS",
        "gemini-3.6-flash,gemini-3.7-flash,gemini-3.5-flash,gemini-3.5-flash-lite,gemini-3.1-flash-lite",
    ).split(",")
    if value.strip()
]
KEY_COOLDOWN_SECONDS = max(10, int(os.getenv("GEMINI_KEY_COOLDOWN_SECONDS", "60")))
NETWORK_COOLDOWN_SECONDS = max(10, int(os.getenv("GEMINI_NETWORK_COOLDOWN_SECONDS", "60")))
MODEL_COOLDOWN_SECONDS = max(30, int(os.getenv("GEMINI_MODEL_COOLDOWN_SECONDS", "300")))
MODEL_KEY_COOLDOWN_SECONDS = max(10, int(os.getenv("GEMINI_MODEL_KEY_COOLDOWN_SECONDS", "30")))
MAX_KEYS_PER_MODEL = max(1, int(os.getenv("GEMINI_MAX_KEYS_PER_MODEL", "3")))
TOTAL_REQUEST_BUDGET_MS = max(10000, int(os.getenv("GEMINI_TOTAL_REQUEST_BUDGET_MS", "60000")))
TARGET_ATTEMPTS_PER_REQUEST = max(1, int(os.getenv("GEMINI_TARGET_ATTEMPTS_PER_REQUEST", "4")))
TRANSIENT_KEYS_BEFORE_MODEL_FAILOVER = max(
    1,
    int(os.getenv("GEMINI_TRANSIENT_KEYS_BEFORE_MODEL_FAILOVER", "2")),
)
_key_cooldowns = {}
_model_cooldowns = {}
_model_key_cooldowns = {}
_unavailable_models = set()
_network_unavailable_until = 0.0
_state_lock = threading.Lock()


def _available_clients(model_name: str | None = None):
    now = time.monotonic()
    with _state_lock:
        available = [
            item
            for item in enumerate(clients)
            if _key_cooldowns.get(item[0], 0) <= now
            and (
                model_name is None
                or _model_key_cooldowns.get((model_name, item[0]), 0) <= now
            )
        ]
        # Giữ thứ tự key trong .env làm thứ tự ưu tiên. Không thể suy ra paid/free
        # chỉ từ chuỗi API key, nên project paid cần được cấu hình trước project free.
        available.sort(key=lambda item: item[0])
    # If every key is cooling down, fail quickly instead of multiplying slow
    # upstream calls for each concurrent CV analysis request.
    return available


def _cool_down_key(client_idx: int):
    with _state_lock:
        _key_cooldowns[client_idx] = time.monotonic() + KEY_COOLDOWN_SECONDS


def _cool_down_model_key(model_name: str, client_idx: int):
    with _state_lock:
        _model_key_cooldowns[(model_name, client_idx)] = (
            time.monotonic() + MODEL_KEY_COOLDOWN_SECONDS
        )


def _network_is_cooling_down() -> bool:
    with _state_lock:
        return _network_unavailable_until > time.monotonic()


def _cool_down_network():
    global _network_unavailable_until
    with _state_lock:
        _network_unavailable_until = time.monotonic() + NETWORK_COOLDOWN_SECONDS


def _is_network_error(error: Exception) -> bool:
    """Do not multiply retries by every key/model when the network itself is down."""
    message = str(error).lower()
    markers = (
        "winerror 10013", "connection refused", "connection aborted",
        "connection reset", "failed to establish a new connection",
        "max retries exceeded", "name resolution",
        "temporary failure in name resolution", "nodename nor servname",
        "network is unreachable",
    )
    return isinstance(error, requests.exceptions.ConnectionError) or any(
        marker in message for marker in markers
    )


def _is_transient_model_error(error_text: str) -> bool:
    markers = (
        "503", "504", "unavailable", "high demand", "deadline_exceeded",
        "deadline expired", "read operation timed out", "read timeout", "timed out",
    )
    return any(marker in error_text for marker in markers)

def clean_json_text(text: str) -> str:
    """
    Loai bo cac ky tu boc Markdown hoac text linh tinh de chuyen ve JSON hop le.
    Trich xuat khoi JSON bang cach tim dau { hoac [ dau tien va } hoac ] cuoi cung.
    """
    if not text:
        return ""
    text = text.strip()
    
    # Neu bat dau/ket thuc bang markdown code block, boc no ra truoc
    if text.startswith("```"):
        first_newline = text.find("\n")
        if first_newline != -1:
            text = text[first_newline:].strip()
        else:
            text = text[3:].strip()
    if text.endswith("```"):
        text = text[:-3].strip()
        
    text = text.strip()
    
    # Tim vi tri bat dau cua JSON ({ hoac [)
    first_brace = text.find("{")
    first_bracket = text.find("[")
    
    start_idx = -1
    end_char = ""
    
    if first_brace != -1 and first_bracket != -1:
        if first_brace < first_bracket:
            start_idx = first_brace
            end_char = "}"
        else:
            start_idx = first_bracket
            end_char = "]"
    elif first_brace != -1:
        start_idx = first_brace
        end_char = "}"
    elif first_bracket != -1:
        start_idx = first_bracket
        end_char = "]"
        
    if start_idx != -1:
        end_idx = text.rfind(end_char)
        if end_idx != -1 and end_idx > start_idx:
            text = text[start_idx:end_idx + 1]
            
    return text


def _router_headers() -> dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if LLM_ROUTER_API_KEY:
        headers["Authorization"] = f"Bearer {LLM_ROUTER_API_KEY}"
    return headers


def _router_is_cooling_down() -> bool:
    with _router_state_lock:
        return _router_unavailable_until > time.monotonic()


def _cool_down_router() -> None:
    global _router_unavailable_until
    with _router_state_lock:
        _router_unavailable_until = time.monotonic() + LLM_ROUTER_COOLDOWN_SECONDS


def _mark_router_available() -> None:
    global _router_unavailable_until
    with _router_state_lock:
        _router_unavailable_until = 0.0


def _router_response_text(response: requests.Response) -> str:
    """Đọc cả JSON chuẩn lẫn SSE mà một số combo 9Router có thể trả về."""
    raw = response.text.strip()
    if not raw:
        raise ValueError("9Router trả về nội dung trống.")
    if raw.startswith("data:"):
        fragments: list[str] = []
        for line in raw.splitlines():
            if not line.startswith("data:"):
                continue
            payload_text = line[5:].strip()
            if not payload_text or payload_text == "[DONE]":
                continue
            payload = json.loads(payload_text)
            for choice in payload.get("choices", []) or []:
                delta = choice.get("delta", {}) or {}
                if delta.get("content"):
                    fragments.append(str(delta["content"]))
        content = "".join(fragments).strip()
        if content:
            return content
        raise ValueError("9Router kết thúc stream nhưng không trả nội dung.")
    payload = response.json()
    choices = payload.get("choices", []) if isinstance(payload, dict) else []
    if not choices:
        raise ValueError("9Router không trả choices hợp lệ.")
    message = choices[0].get("message", {}) or {}
    content = str(message.get("content") or "").strip()
    if not content:
        raise ValueError("9Router trả về message rỗng.")
    return content


def _router_finish_reason(response: requests.Response) -> str:
    """Lấy lý do kết thúc mà không ghi nội dung/prompt nhạy cảm vào log."""
    raw = response.text.strip()
    try:
        if raw.startswith("data:"):
            finish_reason = ""
            for line in raw.splitlines():
                if not line.startswith("data:"):
                    continue
                payload_text = line[5:].strip()
                if not payload_text or payload_text == "[DONE]":
                    continue
                payload = json.loads(payload_text)
                for choice in payload.get("choices", []) or []:
                    if choice.get("finish_reason"):
                        finish_reason = str(choice["finish_reason"])
            return finish_reason
        payload = response.json()
        choices = payload.get("choices", []) if isinstance(payload, dict) else []
        return str(choices[0].get("finish_reason") or "") if choices else ""
    except (TypeError, ValueError, KeyError, IndexError, AttributeError):
        return ""


def _gemini_finish_reason(response) -> str:
    """Đọc finish reason của Google SDK nếu response có candidate metadata."""
    candidates = getattr(response, "candidates", None)
    if not isinstance(candidates, (list, tuple)) or not candidates:
        return ""
    reason = getattr(candidates[0], "finish_reason", None)
    if reason is None:
        return ""
    reason_name = getattr(reason, "name", None)
    return str(reason_name or reason)


def _is_token_limit_finish_reason(finish_reason: str) -> bool:
    normalized = str(finish_reason or "").strip().casefold()
    return normalized in {"length", "max_tokens"} or "max_tokens" in normalized


def _generate_router_content(
    messages: list[dict],
    is_json: bool,
    total_budget_seconds: int | None = None,
    max_tokens: int | None = None,
    models: list[str] | None = None,
    content_validator: Callable[[str], bool] | None = None,
) -> str:
    if not LLM_ROUTER_ENABLED:
        raise ConnectionError("9Router chưa được bật cho tiến trình này.")
    last_error: Exception | None = None
    endpoint = f"{LLM_ROUTER_BASE_URL}/chat/completions"
    router_budget = total_budget_seconds or LLM_ROUTER_TOTAL_BUDGET_SECONDS
    request_deadline = time.monotonic() + max(1, router_budget)
    models_to_try = models if models is not None else LLM_ROUTER_MODELS
    if not models_to_try:
        raise ValueError("9Router không có model phù hợp cho chức năng này.")
    for model_name in models_to_try:
        remaining_seconds = request_deadline - time.monotonic()
        if remaining_seconds <= 0:
            break
        attempt_started = time.monotonic()
        try:
            response = requests.post(
                endpoint,
                headers=_router_headers(),
                json={
                    "model": model_name,
                    "messages": messages,
                    "temperature": 0,
                    "max_tokens": max_tokens or LLM_ROUTER_MAX_TOKENS,
                    "stream": False,
                },
                timeout=min(LLM_ROUTER_TIMEOUT_SECONDS, max(1, remaining_seconds)),
            )
            response.raise_for_status()
            content = _router_response_text(response)
            finish_reason = _router_finish_reason(response).strip().casefold()
            if _is_token_limit_finish_reason(finish_reason):
                raise GeneratedContentValidationError(
                    "9Router dừng vì hết giới hạn token trước khi hoàn tất phản hồi."
                )
            if is_json:
                content = clean_json_text(content)
                json.loads(content)
            if content_validator is not None and not content_validator(content):
                raise GeneratedContentValidationError(
                    "9Router trả nội dung chưa hoàn chỉnh cho chức năng hiện tại."
                )
            elapsed_ms = int((time.monotonic() - attempt_started) * 1000)
            logger.info(
                f"9Router phản hồi thành công với model {model_name} sau {elapsed_ms} ms "
                f"(finish_reason={finish_reason or 'unknown'}, chars={len(content)})."
            )
            return content
        except Exception as error:
            last_error = error
            elapsed_ms = int((time.monotonic() - attempt_started) * 1000)
            logger.warning(
                f"9Router model {model_name} chưa tạo được phản hồi hợp lệ "
                f"sau {elapsed_ms} ms: {error}"
            )
    if last_error is None:
        raise TimeoutError("9Router đã hết ngân sách chờ trước khi thử model tiếp theo.")
    raise ConnectionError("9Router không tạo được phản hồi từ các model đã cấu hình.") from last_error


def generate_content_with_retry(
    prompt: str,
    is_json: bool = True,
    models: list = None,
    request_timeout_ms: int = None,
    total_budget_ms: int = None,
    router_first: bool = True,
    router_budget_seconds: int = None,
    router_models: list[str] | None = None,
    max_output_tokens: int = None,
    content_validator: Callable[[str], bool] | None = None,
) -> str:
    """
    Goi Gemini API voi co che tu dong thu lai tren danh sach API Keys
    """
    router_error: Exception | None = None
    if router_first and LLM_ROUTER_ENABLED and not _router_is_cooling_down():
        try:
            content = _generate_router_content(
                [{"role": "user", "content": prompt}],
                is_json=is_json,
                total_budget_seconds=router_budget_seconds,
                max_tokens=max_output_tokens,
                models=router_models,
                content_validator=content_validator,
            )
            _mark_router_available()
            return content
        except Exception as error:
            router_error = error
            _cool_down_router()
            logger.warning("9Router tạm thời không khả dụng; chuyển sang provider kế tiếp.")
    elif router_first and LLM_ROUTER_ENABLED:
        router_error = ConnectionError("9Router đang tạm nghỉ sau lần gọi lỗi gần nhất.")
    if not clients:
        if not router_first and LLM_ROUTER_ENABLED and not _router_is_cooling_down():
            return _generate_router_content(
                [{"role": "user", "content": prompt}],
                is_json=is_json,
                total_budget_seconds=router_budget_seconds,
                max_tokens=max_output_tokens,
                models=router_models,
                content_validator=content_validator,
            )
        if router_error is not None:
            raise ConnectionError(
                "9Router không khả dụng và Gemini đang tắt hoặc chưa cấu hình."
            ) from router_error
        raise Exception("Khong cau hinh API keys truc tiep.")
    if _network_is_cooling_down():
        if not router_first and LLM_ROUTER_ENABLED and not _router_is_cooling_down():
            return _generate_router_content(
                [{"role": "user", "content": prompt}],
                is_json=is_json,
                total_budget_seconds=router_budget_seconds,
                max_tokens=max_output_tokens,
                models=router_models,
                content_validator=content_validator,
            )
        raise ConnectionError("Ket noi Gemini dang tam nghi; su dung ket qua du phong cuc bo.")

    models_to_try = models if models is not None else DEFAULT_MODELS
    config_kwargs = {
        "response_mime_type": "application/json" if is_json else "text/plain"
    }
    if max_output_tokens:
        config_kwargs["max_output_tokens"] = max_output_tokens
    config = types.GenerateContentConfig(**config_kwargs)

    last_error = None
    attempts_started = 0
    budget_exhausted = False
    effective_budget_ms = max(
        MIN_REQUEST_TIMEOUT_MS,
        total_budget_ms or TOTAL_REQUEST_BUDGET_MS,
    )
    request_deadline = time.monotonic() + (effective_budget_ms / 1000)
    for model_name in models_to_try:
        remaining_before_model_ms = int((request_deadline - time.monotonic()) * 1000)
        if remaining_before_model_ms < MIN_REQUEST_TIMEOUT_MS:
            budget_exhausted = True
            logger.warning(
                f"Da het ngan sach Gemini truoc khi thu model {model_name}; "
                "model/key con lai chua duoc goi, khong phai da xac dinh la hong hoac het quota."
            )
            break
        with _state_lock:
            if (
                model_name in _unavailable_models
                or _model_cooldowns.get(model_name, 0) > time.monotonic()
            ):
                continue
        # Thử nhiều project/key cho cùng model vì 503/504 có thể chỉ ảnh hưởng
        # một project/tier. Giới hạn số key để request không kéo dài vô hạn.
        clients_for_model = _available_clients(model_name)[:MAX_KEYS_PER_MODEL]
        if not clients_for_model:
            logger.warning(
                f"Bo qua model {model_name} trong request nay vi cac key dang cooldown; "
                "chua ket luan key khong kha dung."
            )
            continue
        
        is_model_not_found = False
        transient_failures = 0
        attempted_clients = 0
        for client_idx, active_client in clients_for_model:
            remaining_ms = int((request_deadline - time.monotonic()) * 1000)
            if remaining_ms < MIN_REQUEST_TIMEOUT_MS:
                budget_exhausted = True
                logger.warning(
                    f"Khong thu them Key #{client_idx+1} cua model {model_name} vi chi con "
                    f"{max(0, remaining_ms)}ms, thap hon deadline toi thieu {MIN_REQUEST_TIMEOUT_MS}ms."
                )
                break
            attempted_clients += 1
            attempts_started += 1
            request_client = active_client
            try:
                requested_timeout_ms = max(
                    MIN_REQUEST_TIMEOUT_MS,
                    request_timeout_ms or DEFAULT_REQUEST_TIMEOUT_MS,
                )
                target_slots_left = max(1, TARGET_ATTEMPTS_PER_REQUEST - attempts_started + 1)
                fair_share_ms = max(MIN_REQUEST_TIMEOUT_MS, remaining_ms // target_slots_left)
                attempt_timeout_ms = min(
                    requested_timeout_ms,
                    fair_share_ms,
                    remaining_ms,
                )
                if (
                    hasattr(types, "HttpOptions")
                    and attempt_timeout_ms != DEFAULT_REQUEST_TIMEOUT_MS
                ):
                    request_client = _create_client(api_keys[client_idx], attempt_timeout_ms)

                response = request_client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=config
                )
                if response and response.text:
                    text = response.text.strip()
                    finish_reason = _gemini_finish_reason(response)
                    if _is_token_limit_finish_reason(finish_reason):
                        raise GeneratedContentValidationError(
                            "Gemini dừng vì hết giới hạn token trước khi hoàn tất phản hồi."
                        )
                    if is_json:
                        text = clean_json_text(text)
                        # Validate JSON structure
                        json.loads(text)
                    if content_validator is not None and not content_validator(text):
                        raise GeneratedContentValidationError(
                            "Gemini trả nội dung chưa hoàn chỉnh cho chức năng hiện tại."
                        )
                    return text
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                if _is_network_error(e):
                    _cool_down_network()
                    if not router_first:
                        budget_exhausted = True
                        break
                    raise ConnectionError(
                        "Khong the ket noi Gemini; chuyen ngay sang ket qua du phong cuc bo."
                    ) from e
                logger.warning(f"Loi goi model {model_name} voi Key #{client_idx+1}: {e}")
                if isinstance(e, GeneratedContentValidationError):
                    logger.warning(
                        f"Model {model_name} trả nội dung chưa hoàn chỉnh; chuyển model kế tiếp."
                    )
                    break
                if "404" in err_str or "not_found" in err_str or "not found" in err_str:
                    logger.warning(f"Model {model_name} khong ton tai (404 NOT_FOUND). Bo qua model nay.")
                    is_model_not_found = True
                    with _state_lock:
                        _unavailable_models.add(model_name)
                    break
                if _is_transient_model_error(err_str):
                    logger.warning(
                        f"Model {model_name} tam thoi qua tai/timeout tren Key #{client_idx+1}. "
                        "Dang thu key project tiep theo."
                    )
                    transient_failures += 1
                    _cool_down_model_key(model_name, client_idx)
                    if transient_failures >= TRANSIENT_KEYS_BEFORE_MODEL_FAILOVER:
                        logger.warning(
                            f"Model {model_name} da timeout/qua tai tren {transient_failures} key/project; "
                            "chuyen model de danh ngan sach cho failover."
                        )
                        break
                    continue
                if "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str:
                    logger.warning(f"Model {model_name} Key #{client_idx+1} dat Quota/Rate Limit (429). Dang thu sang Key/Model khac...")
                    _cool_down_key(client_idx)
                    continue
                if "400" in err_str or "invalid_argument" in err_str:
                    raise ValueError(
                        f"Gemini tu choi request cho model {model_name} do tham so/prompt khong hop le."
                    ) from e
            finally:
                if request_client is not active_client:
                    request_client.close()

        if is_model_not_found:
            continue

        if transient_failures >= max(1, min(2, attempted_clients)):
            with _state_lock:
                _model_cooldowns[model_name] = time.monotonic() + MODEL_COOLDOWN_SECONDS
            logger.warning(
                f"Model {model_name} loi tam thoi tren {transient_failures} key/project. "
                "Tam khoa model va chuyen model tiep theo."
            )
            continue
                
        if budget_exhausted:
            break
        logger.warning(
            f"Model {model_name} chua tao duoc phan hoi sau {attempted_clients} lan thu. "
            "Dang thu model tiep theo."
        )
        
    if not router_first and LLM_ROUTER_ENABLED and not _router_is_cooling_down():
        try:
            content = _generate_router_content(
                [{"role": "user", "content": prompt}],
                is_json=is_json,
                total_budget_seconds=router_budget_seconds,
                max_tokens=max_output_tokens,
                models=router_models,
                content_validator=content_validator,
            )
            _mark_router_available()
            return content
        except Exception as error:
            router_error = error
            _cool_down_router()
            logger.warning("Provider trực tiếp và 9Router đều chưa phản hồi được cho request này.")

    if budget_exhausted:
        raise TimeoutError(
            f"Da het ngan sach {effective_budget_ms}ms sau {attempts_started} lan goi Gemini; "
            "cac model/key con lai chua duoc thu."
        ) from (router_error or last_error)
    raise router_error or last_error or Exception("Khong the ket noi den Google Gemini API sau khi xoay vong cac keys va models.")


def embed_content_with_retry(texts: list) -> list:
    """
    Goi Gemini Embedding API de lay vector bieu dien van ban (1D list of floats).
    Ho tro xoay vong API Keys de tranh dat gioi han rate limit.
    Tra ve danh sach cac vector (moi vector la List[float]).
    """
    if not clients:
        raise Exception("Khong cau hinh API keys.")
    if _network_is_cooling_down():
        raise ConnectionError("Ket noi Gemini dang tam nghi; su dung embedding du phong.")
        
    last_error = None
    available_clients = _available_clients()
    
    for client_idx, active_client in available_clients:
        try:
            vectors = []
            for t in texts:
                response = active_client.models.embed_content(
                    model="gemini-embedding-2",
                    contents=t
                )
                if hasattr(response, "embeddings") and response.embeddings:
                    vectors.append(response.embeddings[0].values)
                elif hasattr(response, "embedding") and response.embedding:
                    vectors.append(response.embedding.values)
                else:
                    raise Exception("No embedding values in API response")
            return vectors
        except Exception as e:
            last_error = e
            logger.warning(f"Loi goi Embedding voi Key #{client_idx+1}: {e}")
            err_str = str(e).lower()
            if _is_network_error(e):
                _cool_down_network()
                raise ConnectionError("Khong the ket noi Gemini Embedding.") from e
            if "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str:
                _cool_down_key(client_idx)
            
    raise last_error or Exception("Khong the ket noi den Google Gemini Embedding API sau khi xoay vong cac keys.")


def generate_vision_content_with_retry(image_bytes: bytes, mime_type: str, prompt: str) -> str:
    """
    Sử dụng Gemini Multimodal Vision để đọc và bóc tách văn bản từ tệp ảnh CV (PNG/JPG/Screenshot)
    khi Tesseract OCR cục bộ bị thiếu hoặc không đọc được.
    """
    if LLM_ROUTER_ENABLED and not _router_is_cooling_down():
        try:
            valid_router_mime = mime_type if mime_type in {
                "image/png", "image/jpeg", "image/webp"
            } else "image/jpeg"
            encoded = base64.b64encode(image_bytes).decode("ascii")
            content = _generate_router_content(
                [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{valid_router_mime};base64,{encoded}"
                            },
                        },
                    ],
                }],
                is_json=False,
            )
            normalized_content = (content or "").strip()
            lowered_content = normalized_content.casefold()
            if (
                lowered_content.startswith("data:image/")
                or "data:image/" in lowered_content
                or "base64,/9j/" in lowered_content
                or "base64,ivbor" in lowered_content
            ):
                raise ValueError("9Router Vision trả về dữ liệu ảnh thay vì văn bản OCR.")
            _mark_router_available()
            return normalized_content
        except Exception:
            _cool_down_router()
            logger.warning("9Router Vision chưa khả dụng; chuyển sang Gemini Vision nếu có.")
    if not clients:
        return ""
    if _network_is_cooling_down():
        return ""

    models_to_try = VISION_MODELS

    # Đảm bảo mime_type hợp lệ cho Gemini Part
    valid_mime = mime_type if mime_type in ["image/png", "image/jpeg", "image/webp"] else "image/jpeg"
    image_part = types.Part.from_bytes(data=image_bytes, mime_type=valid_mime)

    for model_name in models_to_try:
        with _state_lock:
            if (
                model_name in _unavailable_models
                or _model_cooldowns.get(model_name, 0) > time.monotonic()
            ):
                continue
        transient_failures = 0
        attempted_clients = 0
        for client_idx, active_client in _available_clients(model_name)[:MAX_KEYS_PER_MODEL]:
            attempted_clients += 1
            try:
                response = active_client.models.generate_content(
                    model=model_name,
                    contents=[image_part, prompt]
                )
                if response and response.text:
                    normalized_text = response.text.strip()
                    lowered_text = normalized_text.casefold()
                    if (
                        lowered_text.startswith("data:image/")
                        or "data:image/" in lowered_text
                        or "base64,/9j/" in lowered_text
                        or "base64,ivbor" in lowered_text
                    ):
                        logger.warning("Gemini Vision trả về dữ liệu ảnh thay vì văn bản OCR; đã bỏ kết quả này.")
                        continue
                    logger.info(f"✅ Gemini Vision OCR thanh cong voi model {model_name} (Key #{client_idx+1})")
                    return normalized_text
            except Exception as e:
                logger.warning(f"Loi Gemini Vision voi model {model_name} (Key #{client_idx+1}): {e}")
                err_str = str(e).lower()
                if _is_network_error(e):
                    _cool_down_network()
                    return ""
                if "404" in err_str or "not_found" in err_str or "not found" in err_str:
                    with _state_lock:
                        _unavailable_models.add(model_name)
                    break
                if _is_transient_model_error(err_str):
                    transient_failures += 1
                    _cool_down_model_key(model_name, client_idx)
                    logger.warning(
                        f"Gemini Vision {model_name} quá tải/timeout trên Key #{client_idx+1}. "
                        "Đang thử key project tiếp theo."
                    )
                    continue
                if "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str:
                    _cool_down_key(client_idx)

        if transient_failures >= max(1, min(2, attempted_clients)):
            with _state_lock:
                _model_cooldowns[model_name] = time.monotonic() + MODEL_COOLDOWN_SECONDS

    return ""

