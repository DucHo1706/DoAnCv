from google import genai
from google.genai import types
import os
import time
import requests
import json
from dotenv import load_dotenv

# Tải các biến môi trường từ .env (sử dụng đường dẫn tuyệt đối và ghi đè)
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path=env_path, override=True)

# Cấu hình kết nối LLM Gateway 9Router
USE_9ROUTER = os.getenv("USE_9ROUTER", "false").lower() == "true"
NINE_ROUTER_URL = os.getenv("NINE_ROUTER_URL", "http://localhost:20128/v1")
# Tên Combo hoặc Model được thiết lập sẵn trong 9Router (ví dụ: free-forever)
NINE_ROUTER_MODEL = os.getenv("NINE_ROUTER_MODEL", "free-forever")

# Lấy danh sách API Keys để xoay vòng khi gọi trực tiếp
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

# Loại bỏ trùng lặp nếu có
api_keys = list(dict.fromkeys(api_keys))

if not api_keys and not USE_9ROUTER:
    raise ValueError("Không tìm thấy GEMINI_API_KEY hoặc GEMINI_API_KEYS. Vui lòng cấu hình trong file .env")

# Khởi tạo genai client cho tất cả các API keys cấu hình trực tiếp
clients = [genai.Client(api_key=key) for key in api_keys] if api_keys else []
client = clients[0] if clients else None

def generate_content_with_retry(prompt: str, is_json: bool = True, models: list = None) -> str:
    """
    Gọi Gemini API với cơ chế tự động thử lại (Exponential Backoff), xoay vòng model và xoay vòng API Keys khi bị rate limit (429/503).
    Hỗ trợ tích hợp trung gian qua LLM Gateway 9Router nếu được kích hoạt.
    """
    # 1. Nếu kích hoạt 9Router, ưu tiên gọi qua Gateway
    if USE_9ROUTER:
        try:
            headers = {
                "Content-Type": "application/json"
            }
            # Nếu 9Router yêu cầu password/token, có thể truyền qua Authorization
            auth_token = os.getenv("NINE_ROUTER_TOKEN")
            if auth_token:
                headers["Authorization"] = f"Bearer {auth_token}"

            payload = {
                "model": NINE_ROUTER_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"} if is_json else None
            }
            
            print(f"🚀 [9ROUTER] Đang gửi yêu cầu tới Gateway ({NINE_ROUTER_URL}) sử dụng model/combo: {NINE_ROUTER_MODEL}")
            response = requests.post(
                f"{NINE_ROUTER_URL.rstrip('/')}/chat/completions",
                json=payload,
                headers=headers,
                timeout=60
            )
            
            if response.status_code == 200:
                # Thiết lập mã hóa UTF-8 rõ ràng trước khi đọc text để tránh lỗi font tiếng Việt
                response.encoding = 'utf-8'
                response_text = response.text.strip()
                
                # Xử lý cắt bỏ phần thừa (như "data: [DONE]") ở cuối nếu 9Router ghép thêm
                last_brace = response_text.rfind("}")
                if last_brace != -1:
                    response_text = response_text[:last_brace + 1]
                
                res_json = json.loads(response_text)
                return res_json["choices"][0]["message"]["content"]
            else:
                print(f"⚠️ [9ROUTER] Gateway trả về lỗi ({response.status_code}): {response.text}")
                print("🔄 Tự động fallback sang gọi trực tiếp Google Gemini API...")
        except Exception as e:
            print(f"⚠️ [9ROUTER] Lỗi kết nối tới Gateway 9Router: {e}")
            print("🔄 Tự động fallback sang gọi trực tiếp Google Gemini API...")

    # 2. Cơ chế xoay vòng gọi trực tiếp Google Gemini API (Fallback hoặc cấu hình mặc định)
    if not clients:
        raise Exception("Không cấu hình API keys để gọi trực tiếp và kết nối 9Router thất bại.")

    # Xoay vòng các model khả dụng để tránh bị cạn kiệt quota
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
    
    # Xoay vòng qua danh sách API key/client
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
                    print(f"⚠️ Lỗi gọi model {model_name} với Key #{client_idx+1} (Lần thử {attempt+1}): {e}")
                    
                    # Nếu là lỗi quota/rate limit 429 hoặc server 503, nghỉ rồi thử lại/đổi model
                    if "429" in err_str or "503" in err_str or "quota" in err_str or "overloaded" in err_str:
                        time.sleep(2 * (attempt + 1))
                    else:
                        break # Lỗi logic/cú pháp khác thì không cần thử lại model này
                        
        print(f"🔄 Key #{client_idx+1} bị lỗi hạn mức hoặc quá tải. Đang chuyển sang Key tiếp theo...")
        
    raise last_error or Exception("Không thể kết nối tới Gemini API sau khi xoay vòng tất cả các API Keys và Models.")
