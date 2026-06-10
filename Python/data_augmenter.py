import os
import json
import time
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("Không tìm thấy GEMINI_API_KEY trong file .env")

client = genai.Client(api_key=GEMINI_API_KEY)

def generate_synthetic_data(num_samples=10):
    print(f"\n🤖 ĐANG NHỜ SIÊU MÔ HÌNH GEMINI SINH {num_samples} MẪU CV GIẢ LẬP...")
    print("-" * 60)
    
    prompt = f"""
    Bạn là một chuyên gia nhân sự và viết CV.
    Hãy tự động tạo ra {num_samples} đoạn văn bản (RawText) trích xuất từ các CV của ứng viên Việt Nam.
    Bao gồm đa dạng ngành nghề: IT, Marketing, Kế toán, Xây dựng, Thiết kế...
    Đồng thời, trích xuất chính xác danh sách các kỹ năng chuyên môn từ đoạn CV đó.
    
    Yêu cầu định dạng bắt buộc (Trả về ĐÚNG 1 mảng JSON, không dùng markdown ```json):
    [
        {{
            "InputText": "Tôi có 3 năm làm lập trình viên Java, thành thạo Spring Boot và database PostgreSQL. Có kinh nghiệm dùng Git và Docker.",
            "OutputSkills": ["Java", "Spring Boot", "PostgreSQL", "Git", "Docker"]
        }}
    ]
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        synthetic_data = json.loads(response.text)
        
        # Mở file jsonl hiện tại để ghi tiếp dữ liệu giả vào cuối file (Append)
        file_path = "cv_training_data.jsonl"
        with open(file_path, "a", encoding="utf-8") as f:
            for item in synthetic_data:
                json_line = {
                    "messages": [
                        { "role": "system", "content": "Bạn là chuyên gia bóc tách dữ liệu nhân sự. Hãy trích xuất danh sách các kỹ năng chuyên môn từ văn bản CV sau. Chỉ trả về một mảng JSON các chuỗi." },
                        { "role": "user", "content": item.get("InputText", "") },
                        { "role": "model", "content": json.dumps(item.get("OutputSkills", []), ensure_ascii=False) }
                    ]
                }
                f.write(json.dumps(json_line, ensure_ascii=False) + "\n")
                
        print(f"✅ Đã sinh và gộp thành công {len(synthetic_data)} mẫu CV giả vào file '{file_path}'.")
        print("💡 Giờ đây bạn đã có một bộ dữ liệu đủ lớn, hãy chạy file 'auto_trainer.py' để Fine-tune nhé!")
        
    except Exception as e:
        print(f"❌ Lỗi khi sinh dữ liệu: {e}")

if __name__ == "__main__":
    # Bạn có thể tăng số lượng lên 50 hoặc 100 nếu muốn mô hình học sâu hơn
    generate_synthetic_data(num_samples=20)