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

USE_9ROUTER = os.getenv("USE_9ROUTER", "false").lower() == "true"
NINE_ROUTER_URL = os.getenv("NINE_ROUTER_URL", "http://localhost:20128/v1")
NINE_ROUTER_MODEL = os.getenv("NINE_ROUTER_MODEL", "free-forever")

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

if not api_keys and not USE_9ROUTER:
    raise ValueError("Khong tim thay khoa API trong env.")

clients = [genai.Client(api_key=key) for key in api_keys] if api_keys else []
client = clients[0] if clients else None

def generate_content_with_retry(prompt: str, is_json: bool = True, models: list = None) -> str:
    """
    Goi Gemini API voi co che tu dong thu lai hoac chuyen tiep qua 9Router
    """
    if USE_9ROUTER:
        try:
            headers = {
                "Content-Type": "application/json"
            }
            auth_token = os.getenv("NINE_ROUTER_TOKEN")
            if auth_token:
                headers["Authorization"] = f"Bearer {auth_token}"

            payload = {
                "model": NINE_ROUTER_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"} if is_json else None,
                "stream": False
            }
            
            logger.info(f"Gui yeu cau den Gateway 9Router ({NINE_ROUTER_URL}) su dung model: {NINE_ROUTER_MODEL}")
            response = requests.post(
                f"{NINE_ROUTER_URL.rstrip('/')}/chat/completions",
                json=payload,
                headers=headers,
                timeout=60
            )
            
            if response.status_code == 200:
                response.encoding = 'utf-8'
                response_text = response.text.strip()
                
                last_brace = response_text.rfind("}")
                if last_brace != -1:
                    response_text = response_text[:last_brace + 1]
                
                res_json = json.loads(response_text)
                return res_json["choices"][0]["message"]["content"]
            else:
                logger.warning(f"9Router Gateway tra ve loi ({response.status_code}): {response.text}")
                logger.info("Chuyen huong sang goi truc tiep Google Gemini API...")
        except Exception as e:
            logger.warning(f"Loi ket noi toi 9Router Gateway: {e}")
            logger.info("Chuyen huong sang goi truc tiep Google Gemini API...")

    if not clients:
        raise Exception("Khong cau hinh API keys truc tiep va ket noi qua 9Router that bai.")

    models_to_try = models if models is not None else [
        "gemini-2.5-flash", 
        "gemini-2.0-flash", 
        "gemini-2.0-flash-lite", 
        "gemini-2.5-flash-lite", 
        "gemini-flash-latest"
    ]
    config = types.GenerateContentConfig(
        response_mime_type="application/json" if is_json else "text/plain"
    )

    last_error = None
    
    for client_idx, active_client in enumerate(clients):
        for model_name in models_to_try:
            for attempt in range(2):
                try:
                    response = active_client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=config
                    )
                    if response and response.text:
                        return response.text
                except Exception as e:
                    last_error = e
                    err_str = str(e).lower()
                    logger.warning(f"Loi goi model {model_name} voi Key #{client_idx+1} (Lan thu {attempt+1}): {e}")
                    
                    if "429" in err_str or "503" in err_str or "quota" in err_str or "overloaded" in err_str:
                        time.sleep(2 * (attempt + 1))
                    else:
                        break
                        
        logger.warning(f"Key #{client_idx+1} bi loi han muc. Dang chuyen sang Key tiep theo...")
        
    raise last_error or Exception("Khong the ket noi den Google Gemini API sau khi xoay vong cac keys.")
