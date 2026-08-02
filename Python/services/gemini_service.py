from google import genai
from google.genai import types
import os
import time
import requests
import json
import random
import threading
from dotenv import load_dotenv
from utils.logger import logger

# Tai cau hinh tu env
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path=env_path, override=True)

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

if not api_keys:
    logger.warning("[Gemini Service] Warning: No valid GEMINI_API_KEY found in environment. Python server will start with fallback AI modes.")
    clients = []
    client = None
else:
    clients = [genai.Client(api_key=key) for key in api_keys]
    client = clients[0] if clients else None

DEFAULT_MODELS = [
    value.strip()
    for value in os.getenv("GEMINI_MODELS", "gemini-2.5-flash,gemini-2.0-flash").split(",")
    if value.strip()
]
VISION_MODELS = [
    value.strip()
    for value in os.getenv("GEMINI_VISION_MODELS", "gemini-2.5-flash,gemini-2.0-flash").split(",")
    if value.strip()
]
KEY_COOLDOWN_SECONDS = max(10, int(os.getenv("GEMINI_KEY_COOLDOWN_SECONDS", "60")))
_key_cooldowns = {}
_unavailable_models = set()
_state_lock = threading.Lock()


def _available_clients():
    now = time.monotonic()
    with _state_lock:
        available = [item for item in enumerate(clients) if _key_cooldowns.get(item[0], 0) <= now]
    # If every key is cooling down, fail quickly instead of multiplying slow
    # upstream calls for each concurrent CV analysis request.
    return available


def _cool_down_key(client_idx: int):
    with _state_lock:
        _key_cooldowns[client_idx] = time.monotonic() + KEY_COOLDOWN_SECONDS

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


def generate_content_with_retry(prompt: str, is_json: bool = True, models: list = None) -> str:
    """
    Goi Gemini API voi co che tu dong thu lai tren danh sach API Keys
    """
    if not clients:
        raise Exception("Khong cau hinh API keys truc tiep.")

    models_to_try = models if models is not None else DEFAULT_MODELS
    config = types.GenerateContentConfig(
        response_mime_type="application/json" if is_json else "text/plain"
    )

    last_error = None
    for model_name in models_to_try:
        with _state_lock:
            if model_name in _unavailable_models:
                continue
        # Xáo trộn danh sách clients kèm index gốc để chia đều tải ngẫu nhiên cho mỗi model
        shuffled_clients = _available_clients()
        random.shuffle(shuffled_clients)
        
        is_model_not_found = False
        for client_idx, active_client in shuffled_clients:
            try:
                response = active_client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=config
                )
                if response and response.text:
                    text = response.text.strip()
                    if is_json:
                        text = clean_json_text(text)
                        # Validate JSON structure
                        json.loads(text)
                    return text
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                logger.warning(f"Loi goi model {model_name} voi Key #{client_idx+1}: {e}")
                if "404" in err_str or "not_found" in err_str or "not found" in err_str:
                    logger.warning(f"Model {model_name} khong ton tai (404 NOT_FOUND). Bo qua model nay.")
                    is_model_not_found = True
                    with _state_lock:
                        _unavailable_models.add(model_name)
                    break
                if "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str:
                    logger.warning(f"Model {model_name} Key #{client_idx+1} dat Quota/Rate Limit (429). Dang thu sang Key/Model khac...")
                    _cool_down_key(client_idx)

        if is_model_not_found:
            continue
                
        logger.warning(f"Model {model_name} khong kha dung tren cac Keys hien co. Dang thu model tiep theo...")
        
    raise last_error or Exception("Khong the ket noi den Google Gemini API sau khi xoay vong cac keys va models.")


def embed_content_with_retry(texts: list) -> list:
    """
    Goi Gemini Embedding API de lay vector bieu dien van ban (1D list of floats).
    Ho tro xoay vong API Keys de tranh dat gioi han rate limit.
    Tra ve danh sach cac vector (moi vector la List[float]).
    """
    if not clients:
        raise Exception("Khong cau hinh API keys.")
        
    last_error = None
    # Xáo trộn danh sách clients để chia đều tải ngẫu nhiên
    shuffled_clients = _available_clients()
    random.shuffle(shuffled_clients)
    
    for client_idx, active_client in shuffled_clients:
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
            if "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str:
                _cool_down_key(client_idx)
            
    raise last_error or Exception("Khong the ket noi den Google Gemini Embedding API sau khi xoay vong cac keys.")


def generate_vision_content_with_retry(image_bytes: bytes, mime_type: str, prompt: str) -> str:
    """
    Sử dụng Gemini Multimodal Vision để đọc và bóc tách văn bản từ tệp ảnh CV (PNG/JPG/Screenshot)
    khi Tesseract OCR cục bộ bị thiếu hoặc không đọc được.
    """
    if not clients:
        return ""

    models_to_try = VISION_MODELS

    shuffled_clients = _available_clients()
    random.shuffle(shuffled_clients)

    # Đảm bảo mime_type hợp lệ cho Gemini Part
    valid_mime = mime_type if mime_type in ["image/png", "image/jpeg", "image/webp"] else "image/jpeg"
    image_part = types.Part.from_bytes(data=image_bytes, mime_type=valid_mime)

    for model_name in models_to_try:
        for client_idx, active_client in shuffled_clients:
            try:
                response = active_client.models.generate_content(
                    model=model_name,
                    contents=[image_part, prompt]
                )
                if response and response.text:
                    logger.info(f"✅ Gemini Vision OCR thanh cong voi model {model_name} (Key #{client_idx+1})")
                    return response.text.strip()
            except Exception as e:
                logger.warning(f"Loi Gemini Vision voi model {model_name} (Key #{client_idx+1}): {e}")
                err_str = str(e).lower()
                if "404" in err_str or "not_found" in err_str or "not found" in err_str:
                    with _state_lock:
                        _unavailable_models.add(model_name)
                    break
                if "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str:
                    _cool_down_key(client_idx)

    return ""

