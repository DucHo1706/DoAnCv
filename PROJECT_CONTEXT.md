# Hồ sơ ngữ cảnh dự án RecruitInsightAI

> Cập nhật nền: 2026-08-22. Đây là nguồn ngữ cảnh bền vững cho các phiên làm việc sau. Code và dữ liệu thực tế vẫn là nguồn xác minh cuối cùng.

## 1. Mục tiêu đề tài

Xây dựng hệ thống website tích hợp AI để số hóa, phân tích, đối khớp và xếp hạng hồ sơ tuyển dụng. Hệ thống hỗ trợ ba nhóm chính:

- Ứng viên: quản lý/tải lên/tạo CV, ứng tuyển, xem trạng thái, xem báo cáo năng lực và gợi ý việc làm.
- HR: quản lý tin, tiếp nhận và sàng lọc hồ sơ, xem giải thích điểm, quản lý ứng viên, liên hệ và phỏng vấn.
- Admin: quản lý người dùng, danh mục, duyệt tin, thống kê và phân tích dữ liệu tuyển dụng.

Trọng tâm khác biệt của đề tài không phải chỉ là gọi Gemini, mà là một quy trình có thể giải thích:

`CV/JD -> trích xuất -> chuẩn hóa -> tiêu chí có trọng số -> đối khớp -> bằng chứng -> xếp hạng -> HR ra quyết định`.

AI chỉ hỗ trợ quyết định; không tự động loại ứng viên và không thay HR ra quyết định cuối cùng.

## 2. Kiến trúc và công nghệ cần giữ nhất quán

- Frontend: ReactJS, giao diện tiếng Việt, dùng chung style system của project.
- Backend nghiệp vụ: ASP.NET Core, ORM và SQL Server.
- AI service: FastAPI/Python.
- Trích xuất tài liệu: PyPDF2 cho PDF có text; DOCX parser; `pdf2image`/Pillow/Tesseract `vie+eng` cho ảnh hoặc PDF scan.
- NLP/đối khớp: spaCy, scikit-learn/TF-IDF và phần phân tích ngữ nghĩa chuyên sâu khi Gemini khả dụng.
- Khai phá dữ liệu: Apriori/HUIM nhưng phải chạy trên dữ liệu thật, theo phạm vi ngành nghề và công khai điều kiện đầu vào.
- Triển khai: Docker trên VPS; Git là nguồn phát hành nhưng push Git không đồng nghĩa đã deploy VPS.
- Giao tiếp nội bộ Docker dùng hostname service (`backend`, `ai-service`); `AllowedHosts` của ASP.NET phải cho phép đúng hostname nội bộ cần thiết, không mở wildcard chỉ để vận hành tiện.

## 3. Các quyết định nghiệp vụ đã thống nhất

### 3.1 CV và hồ sơ ứng tuyển

- CV tải lên, CV mặc định và CV tạo trực tuyến là các nguồn khác nhau nhưng phải được hiển thị tên thân thiện, không lộ UUID/tên lưu trữ nội bộ.
- CV Builder phải lưu được nhiều CV, sửa/đổi tên/xóa, đặt mặc định và tạo PDF snapshot khi ứng tuyển.
- Snapshot đã nộp là bất biến; ứng viên sửa CV Builder sau đó không làm thay đổi hồ sơ HR đang xét.
- Hồ sơ ứng tuyển phải lưu dữ liệu tại thời điểm nộp, không chỉ tham chiếu profile có thể thay đổi.
- CV không đủ nội dung không được gắn nhãn “không phù hợp 0%”. Trạng thái đúng là “Chưa thể đánh giá — không đủ dữ liệu”.
- Trạng thái phân tích tối thiểu: thành công, một phần, không đủ dữ liệu, lỗi dịch vụ.

### 3.2 Chấm điểm và tiêu chí

- Điểm phải minh bạch theo từng tiêu chí, kèm yêu cầu JD, bằng chứng CV, kết luận, điểm và độ tin cậy trích xuất.
- Không nên thưởng số lượng công việc. Một kinh nghiệm backend dài, liên tục và có bằng chứng có thể giá trị hơn nhiều công việc backend rất ngắn.
- Gap thời gian là thông tin để HR làm rõ, không mặc định là điểm trừ.
- Khoảng thời gian chồng lắp phải hợp nhất trước khi tính tổng kinh nghiệm.
- Cần tính cả tổng kinh nghiệm liên quan và kinh nghiệm theo từng kỹ năng/lĩnh vực.

### 3.3 Tin tuyển dụng

- Phân tích AI sử dụng chủ yếu mô tả công việc, yêu cầu ứng viên và tiêu chí đánh giá; quyền lợi không được trộn vào tín hiệu chấm kỹ năng.
- “Đăng lại tin” phải tạo đợt tuyển dụng mới có liên kết với tin gốc, không mở lại cùng bản ghi khiến hồ sơ cũ và mới bị trộn.
- Tin đăng lại vẫn qua quy trình duyệt nếu quy tắc hiện hành yêu cầu duyệt.

### 3.4 Thống kê theo ngày

- “Mới hôm nay” phải dựa trên sự kiện phát sinh trong ngày, không đếm trạng thái hiện tại.
- Cần lưu lịch sử chuyển trạng thái để thống kê đúng: hồ sơ mới, đã xem, mời phỏng vấn, tuyển thành công/từ chối trong ngày.
- Lưu thời gian UTC; quy đổi ngày báo cáo theo múi giờ Việt Nam.
- Phải định nghĩa rõ “tuyển được người”: trạng thái `HIRED/ACCEPTED` hoặc sự kiện tương đương, không suy luận từ việc gửi email.

### 3.5 Tìm ứng viên chủ động

- HR cần tìm ứng viên tiềm năng theo kỹ năng, số năm liên quan, vị trí, địa điểm và dữ liệu CV đã cho phép sử dụng.
- Kết quả phải có lý do/bằng chứng phù hợp, không chỉ điểm số.
- Cần kiểm soát quyền riêng tư, phạm vi dữ liệu và tránh liên hệ trùng/làm phiền ứng viên.

### 3.6 Khai phá kỹ năng

- Apriori/HUIM không được chạy gộp mọi ngành rồi kết luận chung.
- Mỗi lần chạy cần có phạm vi ngành/vị trí, taxonomy và alias kỹ năng, số CV, khoảng thời gian, tham số, phiên bản thuật toán và dấu vân tay dữ liệu.
- Không có dữ liệu mới thì bỏ qua huấn luyện/khai phá và ghi rõ lý do.
- Không tự chèn dữ liệu mẫu vào kết quả production. Dữ liệu quá ít phải hiển thị “chưa đủ dữ liệu”.
- “Kỹ năng đắt giá” chỉ có ý nghĩa trong phạm vi tập dữ liệu; tập CV thiên về fresher sẽ làm kết quả thiên lệch và phải được công bố.

### 3.7 Quản trị taxonomy và vòng lặp khai phá

- Bảng `Skills` trong SQL Server là nguồn taxonomy đã duyệt. Python không dùng `skills.json` lịch sử hoặc danh sách ngành/kỹ năng viết cứng làm đáp án runtime.
- Bảng `SkillAliases` ánh xạ nhiều cách viết về một tên kỹ năng chuẩn. Chuẩn hóa ký hiệu/chính tả dùng quy tắc chung; quan hệ đồng nghĩa thật phải đến từ alias SQL và được dùng thống nhất cho extraction, scoring, Apriori và Two-Phase HUIM.
- Kỹ năng mới trích xuất từ CV chỉ được đưa vào hàng chờ quan sát; không tự duyệt, không tự tham gia chấm điểm hoặc khai phá.
- Catalog nền trong migration là dữ liệu tham chiếu có thể kiểm toán/rollback, không phải giao dịch huấn luyện. Support, confidence và utility chỉ được tính từ CV/JD đủ điều kiện trong database.
- Domain của CV được lấy từ lần ứng tuyển, context HR đã lưu hoặc độ giao nhau với hồ sơ kỹ năng của các job theo Category hiện có; không dùng bảng ánh xạ 5 ngành cố định.
- Scheduler kiểm tra ở lúc khởi động và 02:00 giờ Việt Nam. Fingerprint không đổi thì bỏ qua; mỗi domain đủ tối thiểu 5 CV được khai phá riêng và lưu model riêng.
- Kết quả Apriori/HUIM chỉ bổ sung ngữ cảnh gợi ý cho phân tích chuyên sâu; không được dùng làm bằng chứng CV, không tự cộng/trừ điểm và không tạo red flag.

### 3.8 Talent Pool và quyền sở hữu dữ liệu HR

- Mỗi bản ghi Talent Pool thuộc một Recruiter; cùng ứng viên có thể được nhiều HR lưu độc lập với note/giai đoạn/context riêng.
- Tìm ứng viên và Talent Pool là hai luồng tách biệt: trang tìm kiếm xem hồ sơ ứng viên đã cấp quyền; thao tác lưu mới tạo context sourcing để HR quản lý lâu dài.
- Context sourcing phải tái sử dụng Category/Position/JobLevel có sẵn; trạng thái sourcing là tiến độ nội bộ của HR, không phải trạng thái ứng tuyển và không chứng minh năng lực.

### 3.9 Cấp bậc nghề nghiệp dùng chung

- JobLevel chỉ biểu diễn seniority/phạm vi trách nhiệm; loại hợp đồng, part-time, freelance, remote/hybrid không phải cấp bậc.
- Danh mục chuẩn gồm 5 nhóm: khởi đầu nghề nghiệp, chuyên môn cá nhân, quản lý tuyến đầu, quản lý cấp cao và điều hành.
- Các tên Việt/Anh đồng nghĩa phải quy về một bản ghi hoạt động; bản ghi cũ được chuyển tham chiếu và khóa thay vì xóa lịch sử.
- `Director` là quản lý cấp cao theo chức năng; `C-level` là lãnh đạo điều hành và không được gộp thành một cấp.
- UI chỉ cho chọn cấp bậc con; nhóm cha dùng để tổ chức danh mục, không phải giá trị gắn trực tiếp vào tin hoặc sourcing.

### 3.10 Dữ liệu benchmark hư cấu

- Dữ liệu hư cấu được phép dùng để kiểm thử độ bao phủ, nhánh lỗi và tính nhất quán nhưng không được trình bày là dữ liệu thị trường hoặc độ chính xác thực tế.
- Benchmark nội dung chạy offline, không đọc database/backend/Gemini; CNTT là trục dữ liệu sâu, các ngành còn lại dùng làm đối chứng tách domain.
- Mỗi JD phải được thử với ít nhất 15 CV khác nhau và đủ năm trường hợp: bằng chứng mạnh, thiếu kỹ năng ưu tiên, thiếu số tháng kinh nghiệm, có nền tảng chuyển đổi và diễn đạt cần xác minh. Các quan hệ cùng vị trí/cùng ngành/trái ngành chỉ kiểm tra thứ tự điểm, không thay cho tập CV thật đã ẩn danh.
- CV/JD test phải đủ section và đủ dài; bộ test quá ngắn chỉ chứng minh đối chiếu keyword đơn giản.

### 3.11 Vòng đời tin tuyển dụng và trạng thái phân tích AI

- `Published` là trạng thái đã được Admin duyệt, không tự đồng nghĩa tin đang tuyển. Tin chỉ đang tuyển khi đã đến ngày bắt đầu và chưa qua hết ngày hạn tuyển theo giờ Việt Nam.
- Đăng lại tin hết hạn phải sao chép thành bản ghi `Pending` mới, tăng vòng tuyển và giữ liên kết chiến dịch; hồ sơ của vòng cũ không bị chuyển sang vòng mới.
- Thao tác Đăng lại phải mở form tạo tin đầy đủ đã điền dữ liệu nguồn để HR chỉnh lĩnh vực, vị trí, cấp bậc, chi nhánh, lương, mô tả, yêu cầu, số lượng và tiêu chí. Không dùng popup rút gọn; nút phải có ở danh sách và trang chi tiết. Ngày mới mặc định từ hôm nay đến 30 ngày thay vì sao chép hạn đã hết.
- Báo cáo AI dùng fallback cục bộ vẫn được lưu để không mất kết quả, nhưng phải ghi rõ `is_fallback=true` và được xem là phân tích một phần. Người dùng được xem kết quả hiện có và chạy lại khi Gemini khả dụng.
- Điểm phù hợp với job và điểm diễn đạt là hai thang đo độc lập; điểm diễn đạt không được cộng vào điểm đáp ứng tiêu chí tuyển dụng.
- Cảnh báo AI chỉ được hiển thị khi hệ thống truy hồi được đoạn gần-nguyên-văn trong CV đã trích xuất và phải thay câu AI trả về bằng đúng đoạn gốc. Được phép bỏ qua dấu câu/xuống dòng và một sai khác ký tự nhỏ; thay số, thay phủ định hoặc diễn giải lại phải bị loại.
- Thứ tự API key Gemini trong cấu hình là thứ tự ưu tiên vì không thể suy ra paid/free từ chuỗi key. 503/504/timeout phải thử thêm project key cho cùng model trong ngân sách hữu hạn; chỉ cooldown model sau khi nhiều key/project cùng lỗi.
- Trích xuất tài liệu không được chọn một chuỗi chỉ vì dài và có đủ tiêu đề CV. Các kết quả PyPDF2/pdfplumber/OCR/Vision phải có chỉ số đồng thuận; nguồn raster chưa được xác nhận hoặc các nguồn độc lập mâu thuẫn phải dừng ở `Không đủ dữ liệu`, không chuyển văn bản nghi sai sang chấm điểm/NLP/mining.

## 4. Khoảng trống đã xác định trong code/hệ thống

Những điểm dưới đây là kết quả khảo sát trước đó và phải kiểm tra lại trên branch hiện tại trước khi sửa:

- Dashboard từng đếm `newApplications` theo trạng thái `Applied` hiện tại thay vì ngày tạo/sự kiện hôm nay.
- Chưa có lịch sử trạng thái đầy đủ và chưa có định nghĩa nhất quán cho `Hired/Accepted`.
- Luồng mở lại tin từng dùng cùng ID, có nguy cơ trộn cohort ứng viên.
- Apriori từng đọc toàn bộ `CandidateCVs` và chèn mock data khi ít hơn 5 hồ sơ.
- HUIM từng chạy toàn cục; utility/quantity có công thức suy diễn từ độ dài chuỗi và có fallback mock, không có ý nghĩa nghiệp vụ.
- Phân tích kỹ năng Admin từng nằm trong dashboard thu gọn, khó tìm và thiếu bộ lọc ngành nghề.
- `JobCriterion` từng chỉ có tên và trọng số; AI chỉ nhận tên/trọng số nên không biết bằng chứng nào cần đọc trong CV.
- `CandidateCV` từng chỉ có tổng `YearsOfExperience`, chưa có danh sách kinh nghiệm và timeline chuẩn hóa.
- Bộ dữ liệu minh chứng trước đây quá ít, chủ yếu khoảng 3 mẫu CV và chưa bao quát layout phức tạp.

### 4.1 Bản đồ và nợ kỹ thuật module Python

- `Python/README.md` là tài liệu tra cứu chính cho entry point, endpoint, hàm xử lý, input/output thuật toán và luồng gọi từ ASP.NET Core.
- Parser runtime hiện tại là `services/doc_parser_service.py`; `pdf_extractor.py` là implementation cũ không còn được gọi.
- `cv_analysis_service.py` đang là orchestration service nhưng còn gộp cache, extraction, scoring, preview và tự học kỹ năng.
- `scoring_service.py` còn gộp scoring, chatbot, kiểm tra tài liệu và language review.
- Validation tiêu chí dùng chung đã được đưa vào `services/criterion_validation_service.py`; đây là điểm mở rộng an toàn cho `P0-01`.
- Chưa được di chuyển/đổi tên hàng loạt hai service lớn cho đến khi có contract test bảo vệ response của `/score-cv`, `/score-cv-text` và `/analyze-cv-preview`.
- File JSON Apriori/HUIM/skills là dữ liệu runtime và hiện có thay đổi chưa commit từ trước; phải bảo toàn khi refactor.

### 4.2 Đính chính sau audit ngày 2026-08-21

- `cv_analysis_service.py` không còn tự đẩy kỹ năng LLM/OCR vào taxonomy. Taxonomy runtime được đồng bộ từ `Skills.IsApproved` và lưu ở volume runtime riêng.
- Apriori/HUIM không còn mock transaction, không còn taxonomy IT mặc định và không còn chạy một domain viết cứng. Kết quả được lưu tách theo domain; model domain cũ bị loại khi bắt đầu chu kỳ khai phá thành công mới.
- `CandidateCvDomainService` không còn bảng ánh xạ kỹ năng cho 5 ngành. Hồ sơ ngành được xây từ Category/job/application/context sourcing trong database và chỉ dùng skill đã duyệt.
- Parser dùng nhiều candidate PyPDF2/pdfplumber/layout/OCR, chấm cả chất lượng và mức đồng thuận. PDF local chưa đủ/không thống nhất và ảnh OCR chưa được xác nhận sẽ dùng Gemini Vision làm nguồn đối chiếu cuối; kết quả độc lập mâu thuẫn bị chặn trước NLP/chấm điểm. Lỗi OCR không được chuyển thành cảnh báo năng lực ứng viên.
- Corpus parser local có 15 CV hư cấu dài trên 15 dạng PDF/DOCX/ảnh/scan/bảng/cột/ngôn ngữ khác nhau và 1 tài liệu đối chứng không phải CV. Lần audit 2026-08-22 đạt 16/16 theo ngưỡng sử dụng; tên giữ nguyên dấu 13/15 và nhận diện được 15/15 sau chuẩn hóa dấu OCR. Đây là smoke test parser/validation trên dữ liệu tổng hợp, không phải phép đo độ chính xác thị trường.
- Benchmark nội dung offline sinh 1.170 CV dài, 162 JD, 54 vị trí/8 ngành/3 cấp bậc và 3.510 cặp đối sánh; CNTT có 12 vị trí và chiếm 46,2% số CV. Mỗi CV có tối thiểu 1.791 từ, hai dự án và bằng chứng theo kỹ năng; nhãn kịch bản nằm ngoài text đầu vào để tránh rò đáp án. Mỗi JD có 15–40 CV thuộc đủ năm trường hợp. Lần đo local 2026-08-22 đạt thứ tự điểm 1.164/1.170, timeline 1.170/1.170, skill fixture 100% và kiểm tra phép tính Apriori/HUIM theo 8 domain. Sáu ngoại lệ được giữ để không ép điểm nhân tạo cho kỹ năng chuyển đổi. Đây vẫn là bằng chứng synthetic, không phải accuracy trên CV thật.
- Timeline chỉ tính mốc trong section kinh nghiệm khi nhận diện được heading; ngày dự án/học vấn không còn mặc nhiên bị cộng vào tổng kinh nghiệm. CV không có heading rõ vẫn dùng fallback toàn văn với độ chắc chắn thấp hơn.
- Danh mục SQL hiện có 5 nhóm + 14 cấp bậc con hoạt động; sáu alias cũ đã được hợp nhất/khóa. Lần khởi động kiểm tra cũng kích hoạt scheduler hiện hữu và cập nhật phân loại domain cho 1 CV; vòng sau fingerprint không đổi nên bỏ qua mining.
- Talent Pool đã áp migration bổ sung `RecruiterID` và unique `(RecruiterID, CandidateID)` lên database cấu hình hiện tại; backend khởi động và health check local thành công. Chưa smoke test luồng Talent Pool theo vai trò trên trình duyệt hoặc deploy VPS.
- Vòng đời tin đã dùng chung `JobLifecyclePolicy`; migration thêm quan hệ tin gốc/nhóm chiến dịch/vòng tuyển đã được áp lên database cấu hình hiện tại. Ngày 2026-08-21 có 19 tin thực sự đang tuyển và 57 tin `Published` đã hết hạn; chênh lệch trước đây là do UI coi trạng thái duyệt là trạng thái hiển thị, không phải lệch múi giờ SQL.
- Gemini mặc định đã bỏ model 2.5 ngừng cấp cho tài khoản mới, dùng chuỗi 3.x có failover 404/429/503 và timeout. Phân tích ngôn từ fallback không còn được coi là báo cáo AI hoàn chỉnh; dữ liệu lịch sử cần chạy lại để nhận kết quả Gemini mới.

## 5. Thiết kế tiêu chí đánh giá cần triển khai

Chỉ có “tên tiêu chí + mức ưu tiên” là chưa đủ. Mỗi tiêu chí nên có cấu trúc tối thiểu:

- `CriterionType`: kỹ năng bắt buộc, kỹ năng ưu tiên, kinh nghiệm tổng, kinh nghiệm kỹ năng, học vấn, chứng chỉ, ngôn ngữ, địa điểm/hình thức làm việc hoặc tiêu chí tùy chỉnh.
- `TargetValue`: ví dụ `ASP.NET Core`, `3 năm`, `TOEIC 650`.
- `Operator`: có, không có, tối thiểu, tối đa, bằng, thuộc tập giá trị.
- `Weight`: trọng số; tổng trọng số cần được kiểm tra/chuẩn hóa.
- `IsMandatory`: điều kiện bắt buộc nhưng không nên tự động loại nếu dữ liệu trích xuất có độ tin cậy thấp.
- `EvidenceSource`: kỹ năng, kinh nghiệm, học vấn, dự án, chứng chỉ hoặc toàn văn.
- `MinDurationMonths`: thời lượng liên quan tối thiểu nếu áp dụng.
- `RecencyMonths`: yêu cầu tính gần đây nếu có nghiệp vụ rõ ràng.
- `Description/Guidance`: hướng dẫn HR nhập tiêu chí và AI tìm bằng chứng.

Nguyên tắc tính điểm dự kiến:

1. Parser tạo dữ liệu CV có cấu trúc và bằng chứng nguồn.
2. Bộ luật xác định phần đạt định lượng: kỹ năng, thời lượng, chứng chỉ, học vấn.
3. AI ngữ nghĩa chỉ hỗ trợ nhận diện tương đương và giải thích, không được bịa dữ kiện.
4. Điểm tiêu chí = mức đáp ứng x trọng số, kèm confidence.
5. Tiêu chí bắt buộc thiếu bằng chứng được gắn “Cần HR xác minh”; chỉ kết luận không đạt khi dữ liệu đủ tin cậy.

## 6. Backlog ưu tiên

| Mã | Công việc | Trạng thái | Phụ thuộc | Tiêu chí nghiệm thu chính |
|---|---|---|---|---|
| P0-00 | Lập bản đồ và tổ chức module Python giai đoạn 1 | ĐÃ XONG | Không | Có README tra cứu, validation dùng chung, test và compile thành công |
| P0-01 | Chuẩn hóa mô hình tiêu chí đánh giá | ĐANG LÀM | Kiểm tra schema hiện tại | HR tạo được tiêu chí có kiểu, toán tử, giá trị, trọng số và nguồn bằng chứng; dữ liệu cũ vẫn đọc được |
| P0-02 | Chuẩn hóa experience timeline | ĐÃ XONG | Parser CV | Hoàn thành nền tảng local: hợp nhất overlap, tính tổng liên quan/theo kỹ năng, phát hiện gap và lưu bằng chứng; chưa deploy VPS |
| P0-03 | Lịch sử trạng thái và thống kê trong ngày | ĐANG LÀM | Thống nhất trạng thái | Dashboard HR/Admin có số hôm nay đúng theo sự kiện và múi giờ VN |
| P1-01 | HR chủ động tìm ứng viên | ĐANG LÀM | P0-01, quyền riêng tư | Đã có MVP opt-in và tìm/lọc hồ sơ rút gọn; còn smoke test endpoint và hoàn thiện luồng mời/liên hệ |
| P1-02 | Đăng lại tin tuyển dụng | ĐANG LÀM | Luồng duyệt tin | Code/API/UI/migration và public smoke test đã đạt; còn smoke test thao tác đăng lại bằng tài khoản HR và duyệt vòng mới bằng Admin |
| P2-01 | Phân tích kỹ năng theo ngành | ĐANG LÀM | Taxonomy kỹ năng | Đã bỏ domain/skill hard-code runtime, áp catalog SQL đã duyệt và chạy startup mining cho 4 ngành; còn kiểm chứng chất lượng trên dataset thật nhiều ngành |
| P2-02 | Sửa mô hình HUIM/Apriori và cơ chế skip | ĐANG LÀM | P2-01 | Đã tách model theo domain, fingerprint gồm alias, backend/Python chạy startup + 02:00 và có metadata; còn kiểm chứng utility lương trên dữ liệu thật |
| P2-03 | Trang Admin AI Insights riêng | CHƯA LÀM | P2-01 | Điều hướng rõ, filter và giải thích giới hạn dữ liệu |
| P3-01 | Bộ tối thiểu 15 CV kiểm thử | ĐÃ XONG | Danh sách ngành/mẫu | 15 CV hư cấu dài, đa định dạng/layout + 1 PDF không phải CV, có ground truth và audit tự động đạt 16/16 local |
| P3-02 | Test nghiệp vụ/API/UI/AI | ĐANG LÀM | Các task trên | Có 75 unit test Python, build backend/frontend, migration script, parser corpus và benchmark offline đạt; còn test API theo role và E2E trình duyệt |
| P3-03 | Benchmark và bằng chứng báo cáo | ĐANG LÀM | P3-01, P3-02 | Đã có parser corpus và benchmark offline 1.170 CV/162 JD/3.510 cặp, tối thiểu 15 CV/JD; còn p95 end-to-end có Gemini, tải đồng thời và dữ liệu CV thật đã ẩn danh nếu muốn kết luận accuracy thực tế |

## 7. Ma trận CV kiểm thử tối thiểu

Ít nhất 15 mẫu, không dùng thông tin cá nhân thật:

1. PDF một cột có text, ứng viên phù hợp cao.
2. PDF một cột có text, phù hợp thấp.
3. PDF hai cột.
4. PDF dùng bảng.
5. PDF scan rõ.
6. PDF scan mờ/nghiêng.
7. Ảnh JPG rõ.
8. Ảnh PNG có nền/phần trang trí.
9. DOCX chuẩn.
10. DOCX dùng bảng/text box.
11. CV tiếng Việt.
12. CV tiếng Anh.
13. CV song ngữ.
14. CV có khoảng thời gian kinh nghiệm chồng lắp và gap.
15. File không phải CV hoặc CV thiếu nội dung đánh giá.

Mỗi mẫu cần expected result cho: đọc file, trường trích xuất, trạng thái chất lượng dữ liệu, timeline, tiêu chí và thứ hạng.

## 8. Rủi ro và giới hạn phải nói đúng khi phản biện

- Gemini có thể chậm/hết quota/lỗi; kết quả cốt lõi cần có đường dự phòng minh bạch nhưng không giả là phân tích chuyên sâu.
- OCR phụ thuộc chất lượng scan và layout; không thể đồng nhất lỗi đọc với năng lực ứng viên.
- Mục tiêu độ chính xác `>= 70%` chỉ được nói là “đạt” sau khi có bộ dữ liệu gán nhãn và phép đo.
- Mục tiêu dưới 3 giây cần tách theo giai đoạn; OCR và phân tích Gemini bất đồng bộ có thể vượt mức này.
- Khả năng xử lý 1.000 CV cần chứng minh bằng test tải, không suy luận từ vài request JMeter.
- Luật kết hợp phản ánh dữ liệu quan sát, không tự chứng minh kỹ năng có giá trị trên thị trường.

## 9. Định nghĩa hoàn thành khi triển khai lên VPS

- Code đã commit/push đúng branch.
- VPS pull đúng commit.
- Docker image được build lại và container mới đang healthy.
- Migration chạy thành công, dữ liệu cũ không mất.
- Kiểm tra ít nhất health endpoint, đăng nhập theo vai trò, API thay đổi và UI HTTPS.
- Kiểm tra log backend/Python/frontend proxy không có lỗi mới nghiêm trọng.
- Ghi commit hash, thời gian deploy và kết quả smoke test trong `WORK_LOG.md`.

## 10. Nhật ký quyết định

- 2026-08-22: Không dùng 1.170 CV text cùng cấu trúc để chứng minh khả năng đọc nhiều layout. Bằng chứng được tách thành benchmark nội dung 1.170 CV chi tiết và corpus parser 15 CV dài trên 15 định dạng/bố cục; ground truth không nằm trong text CV. Tác động: báo cáo trả lời đúng hai câu hỏi độc lập về đối sánh nội dung và chất lượng trích xuất, đồng thời công khai lỗi mất dấu OCR còn lại.
- 2026-08-22: Taxonomy/alias chạy nền ở cả backend và Python lúc khởi động và 02:00 giờ Việt Nam; fingerprint backend bao gồm `SkillAliases`, Python thay file taxonomy atomically rồi reload trong tiến trình. Không xây UI Admin theo dõi thuật toán; trạng thái chỉ nằm trong log/metadata kỹ thuật.
- 2026-08-22: Alias kỹ năng trở thành dữ liệu taxonomy có cấu trúc trong SQL (`SkillAliases`), không còn là dictionary viết cứng trong Python. CV/JD, dữ liệu lịch sử trước mining và đầu vào gợi ý đều được quy về canonical skill; Apriori/HUIM nhận cả taxonomy và alias cùng dataset metadata. Tác động: các cách viết như `Node.js`, `NodeJS`, `Node JS` không chia nhỏ support/utility; alias mới cần Admin duyệt, không tự suy đoán đồng nghĩa. Trên báo cáo, toàn bộ skill nhận diện được tách khỏi tập skill khớp job.
- 2026-08-22: Chất lượng extraction không còn được suy ra từ độ dài/cấu trúc một nguồn duy nhất. Parser tính đồng thuận token giữa nguồn độc lập, dùng OCR/Vision để đối chiếu khi cần và đặt `analysis_safe=false` khi mâu thuẫn; mọi endpoint phải trả `Không đủ dữ liệu` trước khi NLP/Gemini chấm nội dung. Tác động: giảm lỗi dây chuyền do OCR “trông hợp lệ” nhưng sai, đổi lại một số scan khó có thể bị từ chối thận trọng và cần tệp rõ hơn.
- 2026-08-22: Đăng lại tin dùng form đầy đủ tái sử dụng màn hình tạo/sửa, không dùng modal. Backend nhận toàn bộ dữ liệu đã chỉnh nhưng vẫn tạo bản ghi `Pending` mới có liên kết nguồn và vòng tuyển; tác động là HR chỉnh được tiêu chí mà không làm thay đổi lịch sử đợt cũ.
- 2026-08-22: Hậu kiểm bằng chứng chuyển từ so chuỗi tuyệt đối sang truy hồi token gần-nguyên-văn có kiểm soát và luôn trả đoạn nguồn CV. Chỉ cho phép sai khác định dạng/ký tự nhỏ, không cho phép đổi số/phủ định/paraphrase; log gộp số cảnh báo bị loại và nói rõ đây là chống bịa bằng chứng.
- 2026-08-22: Failover Gemini giữ thứ tự key cấu hình để có thể đặt project paid trước project free. Mỗi attempt mặc định 15 giây và tối thiểu 10 giây; sau hai key/project cùng 503/504/timeout thì chuyển model và phân bổ ngân sách theo bốn attempt mục tiêu trong tổng 60 giây. Model/key chưa được gọi do hết ngân sách không bị log sai là hỏng hoặc hết quota.
- 2026-08-22: Trạng thái duyệt và vòng đời tuyển dụng là hai chiều khác nhau. `Published` hết hạn không được gọi là “đang hiển thị”; đăng lại tạo vòng `Pending` mới có liên kết nguồn/nhóm chiến dịch, giữ nguyên hồ sơ vòng cũ. Tác động: dashboard, danh sách HR/Admin, apply, chatbot và gợi ý Talent Pool dùng cùng chính sách ngày Việt Nam.
- 2026-08-22: Kết quả `language_review.is_fallback=true` là phân tích một phần, không phải Gemini hoàn chỉnh. UI chỉ gắn nhãn ngắn “Rà soát cục bộ”, cho xem kết quả hiện có và cho chạy lại; không dùng điểm diễn đạt để thay đổi điểm phù hợp job.
- 2026-08-22: Benchmark synthetic được mở rộng thành 1.170 CV/3.510 cặp với tối thiểu 15 CV mỗi JD và năm trường hợp bằng chứng. Sáu ngoại lệ kỹ năng chuyển đổi được giữ lại; không gọi tỷ lệ nhất quán này là accuracy thị trường.
- 2026-08-22: Chuỗi model Gemini mặc định chuyển sang các model 3.x còn được tài khoản hiện tại gọi thành công; 404 loại model trong tiến trình, 429 đổi key và 503 chuyển model ngay với cooldown. Danh sách/quota vẫn phải kiểm tra lại theo tài liệu và AI Studio vì có thể thay đổi.
- 2026-08-21: Migration ownership Talent Pool phải thêm `RecruiterID` trong batch SQL riêng trước khi backfill vì SQL Server resolve tên cột lúc biên dịch batch; dữ liệu trùng theo cùng recruiter/candidate chỉ bỏ owner ở bản cũ, không xóa hồ sơ. Hai migration ownership/catalog đã được áp lên database cấu hình hiện tại và health local đạt; trạng thái này không đồng nghĩa đã deploy VPS.
- 2026-08-21: Theo phạm vi khóa luận không thương mại, chấp nhận local Development kết nối trực tiếp database production dùng chung và tiếp tục gọi `Database.MigrateAsync()` khi backend khởi động để cập nhật schema nhanh. Hai việc “tách database Development/production” và “bỏ auto-migrate” không còn thuộc backlog hiện tại. Tác động: phải giữ `EnableTestJobSeed=false`, migration phải idempotent/bảo toàn dữ liệu và lỗi startup phải được xử lý trước khi tiếp tục test; không áp dụng quyết định này như khuyến nghị cho hệ thống thương mại.
- 2026-08-21: Loại toàn bộ whitelist domain/kỹ năng khỏi code runtime của Apriori/HUIM và phân loại domain CV. SQL `Skills.IsApproved` là taxonomy chuẩn; Category/job/application/Talent Pool là nguồn phạm vi ngành. Dữ liệu catalog migration chỉ là reference data, không tự sinh luật hoặc điểm.
- 2026-08-21: Mỗi chu kỳ mining chạy theo từng Category đủ dữ liệu, lưu model domain riêng và reset model cũ khi chu kỳ mới bắt đầu thành công. Scheduler kiểm tra ngay khi backend khởi động rồi lúc 02:00; fingerprint ổn định và không đổi thì skip.
- 2026-08-21: Kết quả khai phá chỉ được truyền vào Gemini dưới nhãn context gợi ý với ràng buộc không dùng làm bằng chứng/điểm/red flag. Utility HUIM hiện là lương tối đa trung bình quan sát ở các JD có kỹ năng, không đồng nghĩa kỹ năng hiếm hay giá thị trường.
- 2026-08-21: Dữ liệu test job có mã nhận diện nội bộ nhưng giao diện dùng mã công khai từ GUID; marker kỹ thuật không nằm trong tiêu đề/mô tả. Seeder mặc định tắt và không được bật nhầm trên production.

- 2026-08-21: Tách HR candidate discovery thành trang `/recruiter/candidate-search`, không dùng popup; quyền hiển thị hồ sơ được đặt trong tab Cài đặt tài khoản ứng viên. Điểm AI trên trang này được ghi rõ là điểm cao nhất từng lưu, không coi là điểm phù hợp mới theo một job chưa chọn.

- 2026-08-21: Triển khai MVP HR chủ động tìm ứng viên theo nguyên tắc opt-in. Hồ sơ mặc định riêng tư; ứng viên bật riêng quyền xuất hiện trong tìm kiếm và quyền cho phép liên hệ. Kết quả tìm kiếm không trả email, điện thoại hoặc URL CV; địa điểm được rút gọn khi chưa cho phép liên hệ. Tác động: giảm lộ dữ liệu cá nhân và giữ quyết định liên hệ ở phía ứng viên/HR; P1-01 vẫn cần smoke test với dữ liệu thực tế.

- 2026-08-19: Dùng `PROJECT_CONTEXT.md` làm bộ nhớ kiến trúc/nghiệp vụ; `WORK_LOG.md` làm lịch sử thực thi; `AGENTS.md` buộc mọi phiên đọc và cập nhật hai file.
- 2026-08-19: Ưu tiên nền dữ liệu tiêu chí, timeline và status history trước các màn hình phân tích/thống kê mới.
- 2026-08-19: Không dùng số lượng công việc như đại diện cho độ sâu kinh nghiệm; tính thời lượng hợp nhất và mức liên quan.
- 2026-08-19: Phân tích Apriori/HUIM phải theo ngành/vị trí và không được tự chèn mock data trong production.
- 2026-08-20: Mốc chỉ có năm trùng năm hiện tại không được xem là thời gian tương lai; quy đổi tháng kết thúc về tháng phân tích, gắn cờ cần xác minh và hậu kiểm cảnh báo AI bằng ngày cùng chất lượng extraction.
- 2026-08-20: Đoạn trích từ CV chỉ là bằng chứng rằng nội dung xuất hiện trong hồ sơ, không chứng minh lời khai đúng ngoài đời; hệ thống không kết luận CV do AI tạo, ứng viên gian dối hay nội dung chân thực khi chưa có nguồn đối chứng.
- 2026-08-20: OCR CV Việt/Anh bắt buộc dùng Tesseract `vie+eng`; thiếu `vie` phải báo lỗi cấu hình/không đủ dữ liệu, không được fallback ngầm sang `eng` vì text sai sẽ làm sai toàn bộ phân tích AI phía sau.
