import PyPDF2
import pytesseract
from PIL import Image
import io
import re

# Đường dẫn đến Tesseract OCR trên Windows (tự động phát hiện hệ điều hành)
import os
if os.name == 'nt':
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


def _is_vietnamese_garbled(text: str) -> bool:
    """
    Kiểm tra xem văn bản tiếng Việt có bị lỗi font/mất dấu hay không.
    Khi PyPDF2 trích xuất sai, các ký tự có dấu bị biến dạng thành
    các ký tự Latin lạ (ví dụ: ệ → é, ứ → ù, ộ → ô, ờ → ơ).

    Nguyên tắc: Văn bản tiếng Việt hợp lệ phải chứa đáng kể các ký tự
    Unicode tiếng Việt đặc trưng (ă, ắ, ằ, ặ, ẵ, ẳ, đ, ơ, ờ, ớ, ợ, ỡ, ở,
    ư, ứ, ừ, ự, ữ, ử, ê, ế, ề, ệ, ễ, ể, ô, ố, ồ, ộ, ỗ, ổ, ...).
    Nếu không tìm thấy đủ ký tự đặc trưng → nghi ngờ bị garbled.
    """
    if not text or len(text) < 50:
        return False

    # Các ký tự Unicode đặc trưng CHỈ có trong tiếng Việt (không có trong tiếng Pháp/BĐN)
    viet_specific_chars = re.findall(
        r'[ăắằặẵẳđĐơờớợỡởưứừựữửêếềệễểôốồộỗổ]',
        text
    )
    # Tỉ lệ ký tự tiếng Việt đặc trưng trên tổng số ký tự chữ cái
    alpha_chars = re.findall(r'[a-zA-ZÀ-ỹ]', text)
    if len(alpha_chars) == 0:
        return False

    ratio = len(viet_specific_chars) / len(alpha_chars)

    # Văn bản tiếng Việt bình thường có tỷ lệ ký tự đặc trưng khoảng 5-15%.
    # Nếu tỉ lệ dưới 1%, gần như chắc chắn bị garbled.
    return ratio < 0.01


def extract_text_from_file(file_bytes: bytes, filename: str, content_type: str) -> str:
    """
    Bóc tách nội dung văn bản từ tệp tin CV tải lên (PDF, Image OCR, DOCX).
    Sử dụng PyPDF2 làm trình trích xuất chính (theo yêu cầu đề cương KLTN).
    Nếu phát hiện PyPDF2 trích xuất sai dấu tiếng Việt, tự động chuyển sang
    pdfplumber làm lớp hỗ trợ bổ sung để đảm bảo chất lượng.
    """
    text = ""
    try:
        # 1. FILE PDF
        if content_type == "application/pdf" or filename.lower().endswith(".pdf"):
            # === Bước 1: Trích xuất bằng PyPDF2 (thành phần chính theo đề cương) ===
            try:
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
                for page in pdf_reader.pages:
                    if page.extract_text():
                        text += page.extract_text() + "\n"
            except Exception as pypdf_err:
                print(f" PyPDF2 gặp lỗi khi đọc PDF ({pypdf_err}). Chuyển sang pdfplumber...")

            # === Bước 2: Kiểm tra chất lượng tiếng Việt hoặc cứu hộ nếu PyPDF2 thất bại ===
            if not text.strip() or _is_vietnamese_garbled(text):
                try:
                    import pdfplumber
                    fallback_text = ""
                    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                        for page in pdf.pages:
                            page_text = page.extract_text()
                            if page_text:
                                fallback_text += page_text + "\n"

                    if fallback_text.strip():
                        if not _is_vietnamese_garbled(fallback_text):
                            print("[QUALITY CHECK] pdfplumber trích xuất tiếng Việt thành công!")
                            text = fallback_text
                        else:
                            print("[QUALITY CHECK] pdfplumber trích xuất có chữ nhưng sai dấu, giữ lại làm dự phòng.")
                            text = fallback_text
                except Exception as plumber_err:
                    print(f" pdfplumber gặp lỗi: {plumber_err}")

            # === Bước 3: Fallback OCR nếu không có text nào ===
            if not text.strip():
                print(" Không trích xuất được text từ PDF (file scan/ảnh/lỗi định dạng), chuyển sang OCR...")
                try:
                    from pdf2image import convert_from_bytes
                    images = convert_from_bytes(file_bytes, dpi=300)
                    ocr_texts = []
                    for img in images:
                        ocr_text = pytesseract.image_to_string(img, lang='vie+eng')
                        if ocr_text:
                            ocr_texts.append(ocr_text)
                    text = "\n".join(ocr_texts)
                except Exception as ocr_err:
                    print(f"Lỗi OCR PDF: {ocr_err}")

        # 2. FILE ẢNH (PNG, JPEG, Screenshot)
        elif content_type in ["image/png", "image/jpeg", "image/jpg", "image/webp"] or filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
            try:
                image = Image.open(io.BytesIO(file_bytes))
                text = pytesseract.image_to_string(image, lang='vie+eng')
            except Exception as tesseract_err:
                print(f" PyTesseract gặp lỗi khi đọc ảnh: {tesseract_err}")
                text = ""

            # Nếu PyTesseract bị thiếu/lỗi hoặc không trích xuất đủ văn bản, sử dụng Gemini Vision OCR
            if not text.strip() or len(text.strip()) < 30:
                print(" [OCR FALLBACK] Trích xuất bằng PyTesseract ít chữ/thất bại, chuyển sang Gemini Vision Multimodal...")
                try:
                    from services import gemini_service
                    prompt = (
                        "Bạn là hệ thống trích xuất OCR CV chuyên nghiệp. Hãy đọc và trích xuất toàn bộ văn bản "
                        "(kỹ năng, kinh nghiệm làm việc, học vấn, chứng chỉ, thông tin liên hệ, mục tiêu nghề nghiệp) "
                        "từ bức ảnh CV này thành dạng văn bản thuần túy tiếng Việt, giữ nguyên đầy đủ nội dung."
                    )
                    vision_text = gemini_service.generate_vision_content_with_retry(
                        image_bytes=file_bytes,
                        mime_type=content_type,
                        prompt=prompt
                    )
                    if vision_text.strip():
                        print(" [OCR FALLBACK] Gemini Vision đã bóc tách văn bản thành công từ ảnh CV!")
                        text = vision_text
                except Exception as vision_err:
                    print(f" Gemini Vision OCR gặp lỗi: {vision_err}")

        # 3. FILE WORD .docx
        elif filename.lower().endswith(".docx"):
            import zipfile
            import xml.etree.ElementTree as ET
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as docx:
                xml_content = docx.read('word/document.xml')
                root = ET.fromstring(xml_content)
                ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                paragraphs = []
                for p in root.findall('.//w:p', ns):
                    texts = [t.text for t in p.findall('.//w:t', ns) if t.text]
                    if texts:
                        paragraphs.append("".join(texts))
                text = "\n".join(paragraphs)

    except Exception as e:
        print(f"Lỗi bóc tách văn bản trong doc_parser_service: {e}")
    return text.strip()
