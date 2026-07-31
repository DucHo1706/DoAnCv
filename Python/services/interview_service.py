from .gemini_service import generate_content_with_retry
from prompts.star_prompts import get_star_optimization_prompt
from prompts.interview_prompts import get_mock_interview_prompt, get_answer_evaluation_prompt
from utils.logger import logger
import json

def get_fallback_star_tips(cv_skills: list = None, jd_skills: list = None) -> list:
    top_skill = cv_skills[0] if cv_skills and len(cv_skills) > 0 else "chuyên môn"
    missing_skill = jd_skills[0] if jd_skills and len(jd_skills) > 0 else "tối ưu quy trình"
    return [
        {
            "group": "Kinh nghiệm",
            "title": f"Lượng hóa thành tựu dự án {top_skill}",
            "detail": "Bổ sung số liệu định lượng (25% hiệu suất, 1,000+ requests) và sử dụng động từ hành động mạnh theo chuẩn STAR.",
            "priority": "high",
            "star_guidance": "Nêu rõ bối cảnh dự án (S), nhiệm vụ (T), hành động cụ thể (A) và kết quả đo lường (R).",
            "example_before": f"Phụ trách tham gia và đóng góp trong các dự án công nghệ liên quan đến {top_skill}.",
            "example_after": f"Chủ trì phát triển và tối ưu hệ thống sử dụng {top_skill}, hỗ trợ xử lý 1,000+ yêu cầu/ngày và nâng cao 25% hiệu suất vận hành."
        },
        {
            "group": "Dự án",
            "title": f"Tối ưu mô tả quy trình {missing_skill}",
            "detail": "Cụ thể hóa thành tựu và thể hiện tinh thần chủ động nâng cao năng lực chuyên môn.",
            "priority": "medium",
            "star_guidance": "Nhấn mạnh vai trò chủ trì và kết quả định lượng về thời gian triển khai.",
            "example_before": f"Phối hợp với các thành viên trong đội ngũ để tìm hiểu về {missing_skill}.",
            "example_after": f"Chủ động nghiên cứu và áp dụng quy trình chuẩn về {missing_skill}, giúp rút ngắn 30% thời gian triển khai mốc dự án."
        }
    ]

def get_fallback_mock_interview(cv_skills: list = None, jd_skills: list = None) -> list:
    top_skill = cv_skills[0] if cv_skills and len(cv_skills) > 0 else "chuyên môn"
    missing_skill = jd_skills[0] if jd_skills and len(jd_skills) > 0 else "xử lý tình huống"
    return [
        {
            "question": f"Hãy trình bày kinh nghiệm thực tế của bạn khi sử dụng {top_skill} để giải quyết một bài toán kinh doanh hoặc kỹ thuật phức tạp?",
            "intention": "Đánh giá khả năng làm chủ kiến thức và tư duy giải quyết vấn đề thực tế của ứng viên.",
            "star_guide": "Nêu rõ bối cảnh bài toán (S), mục tiêu ngắn/dài hạn (T), giải pháp bạn trực tiếp thiết kế (A) và kết quả đo lường được (R).",
            "best_answer": f"Tham khảo lộ trình và tài liệu ôn luyện chi tiết tại [Hướng dẫn ôn tập {top_skill} chuyên sâu](https://google.com/search?q=phong+van+{top_skill})"
        },
        {
            "question": f"Vị trí này ưu tiên kỹ năng {missing_skill}. Bạn đã có kế hoạch gì để làm chủ hoặc trau dồi kỹ năng này?",
            "intention": "Kiểm tra mức độ thích ứng, tinh thần chủ động học hỏi và sự chuẩn bị kỹ lưỡng của ứng viên.",
            "star_guide": "Thể hiện tư duy cởi mở, đưa ra danh sách tài liệu/khóa học đang tự ôn luyện và mục tiêu áp dụng ngắn hạn.",
            "best_answer": f"Xem các hướng dẫn tự học hữu ích tại [Tài liệu học tập & thực hành {missing_skill}](https://google.com/search?q=tu+hoc+{missing_skill})"
        },
        {
            "question": "Mô tả một lần bạn đối mặt với áp lực tiến độ hoặc sự cố đột xuất trong dự án và cách bạn cùng đồng đội vượt qua?",
            "intention": "Đánh giá kỹ năng làm việc nhóm, khả năng quản trị rủi ro và chịu áp lực công việc.",
            "star_guide": "Tập trung thể hiện sự bình tĩnh, phân tích nguyên nhân gốc rễ (Root Cause) và các bước phối hợp giải quyết.",
            "best_answer": "Tham khảo gợi ý bài mẫu tại [Phương pháp trả lời phỏng vấn tình huống chịu áp lực](https://google.com/search?q=tra+loi+phong+van+chiu+ap+luc)"
        }
    ]

def generate_cv_star_tips(cv_text: str, jd_text: str, cv_skills: list = None, jd_skills: list = None) -> list:
    """
    Tao cac goi y toi uu hoa CV theo chuan STAR
    """
    cv_skills_text = ", ".join(cv_skills) if cv_skills else "Chua trich xuat duoc"
    jd_skills_text = ", ".join(jd_skills) if jd_skills else "Chua trich xuat duoc"

    prompt = get_star_optimization_prompt(jd_text, jd_skills_text, cv_text, cv_skills_text)
    try:
        response_text = generate_content_with_retry(prompt)
        result = json.loads(response_text)
        if isinstance(result, list) and len(result) > 0:
            return result
    except Exception as e:
        logger.error(f"Loi generate_cv_star_tips: {e}")
    
    return get_fallback_star_tips(cv_skills, jd_skills)

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
            "strengths": result.get("strengths", "Chua ro diem manh."),
            "weaknesses": result.get("weaknesses", "Chua ro diem yeu."),
            "suggestions": result.get("suggestions", "Can cu the hoa so lieu."),
            "improved_answer": result.get("improved_answer", "Khong co goi y cau tra loi mau.")
        }
    except Exception as e:
        logger.error(f"Loi evaluate_interview_answer: {e}")
        return {
            "status": "error",
            "message": f"Loi ket noi AI khi cham diem phong van: {str(e)}"
        }
