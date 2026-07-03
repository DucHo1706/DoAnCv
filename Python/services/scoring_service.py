from .gemini_service import generate_content_with_retry
from .ml_service import calculate_scikit_similarity, HAS_SKLEARN
import json

def chat_with_candidate(user_message, history=None, job_description="", file_text="", system_knowledge=""):
    system_instruction = """Bạn là trợ lý ảo AI Recruitment Assistant chuyên nghiệp của hệ thống tuyển dụng AI Recruitment.
Nhiệm vụ của bạn là trả lời câu hỏi của người dùng tuân thủ NGHIÊM NGẶT các quy tắc ưu tiên sau:

1. ƯU TIÊN SỐ 1 (Ngữ cảnh & Dữ liệu hệ thống): LUÔN tìm kiếm câu trả lời dựa trên các thông tin được cung cấp trong ngữ cảnh (Lịch sử trò chuyện, Mô tả công việc JD, Nội dung CV đính kèm, Dữ liệu bổ sung). Nếu có thông tin phù hợp, hãy trả lời dựa trên đó.
2. ƯU TIÊN SỐ 2 (Kiến thức chuyên môn): Nếu ngữ cảnh KHÔNG CÓ thông tin, bạn được phép dùng kiến thức của mình để hỗ trợ, NHƯNG CHỈ ĐƯỢC PHÉP nói về các chủ đề: Tuyển dụng, Nhân sự, Tìm việc làm, Viết CV, Phỏng vấn, Xu hướng nghề nghiệp.
3. TỪ CHỐI NGOÀI LỀ (Out of scope): Tuyệt đối KHÔNG trả lời bất kỳ câu hỏi nào ngoài các chủ đề trên (ví dụ: không viết code, không giải toán, không làm thơ, không nói chuyện chính trị, giải trí...). Nếu người dùng hỏi ngoài lề, hãy trả lời mặc định: "Xin lỗi, tôi là trợ lý ảo chuyên về lĩnh vực Tuyển dụng và Việc làm. Tôi không thể hỗ trợ bạn vấn đề này."
"""
    prompt = f"""
{system_instruction}

--- DỮ LIỆU BỔ SUNG ---
{system_knowledge}

--- MÔ TẢ CÔNG VIỆC (JD) ---
{job_description}

--- NỘI DUNG CV ĐĨNH KÈM ---
{file_text}

--- LỊCH SỬ TRÒ CHUYỆN ---
{json.dumps(history) if history else "[]"}

--- CÂU HỎI MỚI CỦA NGƯỜI DÙNG ---
{user_message}
"""
    try:
        return generate_content_with_retry(prompt, is_json=False)
    except Exception as e:
        return f"Xin lỗi, trợ lý AI đang quá tải hệ thống. Vui lòng hỏi lại sau ít giây. Chi tiết: {str(e)}"

def calculate_resume_score(cv_text: str, jd_text: str, cv_skills: list, jd_skills: list, criteria_list: list) -> dict:
    cv_skills_text = ", ".join(cv_skills) if cv_skills else "Chưa trích xuất được"
    jd_skills_text = ", ".join(jd_skills) if jd_skills else "Chưa trích xuất được"

    prompt = f"""
Bạn là chuyên gia tuyển dụng cao cấp.
Nhiệm vụ: Hãy phân tích CV so với mô tả công việc (JD) và chấm điểm chi tiết dựa trên danh sách tiêu chí HR yêu cầu.

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
    try:
        response_text = generate_content_with_retry(
            prompt,
            is_json=True,
            models=["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro", "gemini-2.0-flash-lite", "gemini-flash-latest"]
        )
        ai_result = json.loads(response_text)
        return normalize_scoring_result(ai_result, criteria_list)
    except Exception as e:
        print(f"Lỗi calculate_resume_score: {e}")
        return build_default_scoring_result(criteria_list)

def normalize_scoring_result(ai_result, criteria_list):
    criteria_results = []
    total_score = 0

    for criterion in criteria_list:
        criterion_name = str(criterion["name"]).strip()
        criterion_weight = int(criterion["weight"])

        score = 0
        comment = "AI chưa đánh giá tiêu chí này."

        ai_criteria = ai_result.get("criteria_results", [])
        matched_ai_criterion = None
        for ac in ai_criteria:
            ac_name = str(ac.get("criterion_name", "")).strip()
            if ac_name.lower() == criterion_name.lower():
                matched_ai_criterion = ac
                break

        if matched_ai_criterion is not None:
            try:
                score = int(matched_ai_criterion.get("score", 0))
            except Exception:
                score = 0
            comment = matched_ai_criterion.get("comment", comment)

        score = max(0, min(criterion_weight, score))
        total_score += score

        criteria_results.append({
            "criterion_name": criterion_name,
            "weight": criterion_weight,
            "score": score,
            "max_score": criterion_weight,
            "comment": comment
        })

    classification = classify_cv(total_score)
    matched_skills = ai_result.get("matched_skills", [])
    missing_skills = ai_result.get("missing_skills", [])
    summary = ai_result.get("summary", "")

    if not isinstance(matched_skills, list): matched_skills = []
    if not isinstance(missing_skills, list): missing_skills = []
    if not summary: summary = "Đã hoàn thành chấm điểm CV."

    ext = ai_result.get("extracted_info", {})
    degree = ext.get("degree")
    major = ext.get("major")
    university = ext.get("university")
    try:
        years_of_experience = float(ext.get("years_of_experience", 0))
    except (ValueError, TypeError):
        years_of_experience = 0.0
    certificates = ext.get("certificates", [])
    if not isinstance(certificates, list): certificates = []

    return {
        "total_score": total_score,
        "classification": classification,
        "criteria_results": criteria_results,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "summary": summary,
        "extracted_info": {
            "degree": degree,
            "major": major,
            "university": university,
            "years_of_experience": years_of_experience,
            "certificates": certificates
        },
        "ExtractedInfo": {
            "Degree": degree,
            "Major": major,
            "University": university,
            "YearsOfExperience": years_of_experience,
            "Certificates": certificates
        }
    }

def classify_cv(total_score):
    if total_score >= 80: return "Phù hợp"
    if total_score >= 60: return "Nên xem xét"
    return "Chưa phù hợp"

def build_default_scoring_result(criteria_list):
    criteria_results = []
    for criterion in criteria_list:
        criterion_name = str(criterion["name"]).strip()
        criterion_weight = int(criterion["weight"])
        criteria_results.append({
            "criterion_name": criterion_name,
            "weight": criterion_weight,
            "score": 0,
            "max_score": criterion_weight,
            "comment": "Lỗi AI phân tích."
        })
    return {
        "total_score": 0,
        "classification": "Chưa phù hợp",
        "criteria_results": criteria_results,
        "matched_skills": [],
        "missing_skills": [],
        "summary": "Không thể chấm điểm do sự cố kết nối AI.",
        "extracted_info": {
            "degree": None,
            "major": None,
            "university": None,
            "years_of_experience": 0,
            "certificates": []
        }
    }

def is_document_a_resume(cv_text: str) -> tuple[bool, str]:
    """
    Sử dụng Gemini kiểm tra xem file tải lên có phải là CV/Resume hay không.
    """
    if not cv_text or len(cv_text.strip()) < 50:
        return False, "Nội dung văn bản quá ngắn để được xác định là một CV."
    prompt = f"""
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
    try:
        res = generate_content_with_retry(prompt)
        data = json.loads(res)
        return bool(data.get("is_resume", True)), data.get("reason", "")
    except Exception as e:
        print(f"Lỗi is_document_a_resume: {e}")
        return True, ""

def analyze_cv_deep(cv_text: str, jd_text: str, cv_skills: list, jd_skills: list, job_title: str = "", company_name: str = ""):
    """
    Phân tích CV chuyên sâu phần chấm điểm cốt lõi (Tab 1).
    Sinh nhanh điểm số, nhận xét, điểm mạnh/yếu, Red Flags và kỹ năng.
    """
    cv_skills_text = ", ".join(cv_skills) if cv_skills else "Chưa trích xuất được"
    jd_skills_text = ", ".join(jd_skills) if jd_skills else "Chưa trích xuất được"

    # Tính điểm đối sánh bằng Scikit-learn
    scikit_score = calculate_scikit_similarity(cv_text, jd_text)
    scikit_info = f"- Điểm kiểm định tương thích nền tảng bằng Machine Learning (TF-IDF & Cosine Similarity từ Scikit-learn): {scikit_score:.1f}/100" if HAS_SKLEARN else ""

    prompt = f"""
Bạn là chuyên gia tuyển dụng nhân sự cao cấp.
Nhiệm vụ: Chấm điểm và đánh giá hồ sơ xin việc (CV) của ứng viên so với mô tả công việc (JD) dưới đây.

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
    try:
        response_text = generate_content_with_retry(
            prompt,
            is_json=True,
            models=["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro", "gemini-2.0-flash-lite", "gemini-flash-latest"]
        )
        result = json.loads(response_text)

        # Validate và normalize kết quả
        score_analysis = result.get("score_analysis", {})
        total_score = score_analysis.get("total_score", 0)
        try:
            total_score = int(total_score)
        except (ValueError, TypeError):
            total_score = 0
        total_score = max(0, min(100, total_score))

        classification = score_analysis.get("classification", "")
        if classification not in ["Phù hợp", "Nên xem xét", "Chưa phù hợp"]:
            if total_score >= 80:
                classification = "Phù hợp"
            elif total_score >= 60:
                classification = "Nên xem xét"
            else:
                classification = "Chưa phù hợp"

        score_analysis["total_score"] = total_score
        score_analysis["classification"] = classification
        score_analysis.setdefault("summary", "AI đã hoàn thành phân tích CV.")
        score_analysis.setdefault("strengths", [])
        score_analysis.setdefault("weaknesses", [])
        score_analysis.setdefault("red_flags", [])
        score_analysis.setdefault("matched_skills", cv_skills)
        score_analysis.setdefault("missing_skills", jd_skills)

        return {
            "status": "success",
            "score_analysis": score_analysis,
            "optimization_tips": [],
            "language_review": {
                "overall_language_score": 0,
                "language_comment": "Chưa tải phân tích ngôn ngữ.",
                "good_action_verbs": [],
                "weak_phrases": [],
                "ai_generation_risk": {"detected": False, "section": "", "score": 0, "comment": ""}
            },
            "mock_interview": []
        }

    except Exception as ex:
        print(f"LỖI analyze_cv_deep: {ex}")
        return {
            "status": "error",
            "message": f"AI không thể phân tích CV: {str(ex)}",
            "score_analysis": {
                "total_score": 0,
                "classification": "Chưa phù hợp",
                "summary": f"Đã xảy ra lỗi khi AI phân tích: {str(ex)}",
                "strengths": [],
                "weaknesses": [],
                "red_flags": [],
                "matched_skills": [],
                "missing_skills": []
            },
            "optimization_tips": [],
            "language_review": {
                "overall_language_score": 0,
                "language_comment": "Không thể phân tích ngôn ngữ.",
                "good_action_verbs": [],
                "weak_phrases": [],
                "ai_generation_risk": {
                    "detected": False,
                    "section": "",
                    "score": 0,
                    "comment": "Không thể đánh giá độ chân thực."
                }
            },
            "mock_interview": []
        }

def generate_cv_language_review(cv_text: str, jd_text: str) -> dict:
    prompt = f"""
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
    try:
        response_text = generate_content_with_retry(prompt)
        result = json.loads(response_text)
        return result
    except Exception as e:
        print(f"Lỗi generate_cv_language_review: {e}")
        return {
            "overall_language_score": 70,
            "language_comment": "Ngôn ngữ tạm ổn, cần cải thiện một số từ sáo rỗng.",
            "good_action_verbs": [],
            "weak_phrases": [],
            "ai_generation_risk": {"detected": False, "section": "", "score": 0, "comment": ""}
        }
