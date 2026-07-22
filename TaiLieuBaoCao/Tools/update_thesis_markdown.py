import os

def update_markdown(md_path):
    print(f"Loading {md_path}...")
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Locate Chapter 2 and Bibliography start/end
    ch2_start = -1
    ch3_start = -1
    bib_start = -1

    for idx, line in enumerate(lines):
        stripped = line.strip()
        if stripped == "# CƠ SỞ LÝ THUYẾT VÀ NGUYÊN CỨU":
            ch2_start = idx
        elif stripped == "# PHÂN TÍCH THIẾT KẾ ỨNG DỤNG":
            ch3_start = idx
        elif stripped == "# TÀI LIỆU THAM KHẢO":
            bib_start = idx

    if ch2_start == -1 or ch3_start == -1 or bib_start == -1:
        print(f"Error: Could not locate headers in markdown. ch2={ch2_start}, ch3={ch3_start}, bib={bib_start}")
        return False

    print(f"Chapter 2 lines: {ch2_start} to {ch3_start}")
    print(f"Bibliography starts at line: {bib_start}")

    # Build the new Chapter 2 text
    new_chapter_2 = """# CƠ SỞ LÝ THUYẾT VÀ NGUYÊN CỨU

Hệ thống đánh giá hồ sơ ứng viên bằng Trí tuệ Nhân tạo không thể tự hoạt động hiệu quả nếu thiếu đi bộ khung quy tắc tri thức vững chắc làm nền tảng hệ quy chiếu. Các đánh giá, phân tích và phản hồi của hệ thống được xây dựng dựa trên sự đan xen giữa khoa học quản trị nguồn nhân lực, kỹ thuật xử lý văn bản AI, các thuật toán khai phá dữ liệu học máy chuyên sâu và hệ sinh thái công nghệ hiện đại.

## 2.1 Các Mô hình và Tiêu chuẩn Quản trị Nhân sự Hiện đại

Để hệ thống Trí tuệ Nhân tạo có thể thay thế con người trong việc ra quyết định sàng lọc hồ sơ, bước đầu tiên và quan trọng nhất là phải số hóa các tiêu chuẩn đánh giá của con người thành các quy tắc (rules) và hệ quy chiếu (frameworks) có thể lập trình được. Hệ thống AI Recruitment được xây dựng dựa trên sự tích hợp của 4 mô hình quản trị nhân sự kinh điển đang được áp dụng tại các tập đoàn đa quốc gia.

### 2.1.1 Mô hình Năng lực ASK (Attitude - Skills - Knowledge)

Mô hình ASK (hay còn gọi là KSA) là một trong những nền tảng lý thuyết quản trị nhân sự phổ biến nhất thế giới, được phát triển dựa trên Thang đo nhận thức của Benjamin Bloom (1956) và sau đó được McClelland (1973) chuẩn hóa. Mô hình này khẳng định rằng năng lực toàn diện của một cá nhân để hoàn thành xuất sắc một công việc phải được cấu thành từ ba yếu tố giao thoa:

- **Kiến thức (Knowledge - K):** Thuộc về năng lực tư duy (Cognitive). Đây là sự hiểu biết về lý thuyết, các quy luật, nguyên lý và kiến thức chuyên môn đặc thù mà ứng viên tích lũy được qua quá trình đào tạo chính quy hoặc tự nghiên cứu (ví dụ: cấu trúc dữ liệu, nguyên lý hệ điều hành).
- **Kỹ năng (Skills - S):** Thuộc về năng lực thao tác (Psychomotor). Là khả năng chuyển hóa kiến thức thành hành động thực tế để giải quyết một nhiệm vụ cụ thể một cách thuần thục, được đo lường bằng số năm kinh nghiệm hoặc các dự án đã thực thi (ví dụ: lập trình ReactJS, thiết kế cơ sở dữ liệu).
- **Thái độ (Attitude - A):** Thuộc về năng lực cảm xúc (Affective). Bao gồm phẩm chất cá nhân, đạo đức nghề nghiệp, trí tuệ cảm xúc (EQ), động lực làm việc và mức độ phù hợp với văn hóa cốt lõi của tổ chức.

Trong quy trình tuyển dụng truyền thống, việc đánh giá mô hình ASK thường dựa vào cảm quan chủ quan của chuyên viên nhân sự dẫn đến đánh giá sai lệch. Để khắc phục hạn chế này, hệ thống AI Recruitment tiến hành số hóa mô hình ASK thành lõi đánh giá kỹ thuật thông qua hai bước:
1. **Cấu hình tiêu chí (JobCriteria):** Hệ thống cho phép nhà tuyển dụng (HR) khi tạo tin tuyển dụng có thể phân rã các yêu cầu công việc thành các tiêu chí cụ thể thuộc 3 nhóm A, S, K và gán trọng số phần trăm tương ứng, đảm bảo tính linh hoạt cho từng cấp bậc vị trí.
2. **Trích xuất và Đối sánh tự động:** Khi nhận được tài liệu hồ sơ (CV), hệ thống sẽ gửi yêu cầu phân tích ngữ nghĩa sâu đến mô hình ngôn ngữ lớn (LLM). AI thực hiện bóc tách nội dung CV thành ba mảng thông tin tương ứng với A, S, K và tiến hành đối chiếu chéo với bộ tiêu chí của JD để đưa ra điểm số định lượng tương ứng.

Sơ đồ biểu diễn mối liên kết hữu cơ và sự giao thoa tạo nên năng lực toàn diện của ứng viên theo mô hình ASK được minh họa cụ thể trong Hình 2.1.

Hình 2.1: Sơ đồ biểu diễn sự giao thoa của ba yếu tố trong mô hình ASK

### 2.1.2 Các dấu hiệu cảnh báo (Red Flags) theo chuẩn SHRM

Theo các chuẩn mực sàng lọc hồ sơ do Hiệp hội Quản trị Nguồn nhân lực Quốc tế (SHRM) khuyến nghị, việc phát hiện sớm các dấu hiệu rủi ro (Red Flags) trong CV đóng vai trò quyết định giúp doanh nghiệp tối ưu hóa chi phí vận hành tuyển dụng và tránh các ứng viên thiếu trung thực.

Hệ thống AI Recruitment được thiết lập đóng vai trò như một chuyên gia kiểm soát rủi ro nhân sự, ứng dụng các mô hình ngôn ngữ tự nhiên để tự động rà soát, nhận diện và phân loại mức độ nghiêm trọng của 4 nhóm lỗi "cảnh báo đỏ" điển hình. Chi tiết về cách nhận diện, phân loại mức độ nghiêm trọng và hành động xử lý tự động của AI đối với các lỗi cảnh báo được tổng hợp chi tiết trong Bảng 2.1.

Bảng 2.1: Phân loại các lỗi Cảnh báo đỏ (Red Flags) trong hệ thống AI Recruitment

| Mã cảnh báo (Warning Code) | Tên lỗi cảnh báo | Dấu hiệu nhận biết trong CV | Mức độ nghiêm trọng | Hành động của AI trong Hệ thống |
| :--- | :--- | :--- | :---: | :--- |
| **KEYWORD_STUFFING** | Nhồi nhét từ khóa | Khai báo hàng loạt từ khóa kỹ năng công nghệ ở phần tóm tắt nhưng không có dự án thực tế nào chứng minh trong lịch sử làm việc. | **Cao (High)** | Đánh dấu lỗi trên giao diện HR; đề xuất ứng viên bổ sung các dự án thực tiễn minh chứng cho kỹ năng. |
| **CHRONOLOGY_GAP** | Đứt gãy dòng thời gian | Khoảng trống thời gian trống trải giữa hai mốc công việc liên tiếp kéo dài trên 6 tháng mà không có lý do giải trình. | **Trung bình (Medium)** | Ghi nhận mốc thời gian; tự động sinh câu hỏi phỏng vấn đào sâu lý do đứt gãy để HR chất vấn. |
| **GENERIC_CV** | Hồ sơ chung chung | Sử dụng văn phong sáo rỗng, mô tả nhiệm vụ công việc rập khuôn sao chép từ JD mẫu trực tuyến, thiếu chi tiết thực tế. | **Thấp (Low)** | Đưa ra khuyến nghị trên màn hình Candidate hướng dẫn cá nhân hóa và làm sâu sắc nội dung CV. |
| **MISSING_METRICS** | Thiếu chỉ số hiệu suất | Các thành tựu đạt được chỉ được mô tả định tính chung chung (ví dụ: "giúp tăng doanh thu") thay vì có số liệu định lượng cụ thể. | **Trung bình (Medium)** | Kích hoạt phân hệ gợi ý STAR; hướng dẫn ứng viên viết lại câu kinh nghiệm bằng cách lượng hóa kết quả. |

### 2.1.3 Phương pháp STAR và Kỹ thuật Phỏng vấn Hành vi BEI

Phương pháp STAR được phát triển bởi tổ chức DDI và được văn phòng hướng nghiệp Đại học Harvard đặc biệt khuyên dùng để lượng hóa hồ sơ năng lực. STAR đại diện cho cấu trúc: Situation (Bối cảnh/Thách thức), Task (Nhiệm vụ mục tiêu), Action (Hành động thực tế đã làm bằng động từ mạnh), và Result (Kết quả định lượng).

Kỹ thuật Phỏng vấn Sự kiện Hành vi (BEI) được David McClelland giới thiệu vào những năm 1970 với triết lý: "Hành vi và hiệu suất thực tế trong quá khứ là biến số dự báo chính xác nhất cho hành vi trong tương lai". 

Hệ thống AI Recruitment ứng dụng hai kỹ thuật này làm cầu nối hai chiều:
- **Phía ứng viên:** AI đọc nội dung kinh nghiệm làm việc, phân tích xem có đủ cấu trúc 4 phần của STAR không, cảnh báo phần bị thiếu và tự động đề xuất câu viết lại chuyên nghiệp theo chuẩn định lượng.
- **Phía nhà tuyển dụng:** AI tự động đọc CV, phát hiện các dự án nổi bật của ứng viên và sinh ra bộ kịch bản câu hỏi phỏng vấn hành vi BEI bám sát vào đúng mốc thời gian, công nghệ ứng viên tự khai để HR đối chất năng lực.

### 2.1.4 Tính Đa dạng, Công bằng, Hòa nhập (DEI) và Đạo luật Trí tuệ nhân tạo

DEI (Diversity, Equity, Inclusion) là tiêu chuẩn bắt buộc của các doanh nghiệp toàn cầu nhằm loại bỏ thiên kiến vô thức (Unconscious Bias) về giới tính, tuổi tác, vùng miền. Dưới góc độ pháp lý, Luật Trí tuệ Nhân tạo Việt Nam (thông qua đầu năm 2026) xếp các hệ thống AI phân loại và tuyển dụng nhân sự vào nhóm "Rủi ro cao", bắt buộc phải đảm bảo tính minh bạch, khả năng giải thích và không phân biệt đối xử.

Hệ thống AI Recruitment giải quyết vấn đề đạo đức AI qua cơ chế ẩn thông tin nhân khẩu học nhạy cảm (Demographic Data Masking). Khi CV được tải lên, hệ thống tự động bóc tách và ẩn đi tên, ảnh, tuổi tác, giới tính, quê quán trước khi chuyển dữ liệu sang cho mô hình ngôn ngữ lớn (Gemini) đánh giá. Bộ Prompt cũng quy định chặt chẽ việc chỉ chấm điểm dựa trên tần suất sử dụng Action Verbs và số liệu hiệu quả công việc, đảm bảo môi trường đánh giá công bằng 100% hướng tới năng lực thực chất.

## 2.2 Cơ sở Kỹ thuật Nhận diện Văn bản AI (AI Text Detection)

Để phát hiện tình trạng ứng viên lạm dụng các công cụ AI tạo sinh (như ChatGPT) viết khống hồ sơ, hệ thống tích hợp giải pháp nhận diện văn bản máy sinh dựa trên hai chỉ số thống kê toán học:

- **Chỉ số Perplexity (Độ bối rối):** Đo lường mức độ khó đoán của một chuỗi từ vựng đối với mô hình ngôn ngữ. Văn bản do AI tạo thường có độ rập khuôn cực cao, khiến thuật toán dễ dàng đoán được từ tiếp theo, dẫn đến Perplexity thấp. Ngược lại, ngôn ngữ con người mang tính dư thừa và phức tạp, dẫn đến Perplexity cao.
  Công thức tính toán: $Perplexity(W) = P(w_1, w_2,..., w_N)^{-1/N} = 2^{H(W)}$
- **Chỉ số Burstiness (Độ bùng nổ):** Đo lường sự biến thiên về cấu trúc câu. Con người viết văn với nhịp điệu tự nhiên, có câu rất dài đan xen câu ngắn (Burstiness cao). AI thường duy trì độ dài câu đều đặn, rập khuôn (Burstiness thấp).
Một bản CV có sự kết hợp của Perplexity thấp và Burstiness thấp sẽ bị thuật toán khoanh vùng và kích hoạt cảnh báo Red Flag nghi ngờ văn bản do máy tạo sinh.

## 2.3 Bảo mật, Tác vụ nền & Truyền tải thời gian thực

Để đáp ứng các yêu cầu phi chức năng về hiệu suất, bảo mật và trải nghiệm người dùng B2B SaaS cao cấp, hệ thống ứng dụng ba nền tảng cơ sở hạ tầng công nghệ lõi:

### 2.3.1 Xác thực không trạng thái JWT (JSON Web Token)

Để quản lý phiên truy cập của hàng ngàn người dùng đồng thời mà không làm quá tải bộ nhớ RAM máy chủ, hệ thống áp dụng cơ chế xác thực không trạng thái sử dụng JSON Web Token (JWT - RFC 7519). 

Mã JWT được cấu thành từ ba phần Header, Payload và Signature mã hóa Base64Url. Sau khi đăng nhập thành công, Server ký token chứa thông tin ID và Role của người dùng gửi về Client. Client sẽ đính kèm token này vào Header Authorization trong mỗi yêu cầu gửi API. Server xác thực tính toàn vẹn của token qua việc kiểm tra chữ ký mà không cần lưu giữ trạng thái session, đảm bảo tính bảo mật và tối ưu hiệu suất.

### 2.3.2 Xử lý tác vụ nền bất đồng bộ (Asynchronous Background Tasks)

Quy trình số hóa và gọi AI đánh giá CV rất tốn tài nguyên và thời gian (từ 1.5 - 5 giây). Nếu thực hiện đồng bộ, yêu cầu HTTP gửi từ Client sẽ bị treo, chặn luồng xử lý chính của máy chủ Web gây ra nghẽn kết nối và dễ dẫn tới lỗi Gateway Timeout.

Do đó, hệ thống triển khai mô hình xử lý nền bất đồng bộ. Khi nhận CV nộp vào, ASP.NET Core Backend ghi nhận hồ sơ với trạng thái "Đang xử lý" và trả ngay về Client mã phản hồi HTTP 202 Accepted. Việc đánh giá CV thực tế được chuyển giao cho luồng xử lý nền (Background Thread) chạy độc lập, giải phóng ngay luồng HTTP chính để máy chủ tiếp tục xử lý các yêu cầu khác.

### 2.3.3 Giao tiếp thời gian thực qua SignalR (Real-time Hub)

Để đồng bộ tiến độ chấm điểm từ tiến trình chạy nền xuống giao diện người dùng mà không cần Polling liên tục gây tải giả cho máy chủ, hệ thống ứng dụng thư viện ASP.NET Core SignalR.

SignalR tự động thiết lập kết nối WebSockets liên tục hai chiều giữa trình duyệt và máy chủ. Trong quá trình tiến trình nền xử lý CV, tại mỗi mốc hoàn thành (bóc tách ➔ TF-IDF ➔ gọi Gemini), Server sẽ gọi Hub truyền trực tiếp tiến độ ($10\% \to 30\% \to 70\% \to 100\%$) và thông điệp cập nhật tức thì lên giao diện React của người dùng thông qua giao thức WebSockets.

## 2.4 Tổng quan Công nghệ và Thư viện phát triển

Hệ thống được thiết kế theo kiến trúc Microservices hiện đại, chia thành ba phân hệ công nghệ cốt lõi:

### 2.4.1 Phân hệ Phân tích AI & Data Mining (Python Backend)

FastAPI (v0.110.0) hỗ trợ lập trình bất đồng bộ tốc độ cao để xây dựng API, kết hợp server Uvicorn và thư viện Python-dotenv.
- Thư viện Số hóa & OCR: PyPDF2 (v3.0.1) đọc luồng văn bản gốc; pdfplumber (v0.11.0) bóc tách cấu trúc đa cột; pdf2image chuyển đổi PDF sang ảnh 300 DPI; Pillow xử lý ảnh; và pytesseract để nhận dạng quang học song ngữ Anh - Việt.
- Thư viện NLP: SpaCy (en_core_web_sm) và biểu thức chính quy Regex trích xuất thực thể, lọc Email, Số điện thoại và so khớp kỹ năng.
- Thư viện Machine Learning: Scikit-learn với TfidfVectorizer và cosine_similarity đo lường khoảng cách vectơ đặc trưng; Numpy hỗ trợ tính toán ma trận.
- AI tạo sinh: SDK google-genai kết nối với Google Gemini API (gemini-3.5-flash).

### 2.4.2 Phân hệ Dịch vụ Máy chủ (C# ASP.NET Core Backend)

ASP.NET Core Web API (.NET 8.0) xây dựng hệ thống RESTful API cho ứng dụng B2B SaaS.
- ORM & Database: Microsoft.EntityFrameworkCore.SqlServer kết nối SQL Server, hỗ trợ Code-First Migrations.
- Bảo mật & Truyền thông: Microsoft.AspNetCore.Authentication.JwtBearer xác thực JWT; Microsoft.AspNetCore.SignalR hỗ trợ giao tiếp WebSockets.
- Thư viện bên thứ ba: CloudinaryDotNet lưu trữ CV đám mây và Swashbuckle.AspNetCore tạo tài liệu Swagger UI tự động.

### 2.4.3 Phân hệ Giao diện Người dùng (React TypeScript Frontend)

React (v19.2.0), ngôn ngữ kiểm soát kiểu TypeScript, và công cụ đóng gói Vite.
- UI & Trực quan hóa: Ant Design cung cấp các Component UI doanh nghiệp; @ant-design/plots vẽ biểu đồ mạng lưới tương tác cho thuật toán HUIM và Apriori.
- Giao tiếp mạng: Axios gọi API bất đồng bộ và @microsoft/signalr duy trì kết nối WebSocket thời gian thực.
- Xuất báo cáo PDF: jspdf, html2canvas để xuất kết quả đánh giá CV và STAR sang tệp PDF cục bộ.

## 2.5 Bản đồ tích hợp Thư viện Công nghệ và Cơ sở Lý thuyết trong Hệ thống

### 2.5.1 Giải pháp số hóa hồ sơ và kỹ thuật cứu hộ OCR

Quy trình nhận dạng ký tự quang học (OCR) và bóc tách tài liệu số hóa hoạt động dựa trên việc xử lý dữ liệu nhị phân để trích xuất nội dung văn bản thô. Đối với tệp PDF, quá trình phân tích luồng có thể gặp lỗi mất dấu tiếng Việt do thiếu hụt bảng bản đồ ký tự CMap.

Khi lỗi xảy ra, hệ thống tự động kiểm tra chất lượng văn bản thông qua tỷ lệ ký tự tiếng Việt đặc trưng:
$R = \frac{\text{Tổng số ký tự tiếng Việt đặc trưng}}{\text{Tổng số ký tự chữ cái}}$

Nếu hệ số kiểm tra $R < 0.01$, văn bản bị đánh giá lỗi phông. Thuật toán cứu hộ thực thi logic sau:
- Bước 1: Trích xuất sơ cấp bằng PyPDF2.
- Bước 2: Nếu $R < 0.01$, kích hoạt pdfplumber phân tích tọa độ đồ họa để cứu phông chữ.
- Bước 3: Nếu văn bản vẫn lỗi, chuyển đổi PDF sang ảnh 300 DPI, áp dụng bộ lọc Grayscale và binarization bằng Pillow để khử nhiễu, sau đó dùng pytesseract OCR song ngữ để bóc tách lại văn bản.

### 2.5.2 Xử lý ngôn ngữ tự nhiên và trích xuất thực thể (NER)

Nhận dạng thực thể xác định vị trí và gán nhãn các đối tượng trong văn bản (email, số điện thoại, kỹ năng). Để tránh sự trùng khớp bộ phận (ví dụ: tìm "C" sẽ khớp nhầm "C++", "C#"), lý thuyết ranh giới từ (Word Boundary) trong biểu thức chính quy được áp dụng (ký hiệu `\b` hoặc `\W`).

Hệ thống kết hợp SpaCy và Regular Expressions để trích xuất:
- Lọc Email: Áp dụng mẫu Regex: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`
- Lọc Số điện thoại: Loại bỏ khoảng trắng/dấu, sau đó khớp chuỗi chuẩn: `(?:\+84|0)(?:3|5|7|8|9)\d{8}\b`
- So khớp kỹ năng: Tải từ điển kỹ năng, bọc từ khóa bằng ranh giới từ để tránh khớp đè: `(?:^|\W) + Escape(Skill) + (?:$|\W)`

### 2.5.3 Đo lường tương đồng từ khóa thô bằng Scikit-learn

TF-IDF phản ánh mức độ quan trọng của từ đối với tài liệu:
- $TF(t, d) = \frac{\text{Số lần xuất hiện của t trong d}}{\text{Tổng số từ của d}}$
- $IDF(t, D) = \log\left(\frac{\text{Tổng số tài liệu trong D}}{\text{Số tài liệu chứa từ t}}\right)$
- Trọng số $TFIDF = TF \times IDF$
Đo lường Cosine Similarity tính góc lệch giữa hai vectơ đặc trưng của CV (A) và JD (B):
- $CosineSimilarity(A, B) = \frac{A \cdot B}{\|A\| \|B\|} = \frac{\sum A_i B_i}{\sqrt{\sum A_i^2} \sqrt{\sum B_i^2}}$

Hệ thống sử dụng Scikit-learn làm màng lọc khách quan sơ cấp (White-box Filter) để tính độ tương đồng từ khóa thô trước khi chuyển sang phân tích ngữ nghĩa sâu.

### 2.5.4 Đánh giá ngữ nghĩa sâu và thiết kế Prompt với Google Gemini API

Hệ thống áp dụng ba kỹ thuật Kỹ nghệ Gợi ý (Role-play, Few-shot và Structured Output) để ép buộc Gemini API phản hồi chuẩn cấu trúc dữ liệu JSON để dịch vụ C# dễ dàng lưu trữ. Hệ thống có cơ chế tự động xoay vòng API Keys và tự động hạ cấp từ `gemini-3.5-flash` xuống `gemini-1.5-flash` nếu bị lỗi Rate Limit.

Dưới đây là cấu trúc JSON phản hồi mẫu của phân hệ Đánh giá năng lực:
```json
{
  "score_analysis": {
    "total_score": 82,
    "classification": "Phù hợp",
    "summary": "Ứng viên có năng lực chuyên môn đáp ứng tốt yêu cầu kỹ năng Frontend...",
    "strengths": [
      "Kinh nghiệm làm việc thực tế với React trên 2 năm",
      "Sử dụng thành thạo TypeScript trong các dự án thực tế"
    ],
    "weaknesses": [
      "Chưa có kinh nghiệm làm việc với công nghệ Next.js",
      "Thiếu các chỉ số đo lường hiệu quả cụ thể trong dự án thứ hai"
    ],
    "red_flags": [
      {
        "type": "MISSING_METRICS",
        "title": "Thiếu chỉ số hiệu suất",
        "description": "Dự án quản lý kho hàng không ghi nhận kết quả định lượng cụ thể."
      }
    ]
  }
}
```

Bảng 2.2 mô tả chi tiết kiểu dữ liệu và ý nghĩa của từng thuộc tính cấu thành trong cấu trúc dữ liệu trao đổi trên:

Bảng 2.2: Từ điển dữ liệu cấu trúc JSON Phân hệ Đánh giá năng lực

| Tên thuộc tính (Property Name) | Kiểu dữ liệu (Data Type) | Thuộc tính cha | Mô tả ý nghĩa chức năng |
| :--- | :---: | :--- | :--- |
| `score_analysis` | Object | Root | Đối tượng chứa toàn bộ phân tích điểm số và đánh giá. |
| `total_score` | Integer | `score_analysis` | Điểm đánh giá độ phù hợp tổng thể của CV so với JD (Thang điểm 0 - 100). |
| `classification` | String | `score_analysis` | Phân loại ứng viên ("Phù hợp" / "Nên xem xét" / "Chưa phù hợp"). |
| `summary` | String | `score_analysis` | Đoạn văn tóm tắt nhận xét tổng quan của AI về hồ sơ ứng viên. |
| `strengths` | Array (String) | `score_analysis` | Danh sách các điểm mạnh nổi bật của ứng viên được AI trích xuất. |
| `weaknesses` | Array (String) | `score_analysis` | Danh sách các điểm yếu, lỗ hổng kỹ năng cần cải thiện. |
| `red_flags` | Array (Object) | `score_analysis` | Danh sách chứa các cảnh báo rủi ro phát hiện trong hồ sơ. |
| `type` | String | `red_flags[]` | Phân loại lỗi cảnh báo (`KEYWORD_STUFFING`, `MISSING_METRICS`...). |
| `title` | String | `red_flags[]` | Tiêu đề hiển thị ngắn gọn của cảnh báo đỏ trên giao diện người dùng. |
| `description` | String | `red_flags[]` | Chi tiết mô tả lỗi phát hiện và gợi ý định hướng khắc phục cụ thể. |

### 2.5.5 Lập trình giải thuật Apriori gợi ý kỹ năng

Thuật toán Apriori dùng để phát hiện luật kết hợp giữa các kỹ năng trong kho dữ liệu CV nhằm gợi ý lộ trình học tập cho ứng viên:
- **Support (Độ hỗ trợ):** $Support(X \cup Y) = \frac{\text{Số giao dịch chứa cả X và Y}}{N}$
- **Confidence (Độ tin cậy):** $Confidence(X \to Y) = \frac{Support(X \cup Y)}{Support(X)}$
- **Lift (Độ nâng):** $Lift(X \to Y) = \frac{Confidence(X \to Y)}{Support(Y)}$
- **Conviction (Độ thuyết phục):** $Conviction(X \to Y) = \frac{1 - Support(Y)}{1 - Confidence(X \to Y)}$

Hệ thống định kỳ quét kho CV, xây dựng tập phổ biến và sinh luật kết hợp lưu vào `association_rules.json` để đối chiếu và gợi ý lộ trình kỹ năng cho ứng viên.

### 2.5.6 Lập trình giải thuật Two-Phase HUIM khai phá nhóm năng lực giá trị cao

HUIM (High-Utility Itemset Mining) khắc phục nhược điểm của Apriori bằng cách kết hợp:
- Mức độ thành thạo kỹ năng (độ hữu ích nội sinh $q$ từ 1-5).
- Trọng số kinh tế/mức lương thị trường (độ hữu ích ngoại sinh $p$).
Độ hữu ích của kỹ năng $u(i, t) = q \times p$. Tổng độ hữu ích giao dịch CV là $TU(t)$. Do tính chất không đóng hướng xuống của độ hữu ích, thuật toán dùng giá trị trung gian $TWU(X)$ (tổng $TU$ của các giao dịch chứa $X$) để cắt tỉa không gian tìm kiếm an toàn:
- **Pha 1 (Overestimation):** Quét dữ liệu tính $TU$ và $TWU$, lọc các tập kỹ năng có $TWU \ge min\_utility$ (gọi là HTWUIs).
- **Pha 2 (Exact Calculation):** Quét dữ liệu lần 2 trên tập HTWUIs, tính chính xác giá trị tiện ích $u(X)$ thực tế, loại bỏ tập có $u(X) < min\_utility$ và lưu vào `high_utility_itemsets.json`.

### 2.5.7 So sánh đối chiếu hai giải thuật Apriori và Two-Phase HUIM

Để chứng minh tính đa dạng và chiều sâu trong giải thuật máy học, hệ thống triển khai song song cả hai giải thuật để bổ trợ nhau trong việc đưa ra giá trị tham vấn cho người dùng. Bảng 2.3 so sánh sự khác biệt và sự bổ trợ giữa hai thuật toán.

Bảng 2.3: So sánh thuật toán Apriori và Two-Phase HUIM trong hệ thống

| Tiêu chí so sánh | Thuật toán Apriori (Skill Association Rules) | Thuật toán Two-Phase HUIM (High-Utility Skillsets) |
| :--- | :--- | :--- |
| **Bản chất đầu ra** | Tìm ra các quy luật kết hợp có dạng $X \to Y$ (Ví dụ: Nếu biết React thì $80\%$ cũng có kỹ năng TypeScript). | Tìm ra tập hợp các kỹ năng đi kèm có tổng giá trị ích lợi (độ hữu ích) cao nhất thị trường. |
| **Thông tin đầu vào** | Chỉ quan tâm đến sự xuất hiện nhị phân (Có/Không - 0/1) của kỹ năng trong hồ sơ. | Kết hợp mức độ thành thạo (Độ hữu ích nội sinh $q$) và mức lương trung bình của kỹ năng (Độ hữu ích ngoại sinh $p$). |
| **Giá trị ứng dụng** | **Gợi ý lộ trình học tập:** Khuyên ứng viên nên học thêm kỹ năng gì tiếp theo dựa trên các kỹ năng hiện có của họ. | **Báo cáo phân tích thị trường:** Giúp HR nhận biết những bộ tổ hợp kỹ năng nào có giá trị cao nhất để định hình chính sách đãi ngộ. |
| **Bổ trợ hệ thống** | Giúp ứng viên tối ưu hóa lộ trình cá nhân. | Giúp nhà quản lý (Admin/HR) phân tích xu hướng thị trường lao động. |
"""

    # Build the new Bibliography text
    new_bibliography = """# TÀI LIỆU THAM KHẢO

[1] Trần Kim Dung, Quản trị nguồn nhân lực, Tái bản lần thứ 4. TP. Hồ Chí Minh: NXB Tổng hợp Thành phố Hồ Chí Minh, 2018.

[2] Nguyễn Ngọc Quân và Nguyễn Vân Điềm, Giáo trình Quản trị nhân lực. Hà Nội: NXB Đại học Kinh tế Quốc dân (NEU), 2016.

[3] Nguyễn Thị Hồng và Vũ Hồng Phong, Quản lý nguồn nhân lực dựa trên năng lực. Hà Nội: NXB Lao Động, 2023.

[4] D. C. McClelland, "Testing for competence rather than for 'intelligence'," American Psychologist, vol. 28, no. 1, pp. 1-14, 1973. [Online]. Available: Semantics Scholar. [Accessed: Jul. 15, 2026].

[5] E. D. Pulakos, Selection Assessment Methods: A guide to implementing formal assessments to build a high-quality workforce. Alexandria, VA: SHRM Foundation, 2005.

[6] Harvard University Office of Career Services, Harvard College Guide to Resumes & Cover Letters. Cambridge, MA: Mignone Center for Career Success, 2024.

[7] C. B. Goldberg, "Relational demography and similarity-attraction in resume screening," Journal of Social Psychology, vol. 145, no. 3, pp. 307-324, 2005.

[8] E. Tian, "GPTZero: An open-source tool for detecting AI-generated text using perplexity and burstiness analysis," Princeton NLP Group, Princeton University, Tech. Rep., 2023.

[9] C. E. Shannon, "A Mathematical Theory of Communication," Bell System Technical Journal, vol. 27, no. 3, pp. 379-423, 1948.

[10] L. M. Spencer and S. M. Spencer, Competence at Work: Models for Superior Performance. Hoboken, NJ: John Wiley & Sons, 1993.
"""

    # Replace parts in the lines array
    updated_lines = lines[:ch2_start] + [new_chapter_2 + "\n"] + lines[ch3_start:bib_start] + [new_bibliography + "\n"]
    
    with open(md_path, 'w', encoding='utf-8') as f:
        f.writelines(updated_lines)

    print(f"SUCCESS: Updated {md_path} with rewritten Chapter 2 and Bibliography.")
    return True

if __name__ == "__main__":
    import sys
    md_file = "BAOCAOKHOALUAN.md"
    if len(sys.argv) > 1:
        md_file = sys.argv[1]
    update_markdown(md_file)
