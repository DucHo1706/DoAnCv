from google import genai
from google.genai import types
import os
import time
import requests
import json
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
    raise ValueError("Khong tim thay khoa API trong env.")

clients = [genai.Client(api_key=key) for key in api_keys] if api_keys else []
client = clients[0] if clients else None

def clean_json_text(text: str) -> str:
    """
    Loai bo cac ky tu boc Markdown nhu ```json ... ``` de chuyen ve JSON hop le
    """
    if not text:
        return ""
    text = text.strip()
    if text.startswith("```"):
        first_newline = text.find("\n")
        if first_newline != -1:
            text = text[first_newline:].strip()
        else:
            text = text[3:].strip()
    if text.endswith("```"):
        text = text[:-3].strip()
    return text


def generate_content_with_retry(prompt: str, is_json: bool = True, models: list = None) -> str:
    """
    Goi Gemini API voi co che tu dong thu lai tren danh sach API Keys
    """
    if not clients:
        raise Exception("Khong cau hinh API keys truc tiep.")

    models_to_try = models if models is not None else [
        "gemini-3.5-flash",
        "gemini-2.0-flash", 
        "gemini-1.5-flash",
        "gemini-2.0-flash-lite", 
        "gemini-2.5-flash-lite", 
        "gemini-flash-latest"
    ]
    config = types.GenerateContentConfig(
        response_mime_type="application/json" if is_json else "text/plain"
    )

    last_error = None
    import random
    
    for model_name in models_to_try:
        # Xáo trộn danh sách clients kèm index gốc để chia đều tải ngẫu nhiên cho mỗi model
        shuffled_clients = list(enumerate(clients))
        random.shuffle(shuffled_clients)
        
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
                
        logger.warning(f"Model {model_name} khong kha dung tren cac Keys hien co. Dang thu model tiep theo...")
        
    raise last_error or Exception("Khong the ket noi den Google Gemini API sau khi xoay vong cac keys va models.")
