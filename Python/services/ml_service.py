# Tích hợp Machine Learning bằng Scikit-learn tính toán tương đồng Cosine
HAS_SKLEARN = False
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    HAS_SKLEARN = True
except ImportError:
    print("⚠️ Không tìm thấy thư viện scikit-learn. Điểm tương đồng thô mặc định bằng 0.")

def calculate_scikit_similarity(cv_text: str, jd_text: str) -> float:
    """
    Tính tương đồng thô dựa trên tần suất từ khóa TF-IDF giữa CV và JD.
    """
    if not HAS_SKLEARN or not cv_text or not jd_text:
        return 0.0
    try:
        vectorizer = TfidfVectorizer(token_pattern=r'(?u)\b\w+\b')
        tfidf = vectorizer.fit_transform([cv_text, jd_text])
        sim = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
        return float(sim * 100)
    except Exception as e:
        print(f"Lỗi tính tương đồng Scikit-learn trong ml_service: {e}")
        return 0.0
