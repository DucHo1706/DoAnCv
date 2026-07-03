import os
import time
import requests
from google import genai
from google.genai import types
from dotenv import load_dotenv
import urllib3

# Tắt cảnh báo SSL khi gọi API localhost của C#
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("Không tìm thấy GEMINI_API_KEY trong file .env")

client = genai.Client(api_key=GEMINI_API_KEY)

def auto_train_model():
    print("\nBẮT ĐẦU QUY TRÌNH TỰ ĐỘNG HUẤN LUYỆN AI (AUTO FINE-TUNING)")
    print("-" * 60)
    
    print("1. Đang gọi API sang C# để rút trích dữ liệu CV ẩn danh...")
    # THAY ĐỔI PORT 7115 THÀNH PORT TRÊN VISUAL STUDIO CỦA BẠN NẾU CẦN
    csharp_api_url = "https://localhost:7006/api/AiTrainingController/export-cv-data" 
    
    try:
        response = requests.get(csharp_api_url, verify=False)
        response.raise_for_status()
        
        file_path = "cv_training_data.jsonl"
        with open(file_path, "wb") as f:
            f.write(response.content)
        print(f"   -> Thành công! Đã lưu file dữ liệu: {file_path}")
    except Exception as e:
        print(f"Lỗi khi tải dữ liệu từ C#: {e}")
        return

    print("\n2. Đang tự động Upload dữ liệu lên Đám mây Google AI...")
    upload_file = client.files.upload(file=file_path)
    print(f"   -> Upload thành công! Mã file trên Google: {upload_file.name}")

    print("\n3. Ra lệnh cho Google bắt đầu quá trình Training (Fine-tuning)...")
    # Lưu ý: Google hỗ trợ fine-tune cực tốt trên dòng 1.5-flash cho tác vụ bóc tách
    tuning_job = client.tunings.tune(
        base_model='models/gemini-1.5-flash-001-tuning',
        training_dataset=upload_file,
        config=types.TuningJobConfig(
            display_name=f"AI-Recruitment-Tuned-{int(time.time())}",
            epoch_count=3,
        )
    )
    
    print(f"   -> Đã khởi tạo Job Huấn Luyện Thành Công! Job Name: {tuning_job.name}")
    print("\n Hệ thống siêu máy tính của Google đang tự động học từ dữ liệu của bạn.")
    print(" Hãy chờ khoảng 15-30 phút, sau đó lên trang chủ Google AI Studio để lấy mã Model mới nhé!\n")

if __name__ == "__main__":
    auto_train_model()