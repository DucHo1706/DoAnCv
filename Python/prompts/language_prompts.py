def get_language_review_prompt(jd_text: str, cv_text: str) -> str:
    return f"""
Bạn là chuyên gia ngôn ngữ học và rà soát lỗi hồ sơ nhân sự.
Hãy phân tích chất lượng ngôn từ diễn đạt trong CV so với JD dưới đây.

--- NỘI DUNG JD ---
{jd_text}

--- NỘI DUNG CV ---
{cv_text}

Yêu cầu đầu ra:
1. Trả về ĐÚNG 1 đối tượng JSON duy nhất.
2. Không dùng markdown, không dùng ```json, không giải thích ngoài JSON.

Cấu trúc JSON bắt buộc:
{{
  "overall_language_score": <số nguyên từ 0-100>,
  "language_comment": "<nhận xét chung 1-2 câu tiếng Việt>",
  "good_action_verbs": ["<động từ mạnh nên dùng 1>", ...],
  "weak_phrases": [
    {{
      "original": "<từ/cụm từ sáo rỗng, mơ hồ trong CV>",
      "suggestion": "<gợi ý thay thế mạnh mẽ>",
      "reason": "<lý do cụ thể tại sao nên thay thế>"
    }}
  ],
  "ai_generation_risk": {{
    "detected": <true hoặc false>,
    "section": "<phần nghi ngờ, ví dụ: 'Mục tiêu nghề nghiệp' hoặc 'Kinh nghiệm'>",
    "score": <phần trăm từ 0-100>,
    "comment": "<nhận xét và hướng dẫn chỉnh sửa>"
  }}
}}
"""
