import PyPDF2
import re
import os

def extract_text_from_pdf(file_path):
    """
    Hàm đọc file PDF chuẩn và trả về văn bản dạng text thô.
    """
    if not os.path.exists(file_path):
        return "Lỗi: Không tìm thấy file CV. Vui lòng kiểm tra lại đường dẫn."

    extracted_text = ""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            for page in pdf_reader.pages: 
                text = page.extract_text() 
                if text:
                    extracted_text += text + "\n" 
        
        cleaned_text = re.sub(r'\s+', ' ', extracted_text).strip()
        
        return cleaned_text

    except Exception as e:
        return f"Đã xảy ra lỗi trong quá trình đọc PDF: {e}"

if __name__ == "__main__":
    sample_cv = "cv_test.pdf" 
    
    print(f"Hệ thống đang trích xuất dữ liệu từ: {sample_cv} ...\n")
    
    ket_qua = extract_text_from_pdf(sample_cv)
    
    print("KẾT QUẢ\n")
    print(ket_qua[:1000]) 
    