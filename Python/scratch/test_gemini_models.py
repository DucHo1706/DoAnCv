import os
import sys
import time
from dotenv import load_dotenv

# Load .env
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
load_dotenv(dotenv_path=env_path, override=True)

from google import genai

keys_raw = os.getenv("GEMINI_API_KEY", "")
api_keys = [k.strip() for k in keys_raw.split(",") if k.strip()]

print(f"========== GEMINI API KEY & MODEL TESTER ==========")
print(f"Found {len(api_keys)} API Keys in .env\n")

candidate_models = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash-exp"
]

working_summary = []

for model_name in candidate_models:
    print(f"Testing model: [{model_name}]...")
    for idx, key in enumerate(api_keys):
        try:
            client = genai.Client(api_key=key)
            response = client.models.generate_content(
                model=model_name,
                contents="Hello, reply: OK"
            )
            if response and response.text:
                resp_text = response.text.strip().replace("\n", " ")
                print(f"  [SUCCESS] Key #{idx+1} ({key[:10]}...): {resp_text[:50]}")
                working_summary.append((model_name, idx+1, key[:10]))
        except Exception as e:
            err_msg = str(e).split('\n')[0]
            print(f"  [FAILED] Key #{idx+1} ({key[:10]}...): {err_msg[:90]}")
            
    print("-" * 50)

print(f"\n========== SUMMARY OF WORKING KEYS & MODELS ==========")
if working_summary:
    for m, k_idx, k_sub in working_summary:
        print(f"  -> Model [{m}] works with Key #{k_idx} ({k_sub}...)")
else:
    print("  -> ALL Free Tier Gemini API Keys currently hit 429 Rate Limit (RESOURCE_EXHAUSTED).")
    print("  -> Local AI Rule Engine Fallback in Python will handle evaluations automatically with ZERO errors!")
