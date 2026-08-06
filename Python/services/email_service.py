from .gemini_service import generate_content_with_retry
from prompts.email_prompts import get_email_generation_prompt
from utils.logger import logger
import json

def generate_candidate_email(
    email_type,
    candidate_name,
    job_title,
    company_name,
    fit_score,
    classification,
    summary,
    matched_skills,
    missing_skills,
    reject_reason=None,
    email_context=""
):
    """
    Soan thao email phan hoi ung vien tu dong
    """
    if company_name is None or str(company_name).strip() == "":
        company_name = "AI Recruitment"

    if summary is None: summary = ""
    if matched_skills is None: matched_skills = []
    if missing_skills is None: missing_skills = []
    if email_context is None: email_context = ""

    # Lay phan summary thuc te neu la chuoi JSON tu /score-cv
    raw_summary = summary
    if summary and str(summary).strip().startswith('{'):
        try:
            parsed = json.loads(summary)
            if "score_analysis" in parsed:
                raw_summary = parsed["score_analysis"].get("summary", "")
            elif "summary" in parsed:
                raw_summary = parsed.get("summary", "")
        except Exception:
            pass

    email_type = str(email_type).strip().lower()
    email_context_text = str(email_context).strip()
    is_talent_pool_invite = (
        email_type == "invite"
        and "talent pool" in email_context_text.lower()
    )

    matched_skills_text = ", ".join(matched_skills)
    missing_skills_text = ", ".join(missing_skills)

    if email_type == "invite":
        if is_talent_pool_invite:
            task_instruction = f"""
Nhiệm vụ: Viết email CHỦ ĐỘNG mời ứng viên trong Talent Pool/Ngân hàng ứng viên cân nhắc ứng tuyển vào vị trí phù hợp.
Bối cảnh nghiệp vụ:
- Đây KHÔNG phải email phản hồi cho một hồ sơ ứng tuyển mới.
- Ứng viên đang nằm trong Talent Pool/Ngân hàng ứng viên của doanh nghiệp.
- HR chủ động liên hệ lại vì hệ thống nhận thấy hồ sơ/kỹ năng của ứng viên có thể phù hợp với vị trí đang mở.
- Bối cảnh truyền từ hệ thống: {email_context_text}

Tuyệt đối tránh các câu hoặc ý sau:
- "Cảm ơn bạn đã ứng tuyển..."
- "Chúc mừng bạn đã vượt qua vòng sơ loại CV..."
- "Mời bạn tham gia vòng phỏng vấn tiếp theo..." nếu HR chưa nhập lịch phỏng vấn cụ thể.

[YÊU CẦU VỀ NỘI DUNG VÀ VĂN PHONG]
1. Xưng hô: TUYỆT ĐỐI chỉ sử dụng đại từ "bạn", viết hoa nếu đứng đầu câu.
2. Mở đầu: Nhắc rằng công ty đã lưu hồ sơ của bạn trong Talent Pool/Ngân hàng ứng viên.
3. Nêu rằng hiện công ty có vị trí {job_title} đang mở và nhận thấy hồ sơ của bạn có điểm phù hợp.
4. Ghi nhận năng lực: Khen ngợi một cách tự nhiên dựa trên kỹ năng phù hợp đã được cung cấp.
5. Lời mời: Mời bạn cân nhắc cơ hội này hoặc phản hồi email nếu quan tâm.
6. Không đưa lịch phỏng vấn nếu HR chưa nhập lịch.
7. Kết thư: Hướng dẫn ứng viên phản hồi email để HR trao đổi thêm về công việc và quy trình tuyển dụng.
"""
        else:
            task_instruction = """
Nhiệm vụ: Viết email mời ứng viên tham gia vòng phỏng vấn tiếp theo.
Email cần thể hiện rằng công ty đánh giá tích cực hồ sơ của ứng viên.

Bắt buộc trong email mời phỏng vấn phải có một đoạn để placeholder thông tin phỏng vấn với format gần như sau:
Thông tin phỏng vấn dự kiến:
- Thời gian: [Điền thời gian]
- Hình thức: [Điền hình thức: trực tuyến/trực tiếp]
- Địa điểm: [Điền địa điểm/link họp]

[YÊU CẦU VỀ NỘI DUNG VÀ VĂN PHONG]
1. Xưng hô: TUYỆT ĐỐI chỉ sử dụng đại từ "bạn", viết hoa nếu đứng đầu câu.
2. Mở đầu: Cảm ơn bạn đã ứng tuyển vào vị trí được cung cấp trong phần thông tin ứng viên tại AI Recruitment.
3. Ghi nhận năng lực: Khen ngợi một cách tự nhiên dựa trên các kỹ năng phù hợp đã được cung cấp.
4. Lời mời: Trân trọng mời bạn tham gia vòng phỏng vấn tiếp theo.
5. Cấu trúc thông tin phỏng vấn: Trình bày rõ ràng dưới dạng Bullet points các mục: Thời gian, Hình thức, Địa điểm (để trống ngoặc vuông [Điền...] cho HR tự nhập).
6. Kết thư: Hướng dẫn ứng viên phản hồi email để xác nhận tham gia. Lời chào trân trọng từ Phòng Tuyển dụng.
"""
    else:
        task_instruction = f"""
Nhiệm vụ: Viết email từ chối ứng viên một cách chuyên nghiệp, lịch sự và thấu cảm.
Lý do từ chối HR cung cấp: {reject_reason}

Lưu ý quan trọng:
- Xưng hô: TUYỆT ĐỐI chỉ sử dụng đại từ "bạn", viết hoa nếu đứng đầu câu.
- Nếu ứng viên có điểm cao, tuyệt đối không viết rằng ứng viên yếu hoặc không đủ năng lực.
- Phải diễn đạt khéo léo, tránh gây cảm giác phủ nhận năng lực ứng viên.
- Nếu lý do là đã tuyển đủ người, hãy nhấn mạnh đây là yếu tố thời điểm/chỉ tiêu tuyển dụng, không phải vì năng lực ứng viên không đạt.
"""

    prompt = get_email_generation_prompt(
        candidate_name=candidate_name,
        job_title=job_title,
        company_name=company_name,
        fit_score=fit_score,
        classification=classification,
        raw_summary=raw_summary,
        email_context_text=email_context_text,
        matched_skills_text=matched_skills_text,
        missing_skills_text=missing_skills_text,
        email_type=email_type,
        task_instruction=task_instruction
    )

    try:
        # Email is an assistive feature and already has a deterministic fallback.
        # Trying every configured model/key can exceed the backend HTTP timeout,
        # so prefer one fast model and fall back to the editable template on error.
        response_text = generate_content_with_retry(
            prompt,
            models=["gemini-2.5-flash-lite"]
        )
        result = json.loads(response_text)

        subject = result.get("subject", "")
        body = result.get("body", "")

        if not isinstance(subject, str) or subject.strip() == "":
            if is_talent_pool_invite:
                subject = f"[{company_name}] Loi moi ung tuyen vi tri {job_title}"
            else:
                subject = f"[{company_name}] Ket qua ung tuyen vi tri {job_title}"

        if not isinstance(body, str) or body.strip() == "":
            body = build_default_email_body(
                email_type,
                candidate_name,
                job_title,
                reject_reason,
                email_context
            )

        return {
            "subject": subject.strip(),
            "body": body.strip()
        }

    except Exception as exception:
        logger.error(f"Loi AI generate email: {exception}")

        if is_talent_pool_invite:
            fallback_subject = f"[{company_name}] Loi moi ung tuyen vi tri {job_title}"
        else:
            fallback_subject = f"[{company_name}] Ket qua ung tuyen vi tri {job_title}"

        return {
            "subject": fallback_subject,
            "body": build_default_email_body(
                email_type,
                candidate_name,
                job_title,
                reject_reason,
                email_context
            )
        }

def build_default_email_body(email_type, candidate_name, job_title, reject_reason=None, email_context=""):
    if email_type == "invite":
        email_context_text = "" if email_context is None else str(email_context)
        is_talent_pool_invite = "talent pool" in email_context_text.lower()

        if is_talent_pool_invite:
            return f"""
<p>Chào {candidate_name},</p>
<p>
Phòng Nhân sự AI Recruitment đang lưu hồ sơ của bạn trong Ngân hàng ứng viên/Talent Pool.
Hiện tại, chúng tôi có vị trí <strong>{job_title}</strong> đang mở và nhận thấy hồ sơ của bạn có thể phù hợp với nhu cầu tuyển dụng lần này.
</p>
<p>
Chúng tôi trân trọng mời bạn cân nhắc cơ hội này. Nếu bạn quan tâm, vui lòng phản hồi email để chúng tôi có thể trao đổi thêm về mô tả công việc, quy trình tuyển dụng và các thông tin liên quan.
</p>
<p>
Rất mong nhận được phản hồi từ bạn.
</p>
<p>
Trân trọng,<br/>
Phòng Nhân sự<br/>
AI Recruitment
</p>
"""
        return f"""
<p>Chào {candidate_name},</p>
<p>
Chúc mừng bạn đã vượt qua vòng sơ loại CV cho vị trí
<strong>{job_title}</strong>.
</p>
<p> 
Chúng tôi rất ấn tượng với hồ sơ của bạn và muốn mời bạn tham gia buổi phỏng vấn
<p>Thông tin phỏng vấn dự kiến:</p>
<ul>
  <li><strong>Thời gian:</strong> [Điền thời gian]</li>
  <li><strong>Hình thức:</strong> [Điền hình thức: trực tuyến/trực tiếp]</li>
  <li><strong>Địa điểm:</strong> [Điền địa điểm/link họp]</li>
</ul>
</p>
<p>Vui lòng phản hồi email này để xác nhận sự tham gia của bạn.</p>
<p>
Trân trọng,<br/>
Phòng Nhân sự<br/>
AI Recruitment
</p>
"""

    if reject_reason is None or str(reject_reason).strip() == "":
        reject_reason = "hồ sơ hiện chưa phù hợp với định hướng tuyển dụng ở thời điểm này"

    return f"""
<p>Chào {candidate_name},</p>
<p>
Cảm ơn bạn đã quan tâm và ứng tuyển vào vị trí
<strong>{job_title}</strong>.
</p>
<p>
Sau khi xem xét kỹ lưỡng, chúng tôi rất tiếc chưa thể tiếp tục đồng hành cùng bạn
trong đợt tuyển dụng này. Lý do chính là: {reject_reason}.
</p>
<p>
Chúng tôi vẫn rất trân trọng sự quan tâm của bạn và sẽ lưu hồ sơ để xem xét cho các cơ hội
phù hợp hơn trong tương lai.
</p>
<p>
Trân trọng,<br/>
Phòng Nhân sự<br/>
AI Recruitment
</p>
"""
