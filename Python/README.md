# AI Service — RecruitInsightAI

Đây là bản đồ tra cứu module Python khi phát triển và vấn đáp. Python thực hiện xử lý CV, đối khớp AI và khai phá kỹ năng; ASP.NET Core quản lý dữ liệu nghiệp vụ, phân quyền và quyết định tuyển dụng.

Nếu cần đọc source theo đúng thứ tự từ lúc ứng viên nộp CV đến khi lưu điểm, xem [`SOURCE_FLOW_GUIDE.md`](SOURCE_FLOW_GUIDE.md). File này có sơ đồ end-to-end, luồng OCR, Apriori/HUIM, LLM/fallback và bản đồ debug theo triệu chứng.

## 1. Kiến trúc xử lý

```text
ASP.NET Core
    → FastAPI controller
    → service điều phối
       ├── đọc PDF/DOCX/ảnh và OCR
       ├── NLP trích xuất thông tin, kỹ năng
       ├── TF-IDF/cosine tính tương đồng
       ├── Gemini hỗ trợ hiểu ngữ nghĩa, giải thích
       └── Apriori/HUIM khai phá tổ hợp kỹ năng
    → Backend lưu snapshot kết quả
    → Frontend hiển thị theo vai trò
```

`main.py::app` là điểm khởi chạy. `main.py::lifespan` đồng bộ danh mục kỹ năng khi service khởi động nhưng không chặn Docker health check `GET /health`.

### Yêu cầu OCR tiếng Việt

- Tesseract phải có cả language pack `vie` và `eng`; runtime dùng `vie+eng`.
- Không được âm thầm fallback sang chỉ `eng` cho CV Việt vì sẽ làm rơi/sai dấu rồi khiến các bước AI phía sau phân tích sai.
- Docker đã cài `tesseract-ocr-vie` và `tesseract-ocr-eng`. Trên máy local có thể đặt các file traineddata trong `.local/tessdata`; service tự nhận thư mục này qua `TESSDATA_PREFIX`.
- Nếu thiếu `vie`, extraction phải trả lỗi cấu hình/không đủ dữ liệu thay vì tiếp tục chấm từ text tiếng Việt bị hỏng.

## 2. Endpoint và hàm xử lý

### Phân tích CV

| Endpoint | Controller | Hàm xử lý chính |
|---|---|---|
| `POST /validate-cv` | `analysis_controller.validate_cv` | `doc_parser_service.extract_document_from_file` → quality/consensus gate → `scoring_service.is_document_a_resume` |
| `POST /score-cv` | `analysis_controller.score_cv` | `cv_analysis_service.score_resume_sync` |
| `POST /score-cv-text` | `analysis_controller.score_cv_text` | `cv_analysis_service.score_resume_sync` với text từ CV Builder |
| `POST /analyze-cv-preview` | `analysis_controller.analyze_cv_preview` | `cv_analysis_service.preview_resume_sync` |
| `POST /analyze-cv-star` | `analysis_controller.analyze_cv_star` | `interview_service.generate_cv_star_tips` |
| `POST /analyze-cv-language` | `analysis_controller.analyze_cv_language` | `scoring_service.generate_cv_language_review` |
| `POST /analyze-cv-interview` | `analysis_controller.analyze_cv_interview` | `interview_service.generate_cv_mock_interview` |

### Chatbot, email và tìm kiếm

| Endpoint | Hàm xử lý chính |
|---|---|
| `POST /chat` | `scoring_service.chat_with_candidate` |
| `POST /evaluate-answer` | `interview_service.evaluate_interview_answer` |
| `POST /generate-email` | `email_service.generate_candidate_email` |
| `POST /semantic-search` | `gemini_service.embed_content_with_retry` và cosine similarity |

### Khai phá kỹ năng

| Endpoint | Thuật toán/service |
|---|---|
| `POST /train-apriori` | `apriori_service.train_and_save_rules` |
| `POST /recommend-skills` | `apriori_service.get_recommended_skills` |
| `GET /association-rules` | Đọc kết quả Apriori hiện hành |
| `POST /train-huim` | `huim_service.train_and_save_huim` |
| `POST /recommend-high-utility-skills` | `huim_service.get_recommended_huim_skills` |
| `GET /high-utility-itemsets` | Đọc kết quả HUIM hiện hành |

## 3. Luồng chấm CV chính thức

```text
AiService.cs
  → POST /score-cv hoặc /score-cv-text
  → criterion_validation_service.parse_and_validate_criteria
  → cv_analysis_service.score_resume_sync
      1. Đọc text hoặc nhận text CV Builder
      2. Kiểm tra chất lượng, đồng thuận nguồn đọc và `analysis_safe`
      3. Xác định tài liệu có phải CV
      4. nlp_processor.extract_information(CV và JD)
      5. scoring_service.calculate_resume_score
      6. scoring_service.analyze_cv_deep
      7. Ghép kết quả và trạng thái phân tích
  → Backend lưu kết quả
```

Khi vấn đáp có thể nhớ theo năm lớp:

1. `doc_parser_service`: số hóa đầu vào.
2. `nlp_processor`: trích xuất dữ liệu và kỹ năng.
3. `ml_service`: TF-IDF/cosine có thể kiểm tra được.
4. `scoring_service`: chấm điểm và chuẩn hóa kết quả.
5. `gemini_service`: gọi model, retry, cooldown và xử lý JSON.

`cv_analysis_service` hiện là service điều phối, chưa phải một thuật toán độc lập.

## 4. Trích xuất tài liệu

Parser runtime là `services/doc_parser_service.py::extract_document_from_file`; `extract_text_from_file` chỉ là wrapper tương thích:

```text
PDF có text → PyPDF2 + pdfplumber plain/layout → đối chiếu
PDF chưa ổn → render Poppler/PDFium → Tesseract vie+eng nhiều PSM → Gemini Vision khi cần
Ảnh          → Pillow → Tesseract vie+eng nhiều PSM → Gemini Vision khi cần
DOCX         → python-docx (đoạn văn + bảng)
Kết quả      → quality + agreement + analysis_safe → NLP/chấm điểm hoặc Không đủ dữ liệu
```

Điểm chất lượng cao của một chuỗi chưa đủ chứng minh nó được đọc đúng. Parser so khớp token giữa các nguồn, không phụ thuộc dấu câu/thứ tự khối; OCR có độ tin cậy ký tự thấp bị trừ điểm. Nếu hai nguồn độc lập cho nội dung mâu thuẫn hoặc raster không có xác nhận tối thiểu, hệ thống đặt `analysis_safe=false` và không chạy skill extraction, scoring, red flag, STAR hay language review trên chuỗi đó. Cơ chế này giảm false positive nhưng không chứng minh OCR đúng tuyệt đối; phép đo accuracy vẫn cần corpus CV thật đã gán nhãn.

`pdf_extractor.py` là implementation cũ và không còn được gọi trong luồng runtime.

## 5. Thuật toán: input và output

### TF-IDF và cosine similarity

- File: `services/ml_service.py`.
- Input: toàn văn CV và JD.
- Output: độ tương đồng 0–100.
- Giới hạn: đo tương đồng từ vựng, không xác minh năng lực thật.

### Gemini

- Client: `services/gemini_service.py`; prompt nằm trong `prompts/`.
- Input: CV, JD, kỹ năng, tiêu chí và context tùy chức năng.
- Output: JSON có cấu trúc hoặc văn bản giải thích.
- Không được xem nội dung Gemini sinh ra là bằng chứng nếu đoạn đó không tồn tại trong CV.
- Chuỗi model mặc định hiện dùng Gemini 3.x; có thể cấu hình qua biến môi trường. Key giữ đúng thứ tự cấu hình để có thể đặt project paid trước project free. Lỗi 404 loại model, 429 cooldown key; 503/504/timeout mặc định chuyển model sau hai key/project để giữ ngân sách cho failover. Mỗi attempt mặc định 15 giây, không bao giờ gửi deadline dưới 10 giây và toàn request có ngân sách mặc định 60 giây.
- `language_review.is_fallback=true` là rà soát cục bộ, không phải kết quả Gemini hoàn chỉnh và phải được UI/API nhận diện là phân tích một phần.
- Cảnh báo CV được tách hai lớp: `red_flags` chỉ chứa mục truy hồi được đoạn nguồn; `red_flag_suspicions` chứa dấu hiệu AI đề xuất nhưng chưa đối chiếu được. Nhóm thứ hai vẫn hiển thị để định hướng phỏng vấn, nhưng không được dùng chấm điểm hay kết luận gian dối.
- Phân tích ngôn từ áp dụng nguyên tắc tương tự qua `unverified_language_observations`. Khi extraction không an toàn, `insufficient_reason=extraction_unreliable` được trả rõ thay vì chấm điểm trên văn bản OCR lỗi. Nếu extraction vẫn an toàn nhưng có cảnh báo OCR/mất dấu hoặc ở mức `partial`, hệ thống vẫn rà soát phần văn bản đọc được và trả `analysis_scope=extracted_text_with_quality_limitations`; lỗi ký tự/bố cục không được quy thành lỗi viết của ứng viên.

### 9Router local

- Có thể ưu tiên endpoint OpenAI-compatible của 9Router bằng `LLM_ROUTER_BASE_URL` (local thường là `http://127.0.0.1:20128/v1`) và `LLM_ROUTER_MODELS`.
- Chatbot dùng danh sách nhanh riêng `LLM_ROUTER_CHAT_MODELS` (mặc định `Gemini,deepseek`), router-first tối đa 12 giây rồi mới thử Gemini trực tiếp trong ngân sách 12 giây. Model phân tích CV chậm hoặc thử nghiệm trong `LLM_ROUTER_MODELS` không tham gia fast-path này.
- HTTP 200 từ router chưa mặc nhiên là thành công: `finish_reason=length/max_tokens`, Markdown hoặc tag gợi ý job chưa đóng sẽ bị xem là phản hồi chưa hoàn chỉnh và chuyển sang model kế tiếp trong ngân sách. Câu trả lời ngắn nhưng đã đóng cấu trúc vẫn được giữ.
- `LLM_ROUTER_API_KEY` là tùy chọn cho router có bật xác thực và chỉ được cấp qua biến môi trường; không ghi key vào source hoặc log.
- Thứ tự failover: 9Router local → Gemini (nếu bật/có key) → fallback cục bộ có gắn trạng thái. Khi chỉ muốn dùng router local mà không tiêu thụ quota Gemini, đặt thêm `GEMINI_ENABLED=false` cho đúng tiến trình Python local.
- Riêng `/chat`, provider hết ngân sách hoặc không tạo được câu hoàn chỉnh trả HTTP `503`; backend không lưu câu báo lỗi như phản hồi AI thành công. Thẻ gợi ý job được chuẩn hóa bằng catalog SQL vừa cấp cho prompt: ưu tiên ID hợp lệ; nếu model làm sai hoặc bỏ thẻ nhưng đã nêu đúng tên vị trí có trong catalog thì backend gắn lại ID/chi nhánh/lương từ SQL; nội dung không đối chiếu được vẫn bị loại.
- Bằng chứng AI được truy hồi lại từ CV theo token gần-nguyên-văn. Khác dấu câu/xuống dòng hoặc một lỗi ký tự nhỏ có thể phục hồi; thay số, phủ định hoặc diễn giải lại không được giữ như bằng chứng và chỉ có thể xuất hiện dưới nhãn dấu hiệu chưa đối chiếu nếu không vi phạm quy tắc OCR/ngày tháng.

### Apriori

- Input: danh sách transaction, mỗi transaction là tập kỹ năng đã trích xuất từ một CV đủ điều kiện và đã quy alias về tên chuẩn trong taxonomy SQL.
- Output: frequent itemsets và luật `A → B` với support/confidence/lift.
- Cần chạy theo ngành/vị trí và công khai số lượng dữ liệu; không suy rộng từ mẫu fresher sang toàn thị trường.
- Domain của transaction đến từ job đã ứng tuyển, context Talent Pool do HR lưu hoặc hồ sơ skill-job đủ ngưỡng; note/tag HR không tự trở thành skill CV.

### HUIM

- Input: cùng transaction kỹ năng canonical như Apriori, internal utility, external utility lấy từ JD/lương quan sát cùng ngành và ngưỡng utility.
- Output: tổ hợp kỹ năng có tổng utility đạt ngưỡng.
- Utility phải có định nghĩa nghiệp vụ; không dùng công thức giả lập hoặc mock data làm kết quả production.

### Taxonomy và bí danh kỹ năng

- `Skills` và `SkillAliases` trong SQL Server là nguồn chuẩn. Python đồng bộ thành `approved_skill_taxonomy.json` trong thư mục runtime; `skills.json` lịch sử không tham gia chấm điểm hoặc mining.
- Chuẩn hóa dấu, hoa/thường, khoảng trắng và ký hiệu kỹ thuật là quy tắc tổng quát. Các trường hợp đồng nghĩa thật như `NodeJS → Node.js`, `MSSQL → SQL Server` phải nằm trong alias SQL, không viết cứng trong Apriori/HUIM.
- Cùng một alias luôn thành một canonical item trước scoring, support, confidence, quantity và utility. Cụm cụ thể thắng cụm con trên cùng occurrence (`C#` không tự sinh `C`; `SQL Server` không tự sinh `SQL`), nhưng occurrence `SQL` độc lập vẫn được giữ.
- Alias mới chỉ có hiệu lực sau khi Admin thêm vào taxonomy và Python đồng bộ lại. Hệ thống không tự suy đoán hai kỹ năng là đồng nghĩa vì có thể gây gộp sai năng lực.

## 6. Trách nhiệm thư mục

```text
Python/
├── main.py          # Khởi động FastAPI
├── controllers/     # HTTP, request validation, gọi service
├── dtos/            # Schema Pydantic
├── services/        # Parser, scoring, AI, mining, integrations
├── prompts/         # Prompt theo chức năng
├── utils/           # Logger, rate limit, error mapping
├── tests/           # Test tự động chính thức
├── tools/           # Generator/audit/benchmark chạy thủ công, không tham gia runtime
├── test_data/       # Corpus và dữ liệu hư cấu có thể tái tạo
└── scratch/         # Thử nghiệm thủ công, không phải test production
```

Các script trong `tools/` không được import từ runtime FastAPI. Kết quả sinh tự động nằm trong `test_data/` và phải ghi rõ là dữ liệu hư cấu.

## 7. Benchmark đa ngành offline

Bộ benchmark nội dung dài được tách hoàn toàn khỏi database và backend:

```powershell
Python\venv\Scripts\python.exe Python\tools\generate_offline_benchmark.py
Python\venv\Scripts\python.exe Python\tools\run_offline_algorithm_benchmark.py --regenerate
```

- Catalog: `test_data/offline_benchmark/catalog.json`.
- Dữ liệu sinh: `test_data/offline_benchmark/generated/`.
- Báo cáo JSON/CSV/Markdown: `test_data/offline_benchmark/results/`.
- Runner không đọc `appsettings`, không kết nối SQL, không khởi động ASP.NET Core, không gọi mạng/Gemini.
- Bộ hiện tại có 1.170 CV dài, 162 JD và 3.510 cặp; mỗi JD được thử với 15–40 CV thuộc đủ năm trường hợp bằng chứng. Quan hệ cùng vị trí, cùng ngành khác vị trí và trái ngành dùng để kiểm tra tính nhất quán, không phải nhãn thị trường.
- CNTT là trục sâu; các ngành còn lại là đối chứng để phát hiện việc trộn domain.
- Trọng số HUIM trong benchmark là số hư cấu 1–5 chỉ để đối chiếu phép tính; không được gọi là độ hiếm, lương hoặc giá trị thị trường.

Benchmark OCR/layout vẫn dùng corpus `test_data/cv_layout_corpus/`; không gộp số đo OCR và số đo đối sánh nội dung thành một tỷ lệ chính xác chung.

## 8. Quy tắc tổ chức code

1. Controller không chứa thuật toán hoặc truy cập file dữ liệu trực tiếp.
2. DTO không khai báo rải rác trong controller.
3. Một service chỉ phụ trách một nhóm chức năng.
4. Prompt dài phải đặt trong `prompts/`.
5. Fallback/degraded phải có trạng thái rõ, không giả là AI thành công.
6. Không log API key, toàn văn CV hoặc dữ liệu cá nhân nhạy cảm.
7. Giữ nguyên URL endpoint khi refactor để không làm đứt backend .NET.
8. Mỗi endpoint cần test dữ liệu đúng, thiếu, sai và dependency lỗi.

## 9. Nợ kỹ thuật cần xử lý theo thứ tự

### Phiên bản dữ liệu và vòng quan sát kỹ năng

- Phân tích mới dùng `analysis_version=5`; snapshot cũ không tự thay đổi chỉ vì Apriori/HUIM chạy nền.
- CV/JD trả hai tập riêng: kỹ năng canonical đã duyệt và `skill_observations` chưa duyệt. Backend lưu observation có nguồn/bằng chứng vào SQL; chỉ observation đủ nhiều nguồn mới chuyển chờ Admin rà soát.
- Timeline nghề nghiệp không cộng mốc học vấn, dự án, chứng chỉ hoặc hackathon. Dự án vẫn cấp bằng chứng kỹ năng nhưng không làm tăng tổng tháng đi làm.
- Xem sơ đồ chi tiết, ngưỡng duyệt, retry dữ liệu cũ và đường debug trong [`SOURCE_FLOW_GUIDE.md`](SOURCE_FLOW_GUIDE.md).

1. Bổ sung test bảo vệ API hiện hành.
2. Tách validation tiêu chí dùng chung.
3. Tách `cv_analysis_service` thành parsing, extraction, scoring orchestration và learning.
4. Tách chatbot/document validation/language review khỏi `scoring_service`.
5. Chuyển `nlp_processor.py` vào services và loại `pdf_extractor.py` cũ.
6. Chuyển DTO tìm kiếm khỏi controller.
7. Tách JSON runtime Apriori/HUIM/skills khỏi source code.
