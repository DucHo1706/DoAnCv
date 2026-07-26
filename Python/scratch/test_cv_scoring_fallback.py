import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
load_dotenv(dotenv_path=env_path, override=True)

from services.scoring_service import calculate_resume_score, analyze_cv_deep

cv_text = """
TRẦN NGỌC NHÂN - LẬP TRÌNH VIÊN ỨNG DỤNG DI ĐỘNG
Kỹ năng: Flutter, Dart, Provider, Cubit, MVVM, Firebase, SQLite, Git, RESTful API.
Học vấn: Đại học Giao thông Vận tải TPHCM - Chuyên ngành Công nghệ thông tin.
Kinh nghiệm: Thiết kế kiến trúc MVVM cho Todo App, Car Rental App bằng Flutter.
"""

jd_text = """
Tuyển dụng Chuyên viên Lập trình Mobile (Flutter / React Native)
Yêu cầu: Thành thạo Flutter, Dart, REST API, Git, Firebase, SQLite. Có kinh nghiệm với MVVM và State Management.
"""

cv_skills = ["Flutter", "Dart", "Provider", "Cubit", "MVVM", "Firebase", "SQLite", "Git", "RESTful API"]
jd_skills = ["Flutter", "Dart", "REST API", "Git", "Firebase", "SQLite", "MVVM"]

criteria_list = [
    {"name": "Kỹ năng lập trình Mobile (Flutter)", "weight": 30},
    {"name": "Kinh nghiệm kiến trúc MVVM/State Management", "weight": 25},
    {"name": "Cơ sở dữ liệu & Backend API", "weight": 25},
    {"name": "Bằng cấp & Chuyên ngành CNTT", "weight": 20}
]

print("========== TESTING CV SCORING WITH LOCAL FALLBACK ENGINE ==========")
result = calculate_resume_score(cv_text, jd_text, cv_skills, jd_skills, criteria_list)
print(f"calculate_resume_score Status: SUCCESS")
print(f"Total Score: {result.get('total_score')}%")
print(f"Classification: {result.get('classification')}")
print(f"Matched Skills: {result.get('matched_skills')}\n")

print("========== TESTING DEEP CV ANALYSIS WITH LOCAL FALLBACK ENGINE ==========")
deep_result = analyze_cv_deep(cv_text, jd_text, cv_skills, jd_skills, "Mobile Developer", "FPT Tech")
print(f"Status: {deep_result.get('status')}")
print(f"Total Score: {deep_result.get('score_analysis', {}).get('total_score')}%")
print(f"Classification: {deep_result.get('score_analysis', {}).get('classification')}")
