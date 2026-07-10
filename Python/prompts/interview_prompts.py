def get_mock_interview_prompt(job_title: str, company_name: str, jd_text: str, cv_text: str) -> str:
    return f"""
Bạn là chuyên gia tư vấn và huấn luyện phỏng vấn tuyển dụng cao cấp.
Nhiệm vụ: Phân tích JD và CV dưới đây để xây dựng lộ trình tự học và ôn luyện chuẩn bị phỏng vấn tốt nhất cho vị trí {job_title}.
Thay vì đưa ra các câu hỏi phỏng vấn cụ thể, bạn cần đề xuất 3 chủ đề ôn tập cốt lõi nhất kèm theo các nguồn tài liệu, bài viết và đường dẫn tự học uy tín trên internet để ứng viên ôn luyện trước buổi phỏng vấn.

--- THÔNG TIN CÔNG VIỆC ---
Vị trí: {job_title}
Công ty: {company_name}

--- NỘI DUNG JD ---
{jd_text}

--- NỘI DUNG CV ---
{cv_text}

--- HƯỚNG DẪN CUNG CẤP ĐƯỜNG DẪN THAM KHẢO ---
- Hãy gợi ý các đường dẫn (URL) cụ thể và chính xác từ các nguồn uy tín như: tài liệu chính thức (React, Node.js...), các kho ôn luyện phỏng vấn nổi tiếng trên GitHub (ví dụ: system-design-primer, awesome-interview...), LeetCode, MDN Web Docs, W3Schools, GeeksforGeeks, các bài viết cẩm nang tuyển dụng của TopCV, CareerBuilder... phù hợp với lĩnh vực của JD.
- Định dạng đường dẫn bắt buộc sử dụng định dạng Markdown: [Tên tài liệu/nguồn](đường-dẫn-url) (ví dụ: [System Design Primer trên GitHub](https://github.com/donnemartin/system-design-primer)).

Yêu cầu đầu ra:
1. Trả về ĐÚNG 1 mảng JSON chứa 3 phần tử.
2. Không dùng markdown bên ngoài JSON, không dùng ```json, không giải thích ngoài JSON.

Cấu trúc JSON bắt buộc (giữ nguyên khoá cũ để tương thích với hệ thống):
[
  {{
    "question": "<Tên chủ đề hoặc tài liệu cần ôn tập bằng tiếng Việt>",
    "intention": "<Lý do vì sao chủ đề này lại vô cùng quan trọng đối với nhà tuyển dụng và vị trí ứng tuyển>",
    "star_guide": "<Hướng dẫn chuẩn bị và hệ thống hóa kinh nghiệm thực tế của bản thân theo mô hình STAR đối với chủ đề này>",
    "best_answer": "<Lời khuyên ôn luyện cụ thể và danh sách các nguồn tự học, các bài viết, link website tham khảo cụ thể có chứa định dạng Markdown [Tên nguồn](link) để ứng viên tự đọc và chuẩn bị>"
  }}
]
"""

def get_answer_evaluation_prompt(job_title: str, question: str, answer: str) -> str:
    return f"""
Bạn là một chuyên gia huấn luyện phỏng vấn nhân sự cấp cao (Interview Coach).
Nhiệm vụ: Đánh giá câu trả lời của ứng viên cho câu hỏi phỏng vấn dưới đây theo Khung năng lực vị trí và cấu trúc STAR.

--- NỀN TẢNG LÝ LUẬN CẦN ÁP DỤNG ---
1. Phương pháp Phỏng vấn Sự kiện Hành vi (BEI):
   - Đánh giá xem câu trả lời của ứng viên có mang tính thực tiễn hành động hay chỉ là lý thuyết chung chung.
   - Kiểm tra xem ứng viên có trình bày đủ 4 yếu tố STAR (Situation - Task - Action - Result) trong câu trả lời hay không. Nếu thiếu, hãy chỉ rõ phần bị thiếu và hướng dẫn cách bổ sung số liệu/chi tiết dự án.

[VỊ TRÍ TUYỂN DỤNG]
{job_title}

[CÂU HỎI PHỎNG VẤN]
{question}

[CÂU TRẢ LỜI CỦA ỨNG VIÊN]
{answer}

Yêu cầu đầu ra:
1. Trả về ĐÚNG 1 đối tượng JSON duy nhất.
2. Không sử dụng markdown (không dùng ```json).
3. Không thêm giải thích ngoài JSON.

Cấu trúc JSON bắt buộc:
{{
  "score": <số nguyên từ 0 đến 100 dựa trên độ hoàn thiện cấu trúc STAR và năng lực thể hiện>,
  "strengths": "<những điểm tốt trong câu trả lời bằng tiếng Việt>",
  "weaknesses": "<những điểm thiếu sót, cần cải thiện bằng tiếng Việt>",
  "suggestions": "<hướng dẫn chi tiết cách cải thiện bằng tiếng Việt, tập trung vào việc bổ sung số liệu và hành động>",
  "improved_answer": "<mẫu câu trả lời xuất sắc hơn đã được tối ưu hóa dựa trên ý của ứng viên>"
}}
"""
