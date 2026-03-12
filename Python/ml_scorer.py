# Import thư viện Embeddings xịn xò nhưng dễ dùng
from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer('all-MiniLM-L6-v2')

def calculate_resume_score(cv_text, jd_text, cv_skills, jd_skills):

    embedding_cv = model.encode(cv_text, convert_to_tensor=True)
    embedding_jd = model.encode(jd_text, convert_to_tensor=True)

    cosine_score = util.cos_sim(embedding_cv, embedding_jd).item()

    if cosine_score < 0:
        cosine_score = 0
    text_score = round(cosine_score * 100, 2)

    cv_set = set([s.lower() for s in cv_skills])
    jd_set = set([s.lower() for s in jd_skills])

    matched_skills = list(cv_set.intersection(jd_set))
    missing_skills = list(jd_set.difference(cv_set))

    if len(jd_set) > 0:
        skill_score = (len(matched_skills) / len(jd_set)) * 100
    else:
        skill_score = 0
    final_score = round((text_score * 0.4) + (skill_score * 0.6), 2)

    if len(jd_skills) == 0:
        explanation = "Không tìm thấy kỹ năng chuyên môn nào trong mô tả công việc (JD) để so sánh."
    elif missing_skills:
        explanation = f"AI nhận thấy ứng viên phù hợp về mặt ngữ nghĩa, nhưng thiếu các từ khóa kỹ năng cụ thể: [{', '.join(missing_skills)}]."
    else:
        explanation = "Tuyệt vời! Ứng viên đáp ứng đầy đủ yêu cầu cả về mặt ngữ nghĩa lẫn kỹ năng."

    return {
        "score": final_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "explanation": explanation
    }
if __name__ == "__main__":
    print("\n--- BẮT ĐẦU TEST MODEL EMBEDDINGS ---")
    
    sample_cv_text = "Lập trình viên Fullstack. Kinh nghiệm làm việc với Py, viết script JS và deploy hệ thống lên AWS."
    sample_cv_skills = ["Py", "JS", "AWS"]

    sample_jd_text = "Tuyển dụng kỹ sư phần mềm thành thạo ngôn ngữ Python, JavaScript. Yêu cầu có chứng chỉ Amazon Web Services."
    sample_jd_skills = ["Python", "JavaScript", "Amazon Web Services"]

    print(f" CV: {sample_cv_text}")
    print(f" JD: {sample_jd_text}")
    print("-" * 30)
    print("AI đang đọc hiểu ngữ nghĩa...")
    
    # Gọi hàm chấm điểm
    ket_qua = calculate_resume_score(sample_cv_text, sample_jd_text, sample_cv_skills, sample_jd_skills)

    print(f" Điểm phù hợp: {ket_qua['score']}/100")
    print(f" Kỹ năng khớp: {ket_qua['matched_skills']}")
    print(f" AI Giải thích: {ket_qua['explanation']}")
