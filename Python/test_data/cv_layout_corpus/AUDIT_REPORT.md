# Báo cáo kiểm thử corpus CV đa bố cục

- Số mẫu: 16 (15 CV hợp lệ, 1 tài liệu đối chứng không phải CV)
- Phân loại CV/không phải CV đúng: 16/16
- CV trích xuất sử dụng được: 15/15
- Nhận đúng email: 15/15
- Nhận đúng số điện thoại: 15/15
- Nhận diện được tên ứng viên khi chuẩn hóa dấu OCR: 15/15
- Giữ nguyên chính xác dấu trong tên: 13/15
- Nhận đúng vai trò: 15/15
- Bao phủ chuỗi kỹ năng kỳ vọng trung bình: 100.0%
- Thời gian trung vị: 244.03 ms
- Thời gian lớn nhất: 14650.49 ms

| Mẫu | Kỳ vọng | Phân loại | Mức | Điểm CL | Từ | Email | SĐT | Tên | Vai trò | Skill | Section | Thời gian |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 01_pdf_single_vi.pdf | CV | Đúng | high | 99.9 | 769 | Có | Có | Có | Có | 100.0% | 8 | 383.13 ms |
| 02_pdf_two_columns_vi.pdf | CV | Đúng | high | 99.8 | 787 | Có | Có | Có | Có | 100.0% | 4 | 138.22 ms |
| 03_pdf_multi_page.pdf | CV | Đúng | high | 99.9 | 767 | Có | Có | Có | Có | 100.0% | 8 | 124.92 ms |
| 04_pdf_english.pdf | CV | Đúng | high | 99.9 | 343 | Có | Có | Có | Có | 100.0% | 7 | 81.11 ms |
| 05_pdf_bilingual.pdf | CV | Đúng | high | 99.9 | 1122 | Có | Có | Có | Có | 100.0% | 15 | 349.84 ms |
| 06_pdf_overlap_timeline.pdf | CV | Đúng | high | 99.9 | 764 | Có | Có | Có | Có | 100.0% | 8 | 130.91 ms |
| 07_pdf_custom_heading.pdf | CV | Đúng | high | 99.9 | 783 | Có | Có | Có | Có | 100.0% | 8 | 131.35 ms |
| 08_docx_table.docx | CV | Đúng | high | 100.0 | 781 | Có | Có | Có | Có | 100.0% | 5 | 89.39 ms |
| 09_docx_complex_table.docx | CV | Đúng | high | 100.0 | 825 | Có | Có | Có | Có | 100.0% | 5 | 17.27 ms |
| 10_image_clean.png | CV | Đúng | partial | 99.8 | 763 | Có | Có | Có | Có | 100.0% | 8 | 7101.81 ms |
| 11_image_two_columns.png | CV | Đúng | partial | 99.7 | 773 | Có | Có | Có | Có | 100.0% | 8 | 7453.05 ms |
| 12_image_noisy_rotated.png | CV | Đúng | partial | 99.8 | 772 | Có | Có | Có | Có | 100.0% | 8 | 9266.91 ms |
| 13_pdf_scan_clean.pdf | CV | Đúng | partial | 89.8 | 768 | Có | Có | Có | Có | 100.0% | 6 | 14650.49 ms |
| 14_pdf_dense_compact.pdf | CV | Đúng | high | 99.8 | 3084 | Có | Có | Có | Có | 100.0% | 14 | 640.02 ms |
| 15_docx_english_table.docx | CV | Đúng | high | 100.0 | 825 | Có | Có | Có | Có | 100.0% | 5 | 16.38 ms |
| 16_pdf_not_a_cv.pdf | Không phải CV | Đúng | partial | 66.7 | 93 | N/A | N/A | N/A | N/A | 0% | 0 | 2389.57 ms |

## Mẫu cần xem lại
- Không có mẫu nào thất bại theo ngưỡng smoke test.
