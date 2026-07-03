import json

def get_scoring_prompt(criteria_list: list, jd_text: str, jd_skills_text: str, cv_text: str, cv_skills_text: str) -> str:
    return f"""
Bạn là chuyên gia tuyển dụng nhân sự cao cấp.
Nhiệm vụ: Hãy phân tích CV so với mô tả công việc (JD) và chấm điểm chi tiết dựa trên danh sách tiêu chí HR yêu cầu. 
Quá trình đánh giá phải dựa trên Mô hình năng lực ASK (Attitude - Skills - Knowledge) để làm nổi bật kiến thức và kỹ năng cần thiết.

--- NỀN TẢNG LÝ LUẬN CẦN ÁP DỤNG ---
1. Mô hình năng lực ASK:
   - Knowledge (Kiến thức): Đánh giá bằng cấp, chuyên ngành, trường đào tạo của ứng viên có đáp ứng yêu cầu nền tảng của JD hay không.
   - Skills (Kỹ năng): Đối sánh kỹ năng chuyên môn (Hard skills) và kỹ năng mềm (Soft skills) thực tế trong CV so với JD.
2. Tiêu chuẩn lọc CV của SHRM (Hiệp hội Quản trị Nhân sự Hoa Kỳ):
   - Đánh giá sự tương thích của số năm kinh nghiệm, sự liên tục của lộ trình sự nghiệp.
   - Trực tiếp chấm điểm sát sao từng tiêu chí được HR thiết lập bên dưới.

--- DANH SÁCH TIÊU CHÍ HR CUNG CẤP ---
{json.dumps(criteria_list, ensure_ascii=False)}

--- NỘI DUNG JD ---
{jd_text}
Kỹ năng JD yêu cầu: {jd_skills_text}

--- NỘI DUNG CV ---
{cv_text}
Kỹ năng CV có: {cv_skills_text}

Yêu cầu bắt buộc:
1. Trả về ĐÚNG 1 JSON duy nhất.
2. Không thêm markdown.
3. Không dùng ```json.
4. Không thêm chữ giải thích ngoài JSON.
5. criteria_results phải có đủ tất cả tiêu chí HR đã cung cấp.
6. criterion_name phải giữ đúng tên tiêu chí HR đã cung cấp.
7. weight và max_score phải bằng trọng số HR cung cấp.
8. score là số nguyên, không vượt quá max_score.
9. total_score phải bằng tổng score của criteria_results.
10. Nhận xét bằng tiếng Việt, ngắn gọn, dễ hiểu cho HR.
11. Bóc tách degree, major, university, years_of_experience, certificates. Nếu không có thông tin, trả về null hoặc 0 hoặc mảng rỗng.

Cấu trúc JSON bắt buộc:
{{
    "total_score": <số nguyên từ 0 đến 100>,
    "classification": "<Phù hợp hoặc Nên xem xét hoặc Chưa phù hợp>",
    "criteria_results": [
        {{
            "criterion_name": "<tên tiêu chí>",
            "weight": <trọng số>,
            "score": <điểm đạt được>,
            "max_score": <điểm tối đa>,
            "comment": "<nhận xét ngắn gọn theo tiêu chí này>"
        }}
    ],
    "matched_skills": [<mảng các chuỗi kỹ năng CV đáp ứng được JD>],
    "missing_skills": [<mảng các chuỗi kỹ năng JD yêu cầu nhưng CV thiếu>],
    "summary": "<1 đoạn văn ngắn bằng tiếng Việt tổng kết mức độ phù hợp của ứng viên>",
    "extracted_info": {{
        "degree": "<Bằng cấp>",
        "major": "<Chuyên ngành>",
        "university": "<Trường đại học>",
        "years_of_experience": <số năm kinh nghiệm>,
        "certificates": ["<chứng chỉ 1>", "<chứng chỉ 2>"]
    }}
}}
"""

def get_cv_validation_prompt(cv_text: str) -> str:
    return f"""
Hãy xác định xem đoạn văn bản trích xuất từ tài liệu dưới đây có phải là của một hồ sơ xin việc (CV/Resume) hay không.
Một CV hợp lệ thường chứa các thông tin như: kinh nghiệm làm việc, học vấn, kỹ năng, thông tin liên hệ, mục tiêu nghề nghiệp, dự án đã tham gia.

--- NỘI DUNG TÀI LIỆU ---
{cv_text[:3000]}

Yêu cầu đầu ra:
1. Trả về ĐÚNG 1 JSON duy nhất.
2. Không dùng markdown, không dùng ```json.
Cấu trúc JSON:
{{
  "is_resume": <true hoặc false>,
  "reason": "<lý do cụ thể bằng tiếng Việt nếu không phải là CV>"
}}
"""

def get_deep_analysis_prompt(scikit_info: str, job_title: str, company_name: str, jd_text: str, jd_skills_text: str, cv_text: str, cv_skills_text: str) -> str:
    return f"""
Bạn là chuyên gia tuyển dụng nhân sự cao cấp.
Nhiệm vụ: Chấm điểm và đánh giá hồ sơ xin việc (CV) của ứng viên so với mô tả công việc (JD) dưới đây.

--- NỀN TẢNG LÝ LUẬN CẦN ÁP DỤNG ---
1. Mô hình năng lực ASK:
   - Phân loại kỹ năng và kiến thức để chấm điểm phù hợp của ứng viên.
2. Tiêu chuẩn lọc hồ sơ & Kiểm soát rủi ro nhân sự của SHRM:
   - Phát hiện các Red Flags (Cảnh báo đỏ) về độ ổn định nhân sự, lỗi trình bày, lỗi logic.
   - Các Red Flags cần bắt lỗi bao gồm: 
     - KEYWORD_STUFFING: Nhồi nhét từ khóa kỹ năng vô tội vạ.
     - GENERIC_CV: Mô tả chung chung, thiếu chiều sâu.
     - CHRONOLOGY_GAP: Có khoảng trống thời gian sự nghiệp không rõ lý do.
     - MISSING_METRICS: Thiếu các số liệu định lượng chứng minh thành tích.
     - OTHER: Các lỗi trình bày, lỗi chính tả, sai lệch bối cảnh khác.

[KẾT QUẢ ĐO LƯỜNG TƯƠNG ĐỒNG NỀN TẢNG MACHINE LEARNING]
{scikit_info}
(Hãy tham khảo điểm số tương đồng nền tảng TF-IDF của Scikit-learn ở trên làm cơ sở thô về mặt từ khóa, kết hợp với phân tích ngữ nghĩa sâu của bạn để đưa ra điểm số tổng thể (total_score) phù hợp nhất).

--- THÔNG TIN CÔNG VIỆC ---
Vị trí: {job_title}
Công ty: {company_name}

--- NỘI DUNG JD ---
{jd_text}
Kỹ năng JD yêu cầu: {jd_skills_text}

--- NỘI DUNG CV ---
{cv_text}
Kỹ năng CV có: {cv_skills_text}

Yêu cầu phân tích:
- Điểm tổng thể (total_score) từ 0-100.
- Phân loại (classification): "Phù hợp" (>=80), "Nên xem xét" (>=60), "Chưa phù hợp" (<60).
- Nhận xét tổng quan (summary) 2-3 câu tiếng Việt.
- Điểm mạnh (strengths): 3-5 điểm mạnh rõ ràng của CV so với JD.
- Điểm yếu (weaknesses): 3-5 điểm yếu hoặc thiếu sót cần khắc phục.
- Red Flags (Cảnh báo Red Flag trong CV): tối đa 4 lỗi nghiêm trọng.
  Mỗi Red Flag gồm:
  - type: loại lỗi ("KEYWORD_STUFFING", "GENERIC_CV", "CHRONOLOGY_GAP", "MISSING_METRICS", "OTHER")
  - title: tiêu đề cảnh báo ngắn gọn (ví dụ: 'Nhồi nhét từ khóa', 'Kinh nghiệm chung chung')
  - description: giải thích tại sao đó là lỗi và cách sửa (1-2 câu)

Yêu cầu đầu ra:
1. Trả về ĐÚNG 1 JSON duy nhất.
2. Không dùng markdown, không dùng ```json, không giải thích ngoài JSON.

Cấu trúc JSON bắt buộc:
{{
  "score_analysis": {{
    "total_score": <số nguyên>,
    "classification": "<Phù hợp|Nên xem xét|Chưa phù hợp>",
    "summary": "<tóm tắt>",
    "strengths": ["<điểm mạnh 1>", ...],
    "weaknesses": ["<điểm yếu 1>", ...],
    "matched_skills": ["<kỹ năng khớp 1>", ...],
    "missing_skills": ["<kỹ năng thiếu 1>", ...],
    "red_flags": [
      {{
        "type": "<loại>",
        "title": "<tiêu đề>",
        "description": "<mô tả>"
      }}
    ]
  }}
}}
"""
