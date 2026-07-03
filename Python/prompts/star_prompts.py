def get_star_optimization_prompt(jd_text: str, jd_skills_text: str, cv_text: str, cv_skills_text: str) -> str:
    return f"""
Bạn là chuyên gia tư vấn tối ưu hóa hồ sơ xin việc (CV Writer).
Hãy phân tích CV so với JD dưới đây và tạo tối đa 5 gợi ý cải thiện CV cụ thể theo mô hình STAR (Tình huống, Nhiệm vụ, Hành động, Kết quả).

--- NỘI DUNG JD ---
{jd_text}
Kỹ năng JD yêu cầu: {jd_skills_text}

--- NỘI DUNG CV ---
{cv_text}
Kỹ năng CV có: {cv_skills_text}

Yêu cầu đầu ra:
1. Trả về ĐÚNG 1 mảng JSON duy nhất.
2. Không dùng markdown, không dùng ```json, không giải thích ngoài JSON.

Cấu trúc JSON bắt buộc:
[
  {{
    "group": "<Kinh nghiệm|Kỹ năng|Dự án|Học vấn|Trình bày>",
    "title": "<tiêu đề ngắn gọn gợi ý>",
    "detail": "<mô tả chi tiết cách tối ưu bằng tiếng Việt>",
    "priority": "<high|medium>",
    "star_guidance": "<hướng dẫn cụ thể cách áp dụng mô hình STAR cho phần này>",
    "example_before": "<câu gốc mơ hồ chưa tối ưu được lấy nguyên văn từ CV>",
    "example_after": "<câu mẫu viết lại chuẩn STAR để lượng hóa và làm nổi bật thành tích>"
  }}
]
"""
