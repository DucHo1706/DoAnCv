from .gemini_service import generate_content_with_retry
from prompts.star_prompts import get_star_optimization_prompt
from prompts.interview_prompts import get_mock_interview_prompt, get_answer_evaluation_prompt
from utils.logger import logger
import json
import re

def _clean_lines(text: str) -> list:
    return [re.sub(r"^[•\-*\s]+", "", line).strip() for line in (text or "").splitlines() if len(line.strip()) >= 18]

def get_fallback_star_tips(cv_skills: list = None, jd_skills: list = None, cv_text: str = "") -> list:
    """Phân tích cục bộ, chỉ trích dẫn câu có thật và không tự tạo thành tích."""
    lines = _clean_lines(cv_text)
    experience_lines = [line for line in lines if any(word in line.lower() for word in [
        "phát triển", "triển khai", "xây dựng", "thiết kế", "quản lý", "hỗ trợ", "tham gia", "vận hành"
    ])]
    tips = []
    for line in experience_lines[:2]:
        has_metric = bool(re.search(r"\d+(?:[.,]\d+)?\s*(?:%|năm|tháng|phút|giờ|dịch vụ|dự án|api)", line.lower()))
        missing_part = "kết quả định lượng" if not has_metric else "bối cảnh và vai trò cá nhân"
        tips.append({
            "group": "Kinh nghiệm & Dự án",
            "title": f"Bổ sung {missing_part}",
            "detail": f"Câu trong CV chưa thể hiện đầy đủ STAR: “{line}”. Hãy bổ sung thông tin có thể kiểm chứng thay vì tạo số liệu mới.",
            "priority": "high" if not has_metric else "medium",
            "star_guidance": "Nêu bối cảnh, nhiệm vụ của riêng bạn, hành động đã thực hiện và kết quả thực tế. Nếu chưa có số liệu, dùng kết quả định tính có thể giải thích khi phỏng vấn.",
            "example_before": line,
            "example_after": f"[Bối cảnh] – Tôi chịu trách nhiệm [nhiệm vụ], đã {line[:1].lower() + line[1:]} và đạt [kết quả thực tế có thể kiểm chứng].",
            "is_fallback": True,
            "analysis_mode": "local"
        })

    cv_normalized = {str(skill).strip().casefold() for skill in (cv_skills or []) if str(skill).strip()}
    missing = [
        str(skill).strip() for skill in (jd_skills or [])
        if str(skill).strip() and str(skill).strip().casefold() not in cv_normalized
    ]
    if missing:
        tips.append({
            "group": "Kỹ năng",
            "title": "Làm rõ kỹ năng còn thiếu bằng bằng chứng",
            "detail": "JD yêu cầu nhưng CV chưa thể hiện rõ: " + ", ".join(missing[:5]) + ". Chỉ bổ sung kỹ năng nếu bạn đã thực sự sử dụng.",
            "priority": "high",
            "star_guidance": "Gắn từng kỹ năng với dự án, nhiệm vụ, thời gian sử dụng và kết quả thực tế.",
            "example_before": None,
            "example_after": None,
            "is_fallback": True,
            "analysis_mode": "local"
        })
    if not tips:
        tips.append({
            "group": "Kinh nghiệm & Dự án",
            "title": "Trình bày một kinh nghiệm theo STAR",
            "detail": "CV chưa có câu kinh nghiệm đủ rõ để đối chiếu theo STAR. Hãy chọn một nhiệm vụ thật bạn từng thực hiện và bổ sung bối cảnh, vai trò, hành động, kết quả.",
            "priority": "medium",
            "star_guidance": "Chỉ sử dụng sự kiện và kết quả có thật; không tự tạo số liệu để tăng điểm CV.",
            "example_before": None,
            "example_after": None,
            "is_fallback": True,
            "analysis_mode": "local"
        })
    return tips[:3]

def get_fallback_mock_interview(cv_skills: list = None, jd_skills: list = None) -> list:
    matched = [str(skill).strip() for skill in (cv_skills or []) if str(skill).strip()]
    cv_normalized = {skill.casefold() for skill in matched}
    missing = [
        str(skill).strip() for skill in (jd_skills or [])
        if str(skill).strip() and str(skill).strip().casefold() not in cv_normalized
    ]
    topics = missing[:2] + [skill for skill in matched if skill not in missing][:1]
    if not topics:
        topics = ["Kiến thức chuyên môn trong JD", "Dự án tiêu biểu trong CV", "Cách trình bày kinh nghiệm theo STAR"]
    links = {
        "docker": "[Tài liệu Docker](https://docs.docker.com/get-started/)",
        "kubernetes": "[Tài liệu Kubernetes](https://kubernetes.io/docs/tutorials/)",
        "linux": "[Linux Journey](https://linuxjourney.com/)",
        "aws": "[AWS Skill Builder](https://skillbuilder.aws/)",
        "c#": "[Tài liệu C#](https://learn.microsoft.com/dotnet/csharp/)",
        ".net": "[Tài liệu .NET](https://learn.microsoft.com/dotnet/)",
        "react": "[Tài liệu React](https://react.dev/learn)"
    }
    result = []
    for topic in topics[:3]:
        normalized = topic.lower()
        resource = next((url for key, url in links.items() if key in normalized), "[Kỹ năng nghề nghiệp](https://www.coursera.org/articles/job-skills)")
        result.append({
            "question": topic,
            "intention": "Chủ đề được chọn từ kỹ năng JD còn thiếu hoặc kỹ năng đã xuất hiện trong CV.",
            "star_guide": "Chuẩn bị một tình huống thật: bối cảnh, nhiệm vụ, hành động của bản thân và kết quả có thể giải thích.",
            "best_answer": f"Ôn lại khái niệm cốt lõi, thực hành một ví dụ nhỏ và chuẩn bị bằng chứng từ dự án. {resource}",
            "is_fallback": True,
            "analysis_mode": "local"
        })
    return result

def generate_cv_star_tips(cv_text: str, jd_text: str, cv_skills: list = None, jd_skills: list = None) -> list:
    """
    Tao cac goi y toi uu hoa CV theo chuan STAR
    """
    cv_skills_text = ", ".join(cv_skills) if cv_skills else "Chưa trích xuất được"
    jd_skills_text = ", ".join(jd_skills) if jd_skills else "Chưa trích xuất được"

    prompt = get_star_optimization_prompt(jd_text, jd_skills_text, cv_text, cv_skills_text)
    try:
        response_text = generate_content_with_retry(prompt)
        result = json.loads(response_text)
        if isinstance(result, list) and len(result) > 0:
            return result
    except Exception as e:
        logger.error(f"Loi generate_cv_star_tips: {e}")
    
    return get_fallback_star_tips(cv_skills, jd_skills, cv_text)

def generate_cv_mock_interview(cv_text: str, jd_text: str, job_title: str = "Chưa rõ", company_name: str = "Doanh nghiệp", cv_skills: list = None, jd_skills: list = None) -> list:
    """
    Du doan cac cau hoi phong van nghiep vu dua tren CV va JD
    """
    prompt = get_mock_interview_prompt(job_title, company_name, jd_text, cv_text)
    try:
        response_text = generate_content_with_retry(prompt)
        result = json.loads(response_text)
        if isinstance(result, list) and len(result) > 0:
            return result
    except Exception as e:
        logger.error(f"Loi generate_cv_mock_interview: {e}")
    
    return get_fallback_mock_interview(cv_skills, jd_skills)

def evaluate_interview_answer(question: str, answer: str, job_title: str) -> dict:
    """
    Danh gia cau tra loi phong van theo mo hinh STAR
    """
    prompt = get_answer_evaluation_prompt(job_title, question, answer)
    try:
        response_text = generate_content_with_retry(prompt)
        result = json.loads(response_text)
        return {
            "status": "success",
            "score": int(result.get("score", 50)),
            "strengths": result.get("strengths", "Chưa xác định rõ điểm mạnh."),
            "weaknesses": result.get("weaknesses", "Chưa xác định rõ điểm cần cải thiện."),
            "suggestions": result.get("suggestions", "Cần cụ thể hóa bằng số liệu."),
            "improved_answer": result.get("improved_answer", "Chưa có gợi ý câu trả lời mẫu.")
        }
    except Exception as e:
        logger.error(f"Loi evaluate_interview_answer: {e}")
        # Keep the interview flow usable when every Gemini key is temporarily
        # rate-limited. The response is explicitly marked as a fallback.
        normalized_answer = (answer or "").strip()
        word_count = len(normalized_answer.split())
        has_result = any(token in normalized_answer.lower() for token in ["%", "kết quả", "ket qua", "tăng", "tang", "giảm", "giam"])
        score = min(75, max(35, 35 + min(word_count, 30) + (10 if has_result else 0)))
        return {
            "status": "success",
            "is_fallback": True,
            "score": score,
            "strengths": "Câu trả lời đã nêu được nội dung chính và có thể tiếp tục phát triển theo cấu trúc STAR.",
            "weaknesses": "Hệ thống AI đang tạm bận nên chưa thể đánh giá sâu theo ngữ cảnh vị trí.",
            "suggestions": "Hãy bổ sung rõ Tình huống, Nhiệm vụ, Hành động và Kết quả có số liệu đo lường.",
            "improved_answer": normalized_answer,
            "message": "Đang dùng đánh giá dự phòng; bạn có thể thử lại để nhận phân tích AI đầy đủ."
        }
