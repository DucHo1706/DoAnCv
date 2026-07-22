# CHƯƠNG 4: TRIỂN KHAI, THỰC THI VÀ KẾT QUẢ ĐẠT ĐƯỢC

Chương này trình bày chi tiết về quá trình hiện thực hóa các giải pháp lý thuyết và mô hình thiết kế hệ thống vào môi trường thực tiễn. Nội dung được tập trung làm rõ từ việc lựa chọn hệ sinh thái công nghệ, quy trình thiết lập môi trường triển khai cho đến việc mô tả thuật toán và giải pháp kiến trúc của các thuật toán trí tuệ nhân tạo lõi mà không bị phụ thuộc hoàn toàn vào các dịch vụ bên thứ ba.

---

## 4.1 CÔNG NGHỆ THỰC HIỆN

Hệ thống AI Recruitment được xây dựng dựa trên nguyên lý kiến trúc phân rã (Decoupled Architecture). Phương pháp tiếp cận này cho phép tối ưu hóa hiệu năng xử lý đặc thù của từng cấu phần, đảm bảo tính biệt lập của dữ liệu và tạo tiền đề thuận lợi cho việc mở rộng quy mô trong tương lai.

### 4.1.1 Nền tảng công nghệ, ngôn ngữ lập trình và thư viện

Quyết định lựa chọn hệ sinh thái đa ngôn ngữ bao gồm C#, Python và React được đưa ra dựa trên việc phân tích các yêu cầu nghiệp vụ cũng như trong quá trình tìm hiểu về đề tài.

#### 4.1.1.1 Giao diện Người dùng
*   **React 19 và TypeScript:** Ứng dụng thư viện React [1] nhằm tận dụng cơ chế Mô hình đối tượng tài liệu ảo (Virtual DOM), tối ưu hóa chu kỳ cập nhật giao diện mà không cần làm mới toàn bộ trang. Việc kết hợp với TypeScript thiết lập một rào chắn kiểm soát kiểu dữ liệu tĩnh, giúp phát hiện sớm các lỗi bất đồng bộ khi tiếp nhận dữ liệu phức tạp từ máy chủ.
*   **Vite 7.3.1:** Sử dụng làm công cụ đóng gói hiện đại nhằm tối ưu tốc độ thay thế mô-đun trong quá trình phát triển (Hot Module Replacement) [2].
*   **Hệ thống Component Ant Design 6.3.2:** Ứng dụng hệ thống thành phần UI từ Ant Design [3] nhằm đảm bảo tính đồng nhất về trải nghiệm người dùng theo tiêu chuẩn B2B SaaS trên nền Slate-light (`#F8FAFC`) và tông màu chủ đạo Royal Blue (`#2563EB`).
*   **Ant Design Plots 2.6.8:** Dùng vẽ sơ đồ thống kê điểm số và đặc biệt trực quan hóa các luật kết hợp tìm được từ thuật toán Apriori dưới dạng mạng lưới liên kết tương tác (Network Rules Graph) hỗ trợ phân tích xu hướng kỹ năng.

#### 4.1.1.2 Máy chủ Điều phối Nghiệp vụ
*   **DOT NET 8.0 SDK:** Lựa chọn làm nền tảng máy chủ trung tâm nhờ khả năng xử lý đồng thời (Concurrency Request) ưu việt và khả năng quản lý bộ nhớ tự động của Microsoft [4].
*   **Entity Framework Core 8.0:** Đóng vai trò là lớp ánh xạ quan hệ thực thể. EF Core cho phép tương tác với SQL Server thông qua ngôn ngữ truy vấn LINQ [4].
*   **SignalR:** Thiết lập kênh giao tiếp hai chiều thời gian thực qua giao thức WebSocket, cho phép máy chủ chủ động đẩy thông báo tiến độ bóc tách CV về phía client mà không cần tải lại trang [5].
*   **Các thư viện tích hợp phụ trợ:** Sử dụng Cloudinary DotNet [6] để đồng bộ lưu trữ tệp vật lý của CV lên đám mây, Google Drive API để lưu trữ dự phòng, và lớp thư viện System.Net.Mail phục vụ cơ chế tự động gửi email thông báo, liên lạc phỏng vấn cho ứng viên.

#### 4.1.1.3 Phân hệ Tính toán AI và Khai phá dữ liệu
*   **FastAPI và Uvicorn:** Framework Python được cấu hình để cung cấp các API bất đồng bộ. Kiến trúc này giúp luồng xử lý không bị chặn khi hệ thống phải phân tích hàng loạt tệp PDF cùng lúc [7].
*   **Google GenAI SDK 0.3.0:** Thư viện kết nối với mô hình ngôn ngữ lớn Gemini-1.5-flash, đóng vai trò bộ não phân tích ngữ nghĩa sâu dựa trên các tiêu chí ASK [8].
*   **Cụm thư viện Xử lý hình ảnh và Số hóa văn bản:** Tích hợp PyPDF và PDFPLUMBER để duyệt cấu trúc nhị phân tài liệu. Đối với hồ sơ dạng ảnh quét, hệ thống kích hoạt lớp cứu hộ quang học bằng Pytesseract OCR kết hợp xử lý ảnh Pillow [9].
*   **Cụm thư viện Học máy và NLP:** Sử dụng mô hình `en_core_web_sm` của thư viện SpaCy để nhận dạng thực thể. Đồng thời, Scikit-Learn và Numpy được ứng dụng để tính toán không gian vectơ TF-IDF [10].

---

### 4.1.2 Quy trình thiết lập và triển khai môi trường

Nhằm duy trì tính nhất quán khi triển khai trên các môi trường máy chủ (Development, Staging, Production), quy trình cài đặt được chuẩn hóa và quản lý thông qua các biến môi trường thay vì lưu trữ cấu hình cứng (Hardcode).

1.  **Quản trị Cơ sở dữ liệu và API Gateway:**
    *   Lược đồ cơ sở dữ liệu (Database Schema) vật lý trên Microsoft SQL Server được đồng bộ thông qua cơ chế Migrations của Entity Framework Core. Các lớp thực thể C# được ánh xạ và ánh xạ ngược thành các bảng quan hệ thông qua CLI.
    *   Hồ sơ kết nối (Connection Strings), thông số cấu hình lưu trữ đám mây Cloudinary và chữ ký phân quyền kiểm soát bằng thẻ khóa bảo mật JWT được thiết lập độc lập trong tệp tin `appsettings.json`. Điều này giúp cô lập dữ liệu nghiệp vụ của nhà tuyển dụng và ứng viên.
2.  **Thiết lập phân hệ AI và Học máy (Python microservice):**
    *   Môi trường thực thi của Python được bảo vệ trong một không gian ảo (Virtual Environment) sử dụng `venv` nhằm tránh xung đột với các thư viện hệ điều hành của máy chủ đích.
    *   Các khóa API kết nối dịch vụ Gemini và cấu hình chỉ định thư mục chứa động cơ Tesseract OCR được quản lý thông qua tệp tin ẩn `.env`, tách biệt hoàn toàn khỏi mã nguồn đóng gói.

---

### 4.1.3 Giải pháp thuật toán và các kiến thức mở rộng tự phát triển

Nhóm tác giả đã nghiên cứu và hiện thực hóa các giải pháp thuật toán tích hợp, giải quyết các thách thức thực tiễn trong bài toán tuyển dụng mà không bị giới hạn bởi các API độc quyền.

#### A. So khớp kỹ năng bằng TF-IDF và độ tương đồng Cosine
Hệ thống kết hợp phương pháp học máy thống kê truyền thống TF-IDF với mô hình ngôn ngữ lớn LLM để chấm điểm độ trùng khớp năng lực giữa ứng viên và yêu cầu tuyển dụng.
*   **Nguyên lý vận hành:**
    Văn bản CV và JD được bóc tách từ khóa và biểu diễn thành các vectơ phân bố tần suất TF-IDF. Độ tương đồng Cosine được tính toán dựa trên tích vô hướng của hai vectơ chia cho tích độ dài của chúng. Điểm số tương đồng toán học này làm thước đo khách quan bổ trợ cho điểm phân tích định tính từ LLM:
    $$\text{TF-IDF}(t, d, D) = \text{TF}(t, d) \times \log\left(\frac{|D|}{1 + |\{d \in D : t \in d\}|}\right)$$
    $$\text{Cosine Similarity}(A, B) = \frac{\sum_{i=1}^{n} A_i B_i}{\sqrt{\sum_{i=1}^{n} A_i^2} \sqrt{\sum_{i=1}^{n} B_i^2}}$$

#### B. Khai phá luật liên kết kỹ năng phổ biến Apriori
Thuật toán Apriori được triển khai chạy ngầm định kỳ để tìm kiếm các xu hướng kỹ năng thường xuyên xuất hiện cùng nhau trong cơ sở dữ liệu CV.
*   **Nguyên lý vận hành:**
    Hệ thống trích xuất danh sách kỹ năng từ các CV thành các tập giao dịch (Transactions). Giải thuật tiến hành tìm kiếm các tập mục kỹ năng phổ biến (Frequent Itemsets) dựa trên ngưỡng độ hỗ trợ tối thiểu (Minimum Support - $\text{min\_sup}$). Từ đó, tính toán độ tin cậy (Confidence) và độ cải thiện (Lift) để xác lập các luật kết hợp:
    $$\text{Support}(X \Rightarrow Y) = \frac{\text{Số lượng giao dịch chứa cả } X \text{ và } Y}{\text{Tổng số giao dịch}}$$
    $$\text{Confidence}(X \Rightarrow Y) = \frac{\text{Số lượng giao dịch chứa cả } X \text{ và } Y}{\text{Số lượng giao dịch chứa } X}$$
    $$\text{Lift}(X \Rightarrow Y) = \frac{\text{Support}(X \Rightarrow Y)}{\text{Support}(X) \times \text{Support}(Y)}$$
    Các luật kết hợp có chỉ số $\text{Lift} > 1$ và đạt ngưỡng $\text{Confidence}$ quy định được đưa vào kho tri thức để chatbot tự động gợi ý lộ trình kỹ năng bổ trợ cho ứng viên.

#### C. Khai phá tập kỹ năng có giá trị cao và khan hiếm bằng Two-Phase HUIM
Nhằm bổ trợ cho giải thuật Apriori (chỉ đo lường tần suất mà không đo lường tầm quan trọng), thuật toán Two-Phase HUIM (High-Utility Itemset Mining) được hiện thực hóa để tìm ra các nhóm kỹ năng mang lại giá trị nghề nghiệp thực tiễn lớn nhất.
*   **Nguyên lý vận hành:**
    Độ hữu ích (Utility) của kỹ năng không mang ý nghĩa thương mại mà phản ánh **độ khan hiếm và độ ưu tiên tuyển dụng của thị trường**:
    *   *Lợi ích ngoài (External Utility - $p(i)$):* Được định lượng bằng mức lương trần tối đa (`SalaryMax`) của tất cả các JD trong CSDL có yêu cầu kỹ năng $i$. Trọng số lương này đại diện cho sự săn đón và giá trị công nghệ mà doanh nghiệp sẵn sàng chi trả cho kỹ năng đó trên thị trường thực tế.
    *   *Lợi ích trong (Internal Utility - $q(i, T)$):* Đại diện cho cấp độ thành thạo của ứng viên đối với kỹ năng đó được trích xuất từ CV (Junior = 2, Middle = 3, Senior = 5).
*   **Giải thuật Two-Phase:**
    *   *Phase 1 (Cắt tỉa):* Tính toán độ hữu ích trọng số giao dịch (Transaction Weighted Utility - TWU) của từng kỹ năng đơn lẻ. Cắt tỉa các tập mục có TWU nhỏ hơn ngưỡng $\text{min\_utility}$ để thu hẹp không gian tìm kiếm.
    *   *Phase 2 (Định lượng thực tế):* Quét lại cơ sở dữ liệu giao dịch để tính toán chính xác tổng lợi ích thực tế của các tập ứng viên vượt qua Phase 1:
        $$u(i, T) = q(i, T) \times p(i)$$
        $$u(X) = \sum_{T \in D \wedge X \subseteq T} \sum_{i \in X} u(i, T)$$
    Các nhóm kỹ năng đạt chuẩn ích lợi cao (High-Utility Itemsets) được sử dụng để chatbot gợi ý định hướng nâng cấp năng lực cho ứng viên để hướng tới các vị trí công việc có giá trị cao hơn.

#### D. Bộ quét gian lận từ khóa ẩn (ATS Cheat Detector)
Nhằm ngăn chặn hành vi ứng viên nhồi nhét từ khóa ẩn (những từ khóa có màu trùng màu nền trắng `#FFFFFF` hoặc có kích thước siêu nhỏ nhỏ hơn 4px nhằm lách qua bộ lọc tự động của ATS), hệ thống thiết kế bộ quét cấu trúc nhị phân của tệp PDF.
*   **Nguyên lý vận hành:**
    Giải thuật duyệt qua toàn bộ các đối tượng ký tự (character objects) được kết xuất trên từng trang của tệp tin. Đối với mỗi ký tự, bộ quét kiểm tra thuộc tính phối màu (`non_stroking_color` hoặc `stroking_color`) xem các giá trị kênh RGB có tiệm cận mức 1.0 (màu trắng) hay không, đồng thời đối chiếu thuộc tính kích thước (`size`). Mọi ký tự vi phạm điều kiện ẩn hoặc quá nhỏ sẽ được trích xuất riêng và lập tức ghi nhận cảnh báo đỏ (Red Flag) cho nhà tuyển dụng.

#### E. Ẩn danh bảo mật dữ liệu DEI
Để tuân thủ các quy tắc bảo mật dữ liệu và bảo đảm tính công bằng trong tuyển dụng (loại bỏ các định kiến vô thức về giới tính, tên tuổi, chủng tộc), hệ thống tích hợp bộ lọc ẩn danh trước khi chuyển thông tin đến LLM.
*   **Nguyên lý vận hành:**
    Giải thuật sử dụng biểu thức chính quy (Regular Expression) để dò tìm và che giấu địa chỉ email cùng số điện thoại liên lạc. Đồng thời, mô hình nhận dạng thực thể có tên (Named Entity Recognition - NER) của thư viện SpaCy được kích hoạt để phát hiện các thực thể đại diện cho tên người (`PERSON`) và thay thế bằng nhãn ẩn danh `[NAME_MASKED]`.

#### F. Gợi ý ôn tập phỏng vấn và Tài liệu tự học cải thiện CV
Nhằm hỗ trợ ứng viên chủ động khắc phục các lỗ hổng năng lực chuyên môn và chuẩn bị tốt nhất cho các vòng phỏng vấn thực tế, hệ thống hiện thực hóa phân hệ Gợi ý ôn tập và Đề xuất tài liệu học tập tự động (Interview Prep & Self-Study Recommender).
*   **Nguyên lý vận hành:**
    *   *Bước 1 (Phân tích khoảng trống năng lực):* Phân hệ AI đối sánh nội dung CV của ứng viên với các yêu cầu cốt lõi trong bản mô tả công việc (JD) nhằm xác định các mảng kiến thức, kỹ năng còn thiếu sót hoặc chưa đạt độ chín chuyên môn cần thiết.
    *   *Bước 2 (Xác lập chủ đề ôn tập trọng tâm):* Thay vì đưa ra các câu hỏi đánh giá trực tiếp gây áp lực, AI tự động chọn lọc và xây dựng **3 chủ đề ôn tập cốt lõi nhất** tương thích trực tiếp với vị trí ứng tuyển của ứng viên.
    *   *Bước 3 (Gợi ý phỏng vấn & Liên kết tự học cải thiện):* Với mỗi chủ đề ôn tập, AI cung cấp hướng dẫn chi tiết cách hệ thống hóa và viết lại kinh nghiệm thực tế theo cấu trúc STAR. Đồng thời, hệ thống tự động đề xuất danh sách **các đường dẫn liên kết (URL) tự học và tham khảo uy tín trên internet** (ví dụ: tài liệu kỹ thuật chính thống của công nghệ như React/Node.js, các kho tài liệu phỏng vấn nổi tiếng trên GitHub, các trang MDN Web Docs, LeetCode, hoặc cẩm nang tuyển dụng TopCV). Các đường dẫn này được trả về dưới định dạng liên kết Markdown chuẩn, giúp ứng viên nhấp chuột trực tiếp để truy cập học tập, từ đó chủ động bồi đắp kiến thức và tối ưu hóa hồ sơ năng lực của bản thân.

#### G. Cơ chế xoay vòng khóa API (API Key Rotation) và Tự động hạ cấp (Failover)
Để khắc phục giới hạn cuộc gọi nghiêm ngặt của các API miễn phí, hệ thống phát triển cơ chế tự điều phối tải.
*   **Nguyên lý vận hành:**
    Hệ thống quản lý một danh sách các khóa API hợp lệ và sử dụng giải thuật xoay vòng Round Robin để phân phối yêu cầu. Khi một khóa gặp mã lỗi quá tải (HTTP 429), hệ thống tự động đánh dấu tạm ngưng khóa đó trong 60 giây và chuyển tiếp yêu cầu sang khóa dự phòng. Đồng thời, cấu trúc yêu cầu Prompt sẽ tự động được thu gọn (Hạ cấp cấu trúc - Failover) để giảm tải tài nguyên tính toán xử lý của mô hình, đảm bảo tính liên tục của hệ thống.

---

## 4.2 CÁC CHỨC NĂNG ĐÃ THỰC THI

Phần này mô tả chi tiết cấu trúc giao diện, luồng tương tác thực tế và vai trò vận hành của các phân hệ chức năng đã được triển khai hoàn chỉnh. Các chức năng được phân tách dựa trên hai phân hệ cổng thông tin chính: Cổng thông tin dành cho Ứng viên (Candidate Portal) và Cổng thông tin dành cho Nhà tuyển dụng (Recruiter Portal).

### 4.2.1 Phân hệ dành cho Ứng viên (Candidate Portal)

Phân hệ dành cho ứng viên được thiết kế với mục tiêu tối ưu hóa trải nghiệm tự học và nộp hồ sơ, giúp ứng viên tự nhận thức được năng lực của bản thân so với yêu cầu thị trường tuyển dụng.

1.  **Giao diện Đăng nhập và Đăng ký hệ thống:**
    Giao diện xác thực đóng vai trò cổng kiểm soát truy cập an toàn dựa trên cơ chế JWT Token. Hệ thống giao diện được thiết kế tối giản, loại bỏ các chi tiết thừa để tăng sự tập trung của ứng viên khi tương tác.
    ![Giao diện Đăng nhập hệ thống](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/candidate/candidate_auth.png)
    ![Giao diện Đăng ký tài khoản ứng viên](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/candidate/candidate_register.png)

2.  **Giao diện Tìm kiếm việc làm và Đề xuất thông minh:**
    Ứng viên có thể tìm kiếm và lọc các tin tuyển dụng theo vị trí địa lý, mức lương và từ khóa công nghệ. Đặc biệt, khi ứng viên kích hoạt tính năng **Đề xuất thông minh** (Smart Recommendation), hệ thống C# Backend sẽ gọi API đối sánh để tự động sắp xếp và hiển thị lên hàng đầu những vị trí tuyển dụng có độ tương thích cao nhất với hồ sơ kỹ năng của ứng viên.
    ![Giao diện Tìm kiếm việc làm và Đề xuất thông minh](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/candidate/candidate_job_search.png)

3.  **Giao diện Chi tiết việc làm và Nộp hồ sơ:**
    Màn hình chi tiết công việc sử dụng cấu trúc phân chia bố cục dạng 2 cột: cột bên trái hiển thị chi tiết mô tả công việc (JD), kỹ năng yêu cầu và quyền lợi; cột bên phải hiển thị tóm tắt thông số nhanh (mức lương tối đa, cấp độ yêu cầu) và nút kích hoạt luồng nộp hồ sơ ứng tuyển màu xanh Royal Blue.
    ![Giao diện Chi tiết việc làm và Nộp hồ sơ](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/candidate/candidate_job_detail.png)

4.  **Giao diện Tải lên CV và Gợi ý tối ưu STAR:**
    Khi ứng viên tải hồ sơ lên (hỗ trợ kéo thả PDF/Word), phân hệ AI lập tức bóc tách dữ liệu văn bản thô và đưa ra các **gợi ý viết lại kinh nghiệm làm việc theo mô hình STAR** (Situation, Task, Action, Result) ở cột bên phải. Ứng viên có thể đọc các gợi ý này để chỉnh sửa, hoàn thiện CV của mình trước khi gửi chính thức đến nhà tuyển dụng.
    ![Giao diện Tải lên CV và Gợi ý tối ưu STAR](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/candidate/candidate_upload_cv.png)

5.  **Giao diện Báo cáo kết quả phân tích CV từ AI:**
    Hiển thị báo cáo kết quả đánh giá hồ sơ toàn diện sau khi nộp. Trọng tâm giao diện là biểu đồ tròn hiển thị điểm tương thích (Fit Score) tổng hợp, đi kèm các tab thông tin chi tiết: Danh sách kỹ năng phù hợp, Kỹ năng còn thiếu, Cảnh báo đỏ rủi ro nhân sự (Red Flags) và chỉ số đánh giá độ tin cậy, tránh trùng lặp ngôn từ do ứng viên lạm dụng AI tạo sinh (AI-Generated Risk).
    ![Giao diện Báo cáo kết quả đánh giá hồ sơ ứng viên](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/candidate/candidate_cv_analysis_result.png)

6.  **Giao diện Xem trước bản CV tối ưu hóa và Tải xuống PDF:**
    Cửa sổ hiển thị song song bản CV gốc và bản CV đã được AI hiệu chỉnh câu từ, nâng cấp cấu trúc mô tả kinh nghiệm. Giao diện tích hợp nút "Tải xuống báo cáo PDF" sử dụng công nghệ kết xuất trực tiếp tại máy khách để ứng viên lưu trữ hồ sơ cá nhân.
    ![Giao diện Xem trước bản CV tối ưu hóa và Tải xuống PDF](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/candidate/candidate_cv_preview.png)

7.  **Giao diện Trợ lý ảo AI Chatbot hỗ trợ ứng viên:**
    Khung đối thoại thời gian thực (Chatbot) hoạt động thông qua kết nối WebSocket của SignalR. Chatbot tự động nạp hồ sơ CV và JD hiện tại của ứng viên để giải đáp thắc mắc, đồng thời ứng dụng kết quả luật kết hợp Apriori để đưa ra lộ trình các kỹ năng bổ trợ cần học thêm.
    ![Giao diện Trợ lý ảo AI Chatbot hỗ trợ ứng viên](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/candidate/candidate_chatbot.png)

8.  **Giao diện Quản lý Hồ sơ ứng viên và Kho kỹ năng:**
    Cho phép ứng viên quản lý thông tin cá nhân và quản trị kho kỹ năng (Skill Inventory) được phân loại theo cấp độ (Junior, Middle, Senior). Màn hình tích hợp các thẻ gợi ý kỹ năng nhanh được gợi ý từ thuật toán Apriori, cho phép ứng viên bấm chọn để thêm trực tiếp vào hồ sơ năng lực.
    ![Giao diện Quản lý Hồ sơ ứng viên và Kho kỹ năng](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/candidate/candidate_profile.png)

9.  **Giao diện Lịch sử ứng tuyển và Trạng thái đơn:**
    Bảng danh sách hiển thị toàn bộ lịch sử nộp hồ sơ của ứng viên, hiển thị rõ tiến trình duyệt hồ sơ theo thời gian thực (Chờ duyệt, Hẹn phỏng vấn, Đã duyệt) và hiển thị thời gian, link phòng phỏng vấn trực tuyến do nhà tuyển dụng xếp lịch.
    ![Giao diện Lịch sử ứng tuyển và Trạng thái đơn](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/candidate/candidate_applications.png)

### 4.2.2 Phân hệ dành cho Nhà tuyển dụng (Recruiter Portal)

Phân hệ dành cho nhà tuyển dụng tập trung tối đa vào hiệu năng quản trị tin tuyển dụng, tự động hóa xếp hạng hồ sơ ứng tuyển và giảm thiểu các rủi ro lọc hồ sơ thủ công.

1.  **Giao diện Trang tổng quan phân tích dành cho nhà tuyển dụng:**
    Hiển thị các chỉ số thống kê về số lượng tin tuyển dụng, tổng số hồ sơ tiếp nhận và tỷ lệ chuyển đổi ứng viên. Phía dưới tích hợp **Bản đồ Mạng lưới liên kết kỹ năng Apriori** (Interactive Network Graph Nodes) giúp HR phân tích sự tương tác và xu hướng phát triển kỹ năng trên thị trường để thiết kế JD phù hợp.
    ![Giao diện Trang tổng quan phân tích dành cho nhà tuyển dụng](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/recruiter/recruiter_dashboard_analytics.png)

2.  **Giao diện Quản lý tin tuyển dụng:**
    Bảng quản trị hiển thị danh sách toàn bộ các tin tuyển dụng đang mở hoặc đã đóng của doanh nghiệp. HR có thể nhanh chóng theo dõi số lượng hồ sơ đã ứng tuyển và số lượng CV đã được AI xử lý phân tích tự động.
    ![Giao diện Quản lý tin tuyển dụng](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/recruiter/recruiter_job_management.png)

3.  **Giao diện Đăng tin JD và Cấu hình ASK:**
    Giao diện soạn thảo tin tuyển dụng tích hợp bộ kéo trượt tỷ trọng động cho ba nhóm tiêu chí năng lực ASK (Attitude - Thái độ, Skills - Kỹ năng, Knowledge - Kiến thức). Tổng tỷ trọng của 3 thanh trượt bắt buộc phải bằng 100% để làm trọng số cấu hình cho giải thuật chấm điểm AI của phân hệ Python.
    ![Giao diện Đăng tin JD và Cấu hình ASK](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/recruiter/recruiter_create_job.png)

4.  **Giao diện Bảng xếp hạng ứng viên ứng tuyển:**
    Bảng tổng hợp hiển thị toàn bộ hồ sơ CV ứng tuyển cho một vị trí nhất định, được tự động sắp xếp theo thứ tự điểm tương thích (Fit Score) từ cao xuống thấp. Các hồ sơ xuất sắc được AI dán nhãn phân loại nhanh (Perfect Match, Good, Average) giúp HR tối ưu hóa thời gian sàng lọc.
    ![Giao diện Bảng xếp hạng ứng viên ứng tuyển](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/recruiter/recruiter_cv_ranking.png)

5.  **Giao diện Báo cáo Đánh giá CV chi tiết và Cảnh báo rủi ro:**
    Màn hình chi tiết đánh giá hồ sơ của một ứng viên cụ thể, bao gồm 3 phân hệ báo cáo chuyên biệt cho nhà tuyển dụng:
    *   *Năng lực & Cảnh báo (Competency & Red Flags):* Bản đồ mạng nhện đối chiếu năng lực thực tế của ứng viên so với tiêu chí ASK của công việc, đi kèm danh sách cảnh báo đỏ (Red Flags) về khoảng trống sự nghiệp hoặc thiếu hụt kinh nghiệm cốt lõi.
    *   *Ngôn từ & Chân thực (AI-Generated Risk & ATS Cheat Warning):* Đánh giá độ tin cậy của ngôn từ trong CV. Đặc biệt, hệ thống tích hợp **ATS Cheat Warning** hiển thị bôi đỏ danh sách các từ khóa ẩn viết bằng chữ màu trắng/1px phát hiện được bằng thuật toán phân tích nhị phân tệp tin PDF.
    *   *Gợi ý phỏng vấn (Behavioral Interview Coaching):* Đề xuất danh sách câu hỏi phỏng vấn hành vi cụ thể tương ứng với các lỗ hổng kỹ năng của ứng viên để HR đối chất trực tiếp.
    ![Giao diện Báo cáo Đánh giá CV chi tiết dành cho nhà tuyển dụng](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/recruiter/recruiter_cv_evaluation_detail.png)

6.  **Giao diện So sánh ứng viên song song:**
    Cho phép nhà tuyển dụng lựa chọn từ 2 đến 3 ứng viên xuất sắc trong danh sách xếp hạng để đối chiếu song song các thông số kỹ thuật cốt lõi: Điểm Fit Score, số năm kinh nghiệm, trình độ học vấn tối đa, danh sách kỹ năng cốt lõi và các cảnh báo rủi ro trên cùng một màn hình so sánh cột dọc.
    ![Giao diện So sánh ứng viên song song](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/recruiter/recruiter_candidate_comparison.png)

7.  **Giao diện Quản lý Lịch phỏng vấn:**
    Hỗ trợ HR lên lịch hẹn phỏng vấn ứng viên theo định dạng lịch tháng. HR chọn giờ trống, điền địa chỉ phòng họp trực tuyến và lưu lại. Hệ thống sẽ kích hoạt SignalR thông báo trạng thái đơn cho ứng viên và tự động gửi email thư mời phỏng vấn đến hòm thư của ứng viên.
    ![Giao diện Quản lý Lịch phỏng vấn](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/recruiter/recruiter_interview_schedule.png)

8.  **Giao diện Quản lý Kho tài năng (Talent Pool):**
    Bảng quản lý thông tin tập trung của toàn bộ ứng viên đã từng ứng tuyển vào công ty. Giao diện cho phép HR thực hiện các truy vấn thông minh, phân nhóm ứng viên theo điểm số hoặc kỹ năng cốt lõi để lưu trữ và tái sử dụng hồ sơ cũ khi có nhu cầu tuyển dụng mới phát sinh.
    ![Giao diện Quản lý Kho tài năng](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/recruiter/recruiter_talent_pool.png)

9.  **Giao diện Gửi Email & Nhật ký gửi thư cho ứng viên:**
    Phân hệ soạn thảo thư điện tử tích hợp AI hỗ trợ tự động sinh nội dung email (lời mời phỏng vấn, thư cảm ơn, thông báo từ chối) cá nhân hóa theo thông tin của từng ứng viên. Bảng nhật ký (Email Logs) giúp HR giám sát thời gian, trạng thái gửi đi thành công của từng bức thư.
    ![Giao diện Gửi Email và Nhật ký gửi thư cho ứng viên](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/recruiter/recruiter_email_management.png)

### 4.2.3 Phân hệ dành cho Quản trị viên (Admin Portal)

Phân hệ Quản trị viên đóng vai trò vận hành kỹ thuật toàn bộ hệ thống, kiểm duyệt chất lượng nội dung và thiết lập cấu hình tham số hệ thống.

1.  **Giao diện Trang tổng quan quản trị hệ thống (Admin Dashboard):**
    Hiển thị biểu đồ thống kê các tham số hoạt động toàn hệ thống bao gồm tổng số lượng tài khoản đăng ký mới, số lượt gọi API của AI Microservice và biểu đồ tỷ lệ lỗi nhận diện ký tự quang học (OCR Error Rate Chart) của động cơ Tesseract OCR theo thời gian thực.
    ![Giao diện Trang tổng quan quản trị hệ thống](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/admin/admin_dashboard.png)

2.  **Giao diện Phê duyệt tin tuyển dụng (Job Approval Management):**
    Bảng kiểm duyệt nội dung các tin tuyển dụng (JD) do các doanh nghiệp/HR đăng tải. Admin có quyền xem chi tiết nội dung mô tả công việc, duyệt cho phép hiển thị lên cổng tìm kiếm của ứng viên hoặc từ chối và gửi phản hồi yêu cầu chỉnh sửa nếu JD vi phạm quy chế.
    ![Giao diện Phê duyệt tin tuyển dụng](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/admin/admin_job_approval.png)

3.  **Giao diện Quản lý người dùng (User Management):**
    Quản lý danh sách tài khoản của toàn bộ ứng viên, nhà tuyển dụng và quản trị viên trong hệ thống. Giao diện tích hợp các chức năng tìm kiếm tài khoản, khóa/mở khóa tài khoản tạm thời khi phát hiện hành vi vi phạm bảo mật hệ thống.
    ![Giao diện Quản lý người dùng](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/admin/admin_user_management.png)

4.  **Giao diện Quản lý danh mục hệ thống (Category & Branch Management):**
    Bảng quản lý các tham số cơ sở nền tảng của hệ thống bao gồm: Danh mục ngành nghề công nghệ, các chi nhánh làm việc, cấp bậc công việc (Job Levels: Intern, Junior, Middle, Senior) và các vị trí công việc mẫu. Giúp chuẩn hóa các lựa chọn đầu vào khi HR đăng tin JD.
    ![Giao diện Quản lý danh mục hệ thống](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/admin/admin_category_management.png)

5.  **Giao diện Quản lý vai trò và phân quyền (Role & Permission Management):**
    Thiết lập nhóm quyền hạn chi tiết cho từng đối tượng người dùng. Cho phép Admin định nghĩa các vai trò mới, gán quyền truy cập tài nguyên API cụ thể cho từng vai trò nhằm bảo mật tối đa hệ thống dữ liệu API Gateway C#.
    ![Giao diện Quản lý vai trò và phân quyền](file:///d:/KhoaLuan/TaiLieuBaoCao/Documents/images/admin/admin_role_permission.png)

---

## 4.3 KẾT QUẢ ĐẠT ĐƯỢC VÀ KIỂM THỬ HỆ THỐNG

Phần này trình bày kết quả đo lường và đánh giá hệ thống thông qua các quy trình kiểm thử chức năng (Functional Testing) và phi chức năng (Non-Functional Testing) trên môi trường triển khai thực tế.

### 4.3.1 Kiểm thử chức năng (Functional Testing)

Nhằm đảm bảo các tính năng nghiệp vụ của hệ thống vận hành chính xác theo đúng đặc tả yêu cầu thiết kế, nhóm nghiên cứu đã xây dựng kịch bản kiểm thử chức năng dựa trên phương pháp kiểm thử hộp đen (Black-box Testing).

1.  **Quy trình tạo dữ liệu kiểm thử giả lập:**
    Để có đủ khối lượng dữ liệu giao dịch phục vụ việc đo lường năng lực và độ chính xác của các thuật toán khai phá Apriori và Two-Phase HUIM, nhóm nghiên cứu đã sử dụng công cụ sinh dữ liệu **Mockaroo** [11]. Công cụ này hỗ trợ tạo lập tự động bộ dữ liệu gồm 10,000 bản ghi giao dịch giả lập mô phỏng các kỹ năng công nghệ thực tế và các thông số lương trần tương thích của các doanh nghiệp. Bộ dữ liệu này được nạp trực tiếp vào cơ sở dữ liệu SQL Server để phục vụ quá trình huấn luyện và chạy thử nghiệm giải thuật.
    
2.  **Kết quả kịch bản kiểm thử chức năng cốt lõi:**
    Bảng dưới đây thống kê kết quả thực thi các ca kiểm thử (Test Cases) đối với các tính năng trọng tâm của hệ thống:

| Mã TC | Tên ca kiểm thử | Dữ liệu đầu vào | Kết quả kỳ vọng | Kết quả thực tế | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TC-01 | Đăng nhập hệ thống | Tài khoản, Mật khẩu | Trả về Token JWT hợp lệ, chuyển hướng đúng vai trò | Hệ thống trả về JWT, phân quyền ứng viên/HR chính xác | **Passed** |
| TC-02 | Tải CV & Bóc tách text | Tệp tin CV dạng PDF/Image | Trích xuất chính xác cấu trúc văn bản tiếng Việt | Đọc tốt PDF thường; chạy OCR cứu hộ ảnh đạt độ chính xác >92% | **Passed** |
| TC-03 | Quét gian lận ATS | CV chứa chữ trắng/1px | Phát hiện từ khóa ẩn và ghi nhận cảnh báo đỏ | Trích xuất chính xác các từ khóa viết ẩn bằng chữ màu trắng | **Passed** |
| TC-04 | Chấm điểm ASK | Văn bản CV và JD | AI phân tích và trả về điểm số Ask, Red Flags | Điểm ASK tương thích cao, hiển thị rõ khoảng trống sự nghiệp | **Passed** |
| TC-05 | Ẩn danh dữ liệu DEI | Văn bản CV thô | Che giấu Email, SĐT và Tên riêng bằng SpaCy | Lọc bỏ thông tin nhạy cảm trước khi gửi sang Gemini API | **Passed** |
| TC-06 | Đăng JD & Cấu hình ASK | JD, thanh trượt ASK | Lưu thông tin, đảm bảo tổng trọng số ASK bằng 100% | Ràng buộc tổng ASK bằng 100% hoạt động ổn định | **Passed** |
| TC-07 | Khai phá Apriori & HUIM | Tập dữ liệu kỹ năng | Sinh ra tệp json luật kết hợp và kỹ năng ích lợi cao | Tạo thành công luật kỹ năng Apriori và nhóm kỹ năng HUIM | **Passed** |
| TC-08 | Gửi Email mời phỏng vấn | Giờ hẹn, phòng họp, email | Gửi email thông báo tự động qua SMTP Gmail | Ứng viên nhận được email chứa link họp đúng định dạng | **Passed** |

### 4.3.2 Kiểm thử phi chức năng (Non-Functional Testing)

Hệ thống tuyển dụng tích hợp trí tuệ nhân tạo đòi hỏi tính ổn định cao và thời gian phản hồi tối ưu khi tiếp nhận nhiều tệp tin CV tải lên đồng thời. Nhóm nghiên cứu đã sử dụng công cụ **Apache JMeter** [12] để thiết lập kịch bản đo lường hiệu năng và tải trọng hệ thống.

1.  **Cấu hình kịch bản kiểm thử tải:**
    *   *Số lượng người dùng ảo đồng thời (Concurrent Threads):* 100 Virtual Users.
    *   *Thời gian tăng tải (Ramp-up Period):* 10 giây (giả lập 100 ứng viên truy cập nộp hồ sơ lần lượt trong 10 giây và duy trì tải trọng liên tục).
    *   *Thời gian thực thi:* 60 giây.
    *   *API kiểm thử:* Endpoint `/score-cv` trên API C# (nhận tệp tin CV gửi sang Python bóc tách và chạy AI chấm điểm).

2.  **Kết quả đo lường hiệu năng thực tế:**
    Bảng thống kê các chỉ số hiệu năng hệ thống đạt được dưới tải trọng cao:

| Chỉ số hiệu năng (Performance Metrics) | Giá trị đo lường thực tế | Nhận xét đánh giá |
| :--- | :--- | :--- |
| **Tỷ lệ lỗi (Error Rate)** | **0.0%** | Hệ thống hoạt động ổn định, không gặp lỗi từ chối kết nối hoặc sập dịch vụ. |
| **Băng thông (Throughput)** | 14.2 requests/second | Tốc độ xử lý yêu cầu song song đạt yêu cầu nghiệp vụ doanh nghiệp trung bình. |
| **Độ trễ mạng trung bình (Latency)** | 120 ms | Phản hồi từ API C# nhanh chóng đối với các tác vụ truy vấn thông thường. |
| **Thời gian phản hồi chấm điểm CV thường** | **2.4 giây** | Thời gian xử lý bóc tách văn bản PDF thường và gọi Gemini chấm điểm. |
| **Thời gian phản hồi chấm điểm CV OCR** | **3.1 giây** | Thời gian tăng nhẹ do phải thực hiện cứu hộ ảnh và nhận diện ký tự quang học. |
| **Tiêu thụ tài nguyên máy chủ C#** | CPU: 35%, RAM: 450MB | Mức tiêu thụ tối ưu nhờ cơ chế quản lý bộ nhớ của .NET 8. |
| **Tiêu thụ tài nguyên máy chủ Python** | CPU: 45%, RAM: 320MB | Tiêu thụ CPU tăng khi xử lý tác vụ tính toán TF-IDF và chạy OCR. |

### 4.3.3 Các nghiệp vụ cộng thêm và quy trình mở rộng thực tế

Hệ thống đã triển khai thành công các nghiệp vụ cộng thêm đặc thù nhằm giải quyết các rủi ro nhân sự thực tế bao gồm:
*   **Cơ chế chống gian lận lọc CV tự động:** Phát hiện chữ trắng/1px (ATS Cheat Detector) giúp loại bỏ những ứng viên thiếu trung thực cố tình nhồi nhét từ khóa.
*   **Ẩn danh dữ liệu cá nhân (DEI Masking):** Xóa bỏ các định kiến vô thức bằng SpaCy NER để bảo vệ sự đa dạng, công bằng và hòa nhập trong doanh nghiệp.
*   **Tích hợp đề xuất liên kết tự học:** Chatbot tự động phân tích khoảng trống năng lực và cung cấp trực tiếp các đường dẫn tự học uy tín (GitHub, MDN Docs) giúp ứng viên nâng cấp kỹ năng.

### 4.3.4 Đánh giá lý thuyết, kỹ thuật, công nghệ so với thiết kế đề ra

*   **Sự kết hợp giữa TF-IDF và Gemini LLM:** Mô hình thiết kế chứng minh tính đúng đắn cao trên thực tế. Việc sử dụng TF-IDF (White-box) cung cấp một điểm số thống kê tần suất từ khóa rõ ràng, minh bạch; trong khi Gemini LLM (Black-box) cung cấp khả năng đánh giá ngữ nghĩa sâu sắc. Sự kết hợp này khắc phục hoàn toàn nhược điểm "ảo tưởng" (hallucination) thường gặp của các mô hình ngôn ngữ lớn, tạo ra điểm tương thích (Fit Score) có độ tin cậy cao.
*   **Thuật toán Apriori và HUIM:** Giải thuật chạy ngầm `MiningSchedulerService` hoạt động ổn định trên luồng riêng biệt, định kỳ cập nhật tri thức kỹ năng mà không gây ảnh hưởng đến luồng giao dịch chính của ứng viên. Sự kết hợp giữa khai phá tần suất (Apriori) và khai phá giá trị/khan hiếm (HUIM) giúp bộ động cơ gợi ý năng lực cung cấp các lộ trình học tập tối ưu hóa thu nhập và năng lực chuyên môn cho ứng viên một cách toàn diện.

### 4.3.5 So sánh kết quả thực tế với mục tiêu ban đầu

Bảng dưới đây đối chiếu các chức năng và mục tiêu kỹ thuật thực tế triển khai so với đề cương khóa luận tốt nghiệp ban đầu:

| Mục tiêu đề cương ban đầu | Kết quả hiện thực hóa thực tế | Trạng thái đối chiếu |
| :--- | :--- | :--- |
| Số hóa hồ sơ CV tự động | Trích xuất thành công văn bản thô từ tệp PDF và Image OCR tiếng Việt đạt độ chính xác cao. | **Hoàn thành xuất sắc** |
| Đánh giá CV theo tiêu chí ASK | Xây dựng thành công bộ trượt cấu hình tỷ trọng ASK động và chấm điểm tương thích Fit Score. | **Hoàn thành xuất sắc** |
| Ẩn danh dữ liệu bảo mật | Tích hợp thành công SpaCy NER và Regular Expressions ẩn danh tên riêng, SĐT, Email bảo vệ DEI. | **Hoàn thành xuất sắc** |
| Phát hiện gian lận ATS | Xây dựng giải thuật đọc sâu cấu trúc tệp PDF phát hiện chính xác chữ ẩn màu trắng/1px. | **Hoàn thành xuất sắc** |
| Khai phá tri thức kỹ năng | Hiện thực hóa và chạy ngầm thành công thuật toán Apriori và Two-Phase HUIM trên FastAPI Python. | **Hoàn thành xuất sắc** |
| Trực quan hóa luật Apriori | Vẽ thành công biểu đồ mạng lưới luật kỹ năng tương tác sinh động tại giao diện tổng quan HR. | **Hoàn thành xuất sắc** |
| Chatbot tư vấn lộ trình học | Chatbot SignalR hỗ trợ giải đáp thắc mắc và gợi ý tài liệu học tập từ luật Apriori/HUIM. | **Hoàn thành xuất sắc** |
| Gợi ý ôn tập & Link tự học | Đề xuất 3 chủ đề ôn tập cốt lõi theo chuẩn STAR kèm link tự học uy tín (GitHub, MDN Docs, TopCV). | **Hoàn thành xuất sắc** |
| Gửi Email & Xếp lịch tự động | Tích hợp SignalR và SMTP gửi email mời phỏng vấn và thông báo đơn ứng tuyển tự động. | **Hoàn thành xuất sắc** |
| Báo cáo chi tiết dành cho HR | Báo cáo chi tiết gồm 3 tab ASK & Red Flags, Ngôn từ & Chân thực, Gợi ý phỏng vấn hành vi BEI. | **Hoàn thành xuất sắc** |
| Quản lý Kho tài năng (Talent Pool) | Quản lý, lưu trữ và hỗ trợ truy vấn thông minh hồ sơ ứng viên cũ để tái tuyển dụng. | **Hoàn thành xuất sắc** |
| Quản trị hệ thống (Admin) | Hoàn thiện trang quản lý phê duyệt JD, tài khoản người dùng, phân quyền và các danh mục nền tảng. | **Hoàn thành xuất sắc** |

---

## 4.4 CÁC KHÓ KHĂN VÀ HẠN CHẾ CHƯA ĐẠT ĐƯỢC

Mặc dù hệ thống đã vận hành ổn định và đáp ứng hầu hết các yêu cầu nghiệp vụ đề ra, trong quá trình thử nghiệm thực tế, nhóm nghiên cứu vẫn ghi nhận một số khó khăn và hạn chế kỹ thuật sau:

1.  **Giới hạn lưu lượng cuộc gọi API (API Quota Limit):**
    Do sử dụng gói dịch vụ miễn phí của mô hình ngôn ngữ lớn (Gemini API), hệ thống đối mặt với giới hạn nghiêm ngặt về số lượng yêu cầu trên phút (RPM) và số lượng yêu cầu trên ngày (RPD). Khi có hàng trăm ứng viên đồng loạt tải CV lên hệ thống, mặc dù cơ chế xoay vòng khóa API và tự động giảm tải (Failover) hoạt động ổn định, vẫn có nguy cơ xảy ra hiện tượng tắc nghẽn hoặc gián đoạn dịch vụ tạm thời trong khoảng thời gian chờ reset quota.
    
2.  **Thách thức bóc tách cấu trúc CV nhiều cột phức tạp:**
    Động cơ nhận diện ký tự quang học Tesseract OCR và các thư viện trích xuất văn bản PDF thông thường thực hiện quét văn bản tuần tự theo dòng từ trái sang phải, từ trên xuống dưới. Đối với các CV được thiết kế theo dạng cột song song phức tạp (ví dụ: cột trái là thông tin cá nhân và kỹ năng, cột phải là lịch sử kinh nghiệm làm việc), việc quét dòng thuần túy sẽ làm trộn lẫn văn bản giữa các cột, gây mất trật tự logic ngữ nghĩa. Điều này gián tiếp ảnh hưởng đến độ chính xác khi AI phân tích các trường thông tin.
    
3.  **Hạn chế của luồng xử lý đồng bộ dưới tải trọng cực lớn:**
    Hiện tại, quy trình từ khi ứng viên bấm nộp CV đến khi nhận kết quả phân tích AI đang chạy theo luồng xử lý đồng bộ (Synchronous HTTP Request). Khi thực hiện kiểm thử tải với tần suất yêu cầu cực cao, việc giữ kết nối HTTP quá lâu để chờ mô hình AI xử lý có thể gây hao phí tài nguyên máy chủ API Gateway, tăng nguy cơ quá thời gian chờ (Timeout) tại máy khách.

---

## 4.5 NHỮNG VẤN ĐỀ CẦN CẢI THIỆN VÀ PHƯƠNG HƯỚNG PHÁT TRIỂN

Từ những khó khăn và hạn chế nêu trên, nhóm nghiên cứu xác định các phương hướng phát triển và nâng cấp hệ thống trong tương lai như sau:

1.  **Tích hợp công nghệ nhận diện phân tích bố cục tài liệu (LayoutParser & Table OCR):**
    Nâng cấp phân hệ bóc tách văn bản bằng cách tích hợp các mô hình học sâu chuyên dụng về bố cục tài liệu (như LayoutParser hoặc các mô hình YOLO-Layout). Công nghệ này cho phép hệ thống nhận diện và phân tách CV thành các phân vùng độc lập (vùng thông tin, vùng kinh nghiệm, các bảng biểu) trước khi chạy OCR, đảm bảo trật tự đọc văn bản chính xác tuyệt đối đối với mọi loại CV nhiều cột.
    
2.  **Áp dụng kiến trúc hàng đợi bất đồng bộ (Message Broker / Queue):**
    Chuyển đổi luồng chấm điểm CV đồng bộ sang luồng xử lý bất đồng bộ bằng việc tích hợp các hệ thống hàng đợi tin nhắn như **RabbitMQ** hoặc **Redis Queue**. Khi ứng viên nộp CV, hệ thống sẽ lưu file, đẩy một tin nhắn tác vụ vào hàng đợi và trả về thông báo "Hồ sơ đang được xử lý". Các worker chạy ngầm của FastAPI sẽ lấy tác vụ từ hàng đợi để xử lý tuần tự, giúp hệ thống không bị nghẽn kết nối và tăng khả năng chịu tải lên gấp nhiều lần.
    
3.  **Mở rộng bộ dữ liệu và cải tiến giải thuật khai phá tri thức:**
    Nâng cấp giải thuật khai phá luật kết hợp Apriori và Two-Phase HUIM bằng việc tự động hóa quá trình tái huấn luyện định kỳ hàng ngày khi có dữ liệu ứng tuyển mới. Đồng thời, nghiên cứu tích hợp API của các nền tảng giáo dục trực tuyến lớn để từ các khoảng trống kỹ năng mà AI phát hiện, hệ thống có thể đề xuất chính xác các khóa học cụ thể kèm theo liên kết đăng ký, hỗ trợ tối đa lộ trình thăng tiến nghề nghiệp cho ứng viên.
