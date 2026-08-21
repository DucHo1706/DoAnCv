# Báo cáo benchmark thuật toán offline

> Dữ liệu trong báo cáo là dữ liệu hư cấu có cấu trúc. Kết quả chứng minh độ bao phủ và tính nhất quán trên bộ test này, không phải độ chính xác trên thị trường lao động.

## Phạm vi dữ liệu

- 8 ngành, 54 vị trí, 3 cấp bậc.
- 162 JD, 1170 CV dài và 3510 cặp đối sánh.
- CNTT chiếm 46.2% số CV và có 12 vị trí con.
- Mỗi JD được đối sánh với từ 15 đến 40 CV thuộc 5 kịch bản bằng chứng.
- CV ngắn nhất 1791 từ; JD ngắn nhất 993 từ.

| Ngành | Vị trí | JD | CV |
|---|---:|---:|---:|
| Công nghệ thông tin | 12 | 36 | 540 |
| Marketing | 6 | 18 | 90 |
| Nhân sự và Hành chính | 6 | 18 | 90 |
| Tài chính và Kế toán | 6 | 18 | 90 |
| Kinh doanh và Chăm sóc khách hàng | 6 | 18 | 90 |
| Logistics và Chuỗi cung ứng | 6 | 18 | 90 |
| Y tế và Dược | 6 | 18 | 90 |
| Giáo dục và Đào tạo | 6 | 18 | 90 |

## Đối sánh tiêu chí có cấu trúc

| Kịch bản | Số cặp | Điểm nhỏ nhất | Trung bình | Trung vị | P95 | Lớn nhất | P95 thời gian (ms) |
|---|---:|---:|---:|---:|---:|---:|---:|
| strong_same_role | 1170 | 92 | 95.83 | 95.0 | 100.0 | 100 | 2.598 |
| partial_same_domain | 1170 | 41 | 48.81 | 49.0 | 59.0 | 66 | 5.158 |
| negative_cross_domain | 1170 | 18 | 25.93 | 25.0 | 35.0 | 41 | 6.764 |

Thứ tự `cùng vị trí > cùng ngành khác vị trí > trái ngành` đạt 1164/1170 CV.
Các ngoại lệ được giữ trong báo cáo vì kỹ năng chuyển đổi có thể làm một CV trái ngành khớp hơn vai trò liền kề; benchmark không ép điểm để đạt 100% nhân tạo.

## Parser và timeline trên văn bản dài

- Số section nhận diện: nhỏ nhất 9, trung bình 9.0.
- Tỷ lệ kỹ năng fixture được trích xuất trung bình: 100.00%.
- Timeline đúng tổng tháng: 1170/1170; thiếu timeline: 0.

## Apriori và HUIM theo từng ngành

HUIM dùng trọng số hư cấu 1–5 để kiểm tra phép tính; không diễn giải thành độ hiếm, lương hay giá trị thị trường.

| Ngành | Giao dịch | Taxonomy | Luật Apriori | Tập HUIM | Sai số | Thời gian (ms) |
|---|---:|---:|---:|---:|---:|---:|
| Giáo dục và Đào tạo | 90 | 27 | 12 | 212 | 0 | 23.588 |
| Tài chính và Kế toán | 90 | 27 | 12 | 187 | 0 | 21.979 |
| Y tế và Dược | 90 | 27 | 12 | 215 | 0 | 19.531 |
| Nhân sự và Hành chính | 90 | 26 | 28 | 175 | 0 | 18.149 |
| Công nghệ thông tin | 540 | 48 | 12 | 23 | 0 | 295.481 |
| Logistics và Chuỗi cung ứng | 90 | 27 | 12 | 141 | 0 | 20.310 |
| Marketing | 90 | 27 | 12 | 167 | 0 | 17.418 |
| Kinh doanh và Chăm sóc khách hàng | 90 | 27 | 12 | 192 | 0 | 20.906 |

## Điều kiện kiểm tra tự động

| Điều kiện | Kết quả | Giá trị thực tế |
|---|---|---|
| Ít nhất 8 ngành | Đạt | 8 |
| CNTT có ít nhất 12 vị trí | Đạt | 12 |
| CNTT chiếm ít nhất 40% CV | Đạt | 0.4615 |
| Mỗi JD được đối sánh với ít nhất 15 CV | Đạt | 15 |
| Có đủ 5 kịch bản bằng chứng CV | Đạt | 5 |
| Mỗi CV có ít nhất 900 từ | Đạt | 1791 |
| Mỗi JD có ít nhất 800 từ | Đạt | 993 |
| Mỗi CV nhận diện ít nhất 7 section | Đạt | 9 |
| Trích xuất đủ kỹ năng fixture | Đạt | 1.0 |
| Timeline đúng cho toàn bộ CV | Đạt | 1170/1170 |
| Ít nhất 95% CV giữ đúng thứ tự ba kịch bản | Đạt | 0.9949 |
| Apriori/HUIM đúng phép tính và tách domain | Đạt | True |

## Giới hạn diễn giải

- Không có truy cập database, backend hoặc Gemini trong phép chạy này.
- Kịch bản được sinh từ catalog nên chỉ kiểm tra tính đúng nội bộ và khả năng phân biệt domain, không thay cho đánh giá CV thật đã ẩn danh.
- Benchmark OCR/layout nằm ở corpus riêng; phép chạy này tập trung vào nội dung dài, section, timeline, tiêu chí và khai phá kỹ năng.
