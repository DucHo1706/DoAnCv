def get_mock_interview_prompt(job_title: str, company_name: str, jd_text: str, cv_text: str) -> str:
    return f"""
Bạn là một chuyên gia mô phỏng phỏng vấn (Mock Interviewer) chuyên nghiệp.
Hãy phân tích CV và JD dưới đây và dự đoán 3 câu hỏi phỏng vấn nghiệp vụ hóc búa nhất dựa trên sự giao thoa và điểm yếu của hồ sơ.

--- THÔNG TIN CÔNG VIỆC ---
Vị trí: {job_title}
Công ty: {company_name}

--- NỘI DUNG JD ---
{jd_text}

--- NỘI DUNG CV ---
{cv_text}

Yêu cầu đầu ra:
1. Trả về ĐÚNG 1 mảng JSON chứa 3 phần tử.
2. Không dùng markdown, không dùng ```json, không giải thích ngoài JSON.

Cấu trúc JSON bắt buộc:
[
  {{
    "question": "<câu hỏi phỏng vấn bằng tiếng Việt>",
    "intention": "<ý đồ thực tế của nhà tuyển dụng khi hỏi câu này>",
    "star_guide": "<chiến lược trả lời theo mô hình STAR>",
    "best_answer": "<câu trả lời mẫu chuẩn mực đạt điểm tối đa>"
  }}
]
"""

def get_answer_evaluation_prompt(job_title: str, question: str, answer: str) -> str:
    return f"""
Bạn là một chuyên gia huấn luyện phỏng vấn nhân sự cấp cao (Interview Coach).
Nhiệm vụ của bạn là đánh giá câu trả lời của ứng viên cho câu hỏi phỏng vấn dưới đây:

[VỊ TRÍ TUYỂN DỤNG]
{job_title}

[CÂU HỎI PHỎNG VẤN]
{question}

[CÂU TRẢ LỜI CỦA ỨNG VIÊN]
{answer}

Hãy thực hiện đánh giá chi tiết theo phương pháp STAR (Tình huống, Nhiệm vụ, Hành động, Kết quả).
Nếu câu trả lời quá ngắn hoặc thiếu thông tin, hãy thẳng thắn chỉ ra và hướng dẫn cách bổ sung số liệu/chi tiết.

Yêu cầu đầu ra:
1. Trả về ĐÚNG 1 đối tượng JSON duy nhất.
2. Không sử dụng markdown (không dùng ```json).
3. Không thêm giải thích ngoài JSON.

Cấu trúc JSON bắt buộc:
{{
  "score": <số nguyên từ 0 đến 100>,
  "strengths": "<những điểm tốt trong câu trả lời bằng tiếng Việt>",
  "weaknesses": "<những điểm thiếu sót, cần cải thiện bằng tiếng Việt>",
  "suggestions": "<hướng dẫn chi tiết cách cải thiện bằng tiếng Việt>",
  "improved_answer": "<mẫu câu trả lời xuất sắc hơn đã được tối ưu hóa dựa trên ý của ứng viên>"
}}
"""
