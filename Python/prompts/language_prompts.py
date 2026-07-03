def get_language_review_prompt(jd_text: str, cv_text: str) -> str:
    return f"""
Bạn là chuyên gia ngôn ngữ học và rà soát lỗi hồ sơ nhân sự cấp cao.
Nhiệm vụ: Hãy phân tích chất lượng ngôn từ diễn đạt trong CV so với JD dưới đây theo các tiêu chuẩn học thuật nhân sự.

--- NỀN TẢNG LÝ LUẬN CẦN ÁP DỤNG ---
1. Khung chuẩn mực Tuyển dụng Không thiên vị (DEI - Diversity, Equity, and Inclusion):
   - Đánh giá ngôn từ trong CV xem có bị dính các lỗi thiên vị, định kiến (Bias) về giới tính, tuổi tác, vùng miền, sắc tộc hoặc từ ngữ mang tính chất phô trương chủ quan, thiếu chuyên nghiệp.
2. Lý thuyết phân tích cấu trúc văn bản (Perplexity và Burstiness) để phát hiện AI-Generated Content (AI Risk):
   - Perplexity (Độ phức tạp ngôn từ): Đánh giá xem sự lựa chọn từ ngữ của ứng viên có quá rập khuôn, máy móc và dễ đoán (đặc trưng của ChatGPT) hay có sự linh hoạt, tự nhiên của con người.
   - Burstiness (Độ biến thiên cấu trúc câu): Đánh giá độ dài ngắn và nhịp điệu của các câu. Văn bản do AI tạo thường có cấu trúc câu đều đều tẻ nhạt, trong khi con người có câu rất dài đan xen câu ngắn.
   - Tính toán nguy cơ "spam ChatGPT" dựa trên hai chỉ số trên.

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
      "reason": "<lý do cụ thể tại sao nên thay thế theo chuẩn DEI hoặc tính thuyết phục>"
    }}
  ],
  "ai_generation_risk": {{
    "detected": <true hoặc false>,
    "section": "<phần nghi ngờ nhiều nhất, ví dụ: 'Mục tiêu nghề nghiệp' hoặc 'Kinh nghiệm'>",
    "score": <phần trăm rủi ro từ 0-100 dựa trên phân tích Perplexity và Burstiness>,
    "comment": "<nhận xét chi tiết và hướng dẫn chỉnh sửa để tăng tính chân thực>"
  }}
}}
"""
