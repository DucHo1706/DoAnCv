# Bản đồ đọc source Python — RecruitInsightAI

Tài liệu này dành cho lúc đọc source, debug và vấn đáp. Mục tiêu là trả lời ba câu hỏi:

1. Một CV đi qua những file nào?
2. Apriori và Two-Phase HUIM lấy dữ liệu ở đâu, chạy lúc nào và tác động tới AI ra sao?
3. Khi kết quả sai hoặc thiếu thì phải mở file nào trước?

## 1. Mô hình cần nhớ trước khi đọc code

Không nên hiểu toàn bộ thư mục `Python/` là một thuật toán duy nhất.

```text
ASP.NET Core                         Python FastAPI
-------------------------------     --------------------------------
Nghiệp vụ, tài khoản, phân quyền     Đọc tài liệu và kiểm tra chất lượng
Job, tiêu chí, CV, Application   ->  Trích xuất thông tin/kỹ năng
Chạy nền và lưu kết quả          <-  Chấm tiêu chí và phân tích chuyên sâu
SignalR/thông báo                    Apriori/HUIM và gọi LLM
```

Ba file có vai trò dễ nhầm:

- `main.py` chỉ khởi tạo FastAPI, middleware, scheduler đồng bộ taxonomy và gắn controller.
- `controllers/analysis_controller.py` chỉ nhận HTTP, kiểm tra request và gọi service.
- `services/cv_analysis_service.py` là bộ điều phối chính; nó không phải một thuật toán độc lập.

## 2. Thứ tự đọc source nhanh nhất

Đọc theo thứ tự dưới đây, không đọc theo tên file alphabet:

| Thứ tự | File | Cần hiểu |
|---:|---|---|
| 1 | `main.py` | FastAPI khởi động và controller nào được đăng ký |
| 2 | `controllers/analysis_controller.py` | Endpoint CV đi vào hàm nào |
| 3 | `services/cv_analysis_service.py` | Thứ tự điều phối toàn bộ pipeline |
| 4 | `services/doc_parser_service.py` | Khi nào dùng PDF text, OCR và Vision |
| 5 | `services/document_layout_service.py` | Chấm chất lượng, đồng thuận, hai cột và `analysis_safe` |
| 6 | `nlp_processor.py`, `services/skill_mining_guard.py` | Bóc tách và chuẩn hóa kỹ năng theo taxonomy/alias |
| 7 | `services/timeline_service.py`, `services/section_segmentation_service.py` | Timeline không cộng trùng và chia section CV |
| 8 | `services/scoring_service.py` | Chấm tiêu chí, bằng chứng, red flag và fallback |
| 9 | `prompts/` | JSON mà LLM được yêu cầu trả về cho từng chức năng |
| 10 | `services/gemini_service.py` | 9Router, Gemini, retry, key/model cooldown |
| 11 | `services/mining_context_service.py` | Cách Apriori/HUIM được đưa vào prompt |
| 12 | `services/apriori_service.py`, `services/huim_service.py` | Công thức khai phá và model theo domain |

Sau đó mới đọc phía C#:

1. `ApplicationService.cs`: nhận yêu cầu nộp hồ sơ và lưu `Application` trước.
2. `AiEvaluationService.cs`: chạy phân tích nền, lưu `CandidateCV` và `AIEvaluation`.
3. `AiService.cs`: adapter HTTP từ C# sang FastAPI.
4. `MiningSchedulerService.cs`: kiểm tra khi backend khởi động và lúc 02:00 Việt Nam.
5. `CandidateCvDomainService.cs`, `AprioriService.cs`, `HighUtilityService.cs`: chuẩn bị dataset mining.

Không cần đọc trước các file sau:

- `tools/`: sinh/audit benchmark thủ công, không tham gia request runtime.
- `scratch/`: thử nghiệm, không phải test chính thức.
- `pdf_extractor.py`: implementation cũ, pipeline hiện tại không gọi.
- `auto_trainer.py`: script cũ; lịch chạy chính nằm ở backend C#.
- Các JSON kết quả trong runtime: là dữ liệu model, không phải code thuật toán.

## 3. Luồng nộp một CV từ giao diện tới database

```text
Ứng viên bấm Nộp hồ sơ
  |
  v
ApplicationService.cs
  |-- kiểm tra file/kích thước/chữ ký
  |-- POST /validate-cv ------------------------------+
  |                                                   |
  |                         analysis_controller       |
  |                           -> doc_parser_service    |
  |                           -> quality/safety gate   |
  |                           -> is_document_a_resume  |
  |                                                   |
  |<---------------- hợp lệ / không hợp lệ -----------+
  |
  |-- lưu CandidateCV + Application + AiEvaluationTask
  |-- task có NotBeforeUtc = thời điểm nộp + 30 giây
  |-- trả aiStatus=Pending để người dùng tiếp tục nộp job khác
  `-- AiEvaluationQueueWorker
       |-- nhận một task đủ thời gian bằng transaction Serializable
       |-- tải snapshot CV từ RawText, file local hoặc URL kho lưu trữ
       |-- gọi AiEvaluationService.RunAiEvaluationJobAsync
       |    |-- lấy JD + JobCriteria từ SQL
       |    |-- POST /score-cv hoặc /score-cv-text
       |    `-- lưu text/skill/điểm/kết quả
       |-- Completed: phát SignalR + thông báo hoàn tất
       |-- TransientFailed: hẹn lại sau 30 giây, 2 phút hoặc 5 phút
       `-- PermanentFailed/Cancelled: dừng và giữ lịch sử trạng thái
```

Điểm quan trọng:

- CV Builder gọi `/score-cv-text`; PDF/DOCX/ảnh gọi `/score-cv`.
- `/validate-cv` chạy trước và cache kết quả trích xuất theo SHA-256. `/score-cv` dùng lại text đó để tránh OCR hai lần.
- `Application`, snapshot CV và `AiEvaluationTask` được ghi nhận trước khi AI chạy. Vì vậy ứng viên không phải chờ job thứ nhất phân tích xong mới nộp job thứ hai.
- Khoảng chờ 30 giây thuộc từng application, không phải cooldown toàn tài khoản. Ứng viên có thể rút hồ sơ `Applied` trong khoảng này để task chuyển `Cancelled` trước khi dùng quota AI.
- Nếu ứng viên rút khi provider đã chạy, task chuyển `CancelRequested`. Worker đọc lại `RowVersion`, bỏ kết quả đến muộn và không gắn đánh giá vào hồ sơ đã rút.
- Task nằm trong SQL nên backend restart không làm mất hàng đợi. Task `Processing` quá cũ được phục hồi thành `RetryScheduled` nếu còn lượt; mặc định tối đa ba lần thử tự động.
- Lỗi dữ liệu cố định như mất CV hoặc sai định dạng dừng ngay. Lỗi mạng, kho file hoặc provider tạm thời mới được retry. Người dùng chỉ có một lượt yêu cầu phân tích lại thủ công để chống lạm dụng.
- Kết quả đầy đủ được đóng gói vào `matching_result.summary` dưới dạng JSON snapshot để frontend đọc lại mà không gọi LLM mỗi lần mở trang.

## 4. Bên trong `/score-cv`

Hàm trung tâm là `cv_analysis_service.score_resume_sync`.

| Bước | Hàm/file | Đầu ra |
|---:|---|---|
| 1 | `criterion_validation_service.parse_and_validate_criteria` | Danh sách tiêu chí cấu trúc, tổng trọng số hợp lệ |
| 2 | cache hoặc `doc_parser_service.extract_document_from_file` | `cv_text` và `extraction_quality` |
| 3 | extraction safety gate | Cho phân tích hoặc trả `insufficient` |
| 4 | `scoring_service.is_document_a_resume` | Xác định tài liệu có cấu trúc CV |
| 5 | `nlp_processor.extract_information` cho CV/JD | Email, số điện thoại và kỹ năng canonical |
| 6 | `timeline_service.extract_experience_timeline` | Tổng tháng làm việc không cộng trùng, tháng theo kỹ năng, gap/future; không cộng học vấn/dự án |
| 7 | `section_segmentation_service.segment_cv_sections` | Skills/Experience/Projects/Education/... |
| 8 | `scoring_service.calculate_resume_score` | Kết quả LLM theo từng tiêu chí hoặc fallback có giới hạn |
| 9 | `reconcile_timeline_criteria` | Ghi đè tiêu chí thời lượng bằng phép tính timeline cục bộ |
| 10 | `reconcile_structured_criteria` | Ghi đè tiêu chí định danh bằng taxonomy/section/bằng chứng |
| 11 | `analyze_cv_deep` | Điểm TF-IDF, strengths, weaknesses, red flag, context mining |
| 12 | `partition_red_flags` | Tách red flag có bằng chứng và dấu hiệu chưa đối chiếu |
| 13 | `interview_service` và language review | STAR, ngôn từ, câu hỏi phỏng vấn; có fallback riêng |
| 14 | `full_analysis_data` | Snapshot phiên bản, trạng thái và toàn bộ tab phân tích |

### Điểm cuối cùng do đâu quyết định?

Điểm hiển thị chính là tổng điểm các `JobCriteria`, không phải phần trăm “CV tốt” nói chung:

```text
LLM đề xuất điểm + bằng chứng
        |
        +--> giới hạn theo trọng số và FULL/PARTIAL/NOT_FOUND
        |
        +--> timeline cục bộ ghi đè tiêu chí kinh nghiệm
        |
        `--> rule cục bộ ghi đè skill/education/certificate/language/location
                         |
                         v
                    total_score 0..100
```

Vì vậy ứng viên nhiều năm kinh nghiệm vẫn có thể điểm thấp nếu không đáp ứng các tiêu chí có trọng số của job. Điểm không phải thâm niên tổng quát và không phải xác suất tuyển dụng.

### Bằng chứng và red flag

- Đoạn do LLM trả về phải được `resolve_grounded_evidence` truy hồi gần-nguyên-văn trong CV.
- Không truy hồi được thì tiêu chí bị giảm confidence/cap điểm hoặc chuyển thành dấu hiệu chưa đối chiếu.
- `red_flags`: có đoạn nguồn đủ đối chiếu.
- `red_flag_suspicions`: dấu hiệu cần hỏi nhưng chưa có đoạn đủ chắc; không dùng chấm điểm.
- Hệ thống chỉ xác nhận câu đó có trong CV, không xác nhận lời khai là thật.

## 5. Luồng đọc PDF, DOCX và ảnh

```text
PDF có lớp text
  -> PyPDF2
  -> pdfplumber plain
  -> pdfplumber layout + word blocks
  -> chấm chất lượng và so đồng thuận

PDF scan hoặc kết quả chưa an toàn
  -> Poppler, lỗi thì PDFium
  -> Tesseract vie+eng với PSM 4/6/11
  -> deskew + phát hiện hai cột + sắp thứ tự block
  -> Gemini/9Router Vision làm nguồn đọc độc lập cuối

Ảnh PNG/JPG/WEBP
  -> Pillow sửa EXIF, resize, grayscale/autocontrast
  -> Tesseract nhiều PSM
  -> Vision khi local chưa đủ tin cậy

DOCX
  -> python-docx
  -> ghép paragraph và từng hàng table
```

`document_layout_service.choose_best_candidate` không đơn giản chọn chuỗi dài nhất. Mỗi candidate có:

- `quality_score`: độ dài, tỷ lệ ký tự/từ và dấu hiệu lỗi.
- `agreement_score`: mức đồng thuận token với nguồn khác.
- `agreement_kind`: nguồn độc lập, biến thể cùng engine hoặc chỉ một nguồn.
- `blocks`: vị trí để nhận biết bố cục/cột.
- `warnings` và `analysis_safe`.

Nếu các nguồn độc lập mâu thuẫn hoặc OCR raster chưa có mức xác nhận tối thiểu, `_apply_analysis_safety_gate` đặt `analysis_safe=false`. Pipeline dừng thay vì đưa text có thể sai vào scoring, red flag và language review.

## 6. Chuẩn hóa kỹ năng

```text
Skills + SkillAliases đã Admin duyệt trong SQL
  -> skills_sync_service tải về khi Python khởi động/định kỳ
  -> approved_skill_taxonomy.json trong runtime
  -> nlp_processor tạo matcher
  -> CV/JD được trả về tên canonical giống nhau
```

Nguyên tắc:

- Quy tắc ký hiệu tổng quát xử lý hoa/thường, khoảng trắng và dấu kỹ thuật.
- Đồng nghĩa nghiệp vụ như `NodeJS -> Node.js` phải nằm trong `SkillAliases`, không viết cứng trong Apriori/HUIM.
- Skill lạ không bị bỏ mất nhưng cũng không được đưa thẳng vào taxonomy. Python trả `skill_observations` riêng; backend lưu provenance/confidence vào bảng `SkillObservations`.
- `SkillDiscoveryService` chỉ nâng một nhóm lên `CandidateForReview` khi có ít nhất 3 nguồn độc lập, có ít nhất 2 CV hoặc 2 JD và confidence trung bình từ 0,75. Admin map vào skill cũ, duyệt skill mới hoặc từ chối qua API có phân quyền.
- Observation chưa duyệt không được cộng điểm, tạo red flag hoặc train Apriori/HUIM. Queue JSON cũ không còn là nguồn runtime.
- Note/tag HR là context phân loại nguồn ứng viên, không tự biến thành bằng chứng kỹ năng trong CV.

## 7. Luồng Apriori và Two-Phase HUIM chạy nền

Scheduler thực tế nằm ở `RecruitmentBackend/Services/MiningSchedulerService.cs`, không nằm trong `auto_trainer.py`.

```text
Backend khởi động hoặc đến 02:00 giờ Việt Nam
  |
  |-- SkillDiscoveryService: nhóm observation và nâng trạng thái chờ duyệt
  |-- CandidateCvDomainService: gán domain có evidence/confidence
  |-- tạo fingerprint Skills + Aliases + CV + JD + Talent Pool + Domain
  |
  +-- fingerprint không đổi -> SKIP, không train lại
  |
  `-- fingerprint đổi
        |-- AprioriService.cs -> POST /train-apriori
        `-- HighUtilityService.cs -> POST /train-huim
```

### Nguồn xác định domain CV

Ưu tiên hiện tại:

1. Job mà CV đã ứng tuyển: confidence 1.0, đã xác nhận theo nghiệp vụ.
2. Lĩnh vực HR lưu trong Talent Pool: confidence 0.95.
3. So kỹ năng CV với profile kỹ năng các JD cùng ngành: cần ít nhất hai kỹ năng khớp để đạt ngưỡng 0.6.

Một CV có thể thuộc nhiều domain. Mining nhóm transaction riêng theo domain, không gộp mọi ngành.

### Apriori

- Một transaction là tập kỹ năng canonical của một CV.
- Chỉ train domain có ít nhất 5 CV hợp lệ.
- Python tính frequent itemset và luật kết hợp theo support, confidence và lift.
- Kết quả trả lời: “trong dữ liệu quan sát, kỹ năng nào thường xuất hiện cùng nhau”.
- Không trả lời kỹ năng đó là thật, giỏi hay có giá trị lương cao.

### Two-Phase HUIM

- Transaction vẫn là tập kỹ năng canonical của CV; quantity hiện là 1 cho mỗi skill xuất hiện trong CV.
- External utility của skill hiện được backend tính từ `SalaryMax` trung bình của các JD có skill đó trong cùng ngành.
- Chỉ dùng job `Published` hoặc `Closed`, có skill trích xuất và `SalaryMax > 0`.
- Chỉ train domain đồng thời có ít nhất 5 CV và có JD/lương hợp lệ.
- Kết quả là tổ hợp đạt ngưỡng utility theo định nghĩa trên; không đồng nghĩa “kỹ năng hiếm”.

### Apriori/HUIM tác động tới phân tích CV như thế nào?

```text
Kỹ năng CV
  -> mining_context_service
      |-- gợi ý Apriori
      `-- gợi ý HUIM
  -> đưa vào prompt deep analysis với nhãn context quan sát
```

Context mining:

- Không được dùng làm bằng chứng CV.
- Không tự cộng hoặc trừ điểm.
- Không tạo red flag.
- Chỉ giúp LLM biết các tổ hợp đã quan sát và đặt câu hỏi/gợi ý có bối cảnh hơn.
- Nếu chưa có model/dataset đủ điều kiện, trạng thái là `insufficient_data`; scoring tiêu chí vẫn chạy bằng CV, JD và taxonomy.

## 8. Luồng LLM và fallback

`services/gemini_service.py::generate_content_with_retry` hiện chạy:

```text
9Router (nếu cấu hình)
  -> model router 1, 2, ...
  -> lỗi toàn bộ
Gemini trực tiếp
  -> model 1 với các key khả dụng
  -> cooldown theo key/model/network
  -> model tiếp theo trong tổng ngân sách thời gian
  -> lỗi toàn bộ
Caller dùng fallback cục bộ hoặc trả trạng thái chưa đủ/lỗi
```

Không ghi tên provider vào UI người dùng. UI cần phân biệt:

- Kết quả LLM hoàn chỉnh.
- Phân tích cục bộ `is_fallback=true`.
- Phân tích một phần/degraded.
- Không đủ dữ liệu trích xuất.
- Lỗi dịch vụ.

Một lượt full score có thể gọi LLM cho nhiều phần: chấm tiêu chí, phân tích sâu, STAR, ngôn từ và phỏng vấn. Đây là lý do nhiều CV đồng thời tạo tải lớn dù chỉ có một endpoint `/score-cv`.

Riêng chatbot dùng fast-path tách khỏi chuỗi model phân tích CV:

```text
Frontend POST /api/Chatbot/chat
  -> ChatbotService.cs
      |-- giới hạn prompt, lịch sử và file
      |-- chỉ truy vấn tối đa 6 job còn hạn nếu nhận diện ý định tìm việc/lương
      `-- POST Python /chat, HttpClient timeout 35 giây
          -> scoring_service.chat_with_candidate
              |-- 9Router trước, chỉ thử LLM_ROUTER_CHAT_MODELS
              |     mặc định: Gemini, deepseek
              |     ngân sách router: 12 giây
              `-- Gemini trực tiếp nếu router không khả dụng
                    request timeout: 10 giây
                    ngân sách direct: 12 giây
```

- Danh sách model chatbot tách bằng `LLM_ROUTER_CHAT_MODELS`; model thử nghiệm hoặc chậm trong `LLM_ROUTER_MODELS` không làm câu hỏi ngắn phải chờ theo.
- Python giới hạn đầu ra khoảng 900 token để giảm thời gian nhưng vẫn giữ prompt hệ thống, tối đa 10 lượt lịch sử và ngữ cảnh job có chọn lọc.
- Python trả HTTP `503` khi provider không tạo được nội dung trong ngân sách. Backend giữ nguyên trạng thái lỗi dịch vụ và không lưu câu báo lỗi như một tin nhắn AI thành công.
- Khi AI sinh thẻ `[RECOMMEND_JOB: ID | vị trí | khu vực | lương]`, backend chỉ giữ ID đang có trong tập job SQL vừa cấp cho prompt, rồi ghi đè tên/khu vực/lương bằng dữ liệu SQL. Thẻ có ID không hợp lệ bị loại, tránh biến nội dung model tự sinh thành liên kết job thật.
- Log chỉ ghi model, HTTP status và thời gian millisecond; không ghi prompt, toàn văn CV, token hay API key.
- Các ngưỡng trên là ngân sách chờ để failover, không phải cam kết thời gian phản hồi. Độ trễ thực tế phải đo tại cùng môi trường provider đang dùng.

### Phiên bản phân tích và dữ liệu cũ

- Snapshot mới ghi `analysis_version=5`.
- Kết quả phiên bản thấp hơn vẫn được giữ để bảo toàn lịch sử, nhưng frontend/backend xem là chưa hoàn chỉnh và cho phép phân tích lại CV đã nộp.
- Apriori/HUIM chạy nền không tự viết lại `AIEvaluation` cũ. Sau khi kết quả phân tích mới được lưu, chu kỳ mining kế tiếp tự cập nhật nếu fingerprint đổi.
- Không bulk re-analyze âm thầm vì thao tác đó tiêu thụ quota LLM và có thể gây tải lớn.

## 9. Bản đồ debug theo triệu chứng

| Triệu chứng | Mở file/hàm trước |
|---|---|
| Tệp bị báo không phải CV | `analysis_controller.validate_cv` → `is_document_a_resume` |
| PDF/ảnh đọc sai dấu hoặc đảo cột | `doc_parser_service.extract_document_from_file` → `document_layout_service` |
| `analysis_safe=false` | `_apply_analysis_safety_gate`, xem alternatives/agreement/warnings |
| Skill không được nhận diện | `nlp_processor.extract_skills` → taxonomy SQL/alias sync |
| Điểm 0 hoặc 100 bất hợp lý | `calculate_resume_score` → `normalize_scoring_result` → hai hàm `reconcile_*` |
| Kinh nghiệm bị cộng trùng hoặc lấy nhầm năm học/dự án | `timeline_service.extract_experience_timeline` → section/strict employment evidence |
| Red flag biến mất | `partition_red_flags` → `resolve_grounded_evidence` |
| Tab Ngôn từ trống | `build_language_review_for_extraction` → `normalize_language_review` |
| LLM timeout/quota | `gemini_service.generate_content_with_retry` |
| Apriori/HUIM không chạy | `MiningSchedulerService.RunIfInputChangedAsync` và metadata Python |
| Mining sai ngành | `CandidateCvDomainService.InferAndPersistAsync` |
| Nộp xong nhưng AI mãi Pending/Processing | `AiEvaluationTasks` → `AiEvaluationQueueWorker.ProcessNextAsync` → `AiEvaluationService` |
| Chatbot phản hồi chậm | `ChatbotService.BuildSystemKnowledgeAsync` → `scoring_service.chat_with_candidate` → log elapsed trong `_generate_router_content` |
| Chatbot gợi ý job không mở được | `ChatbotService.NormalizeJobRecommendations` và tập job SQL được nạp cho prompt |
| `/extract-cv` lỗi khi đọc kỹ năng | `analysis_controller.extract_cv` → `nlp_processor.extract_information` |

## 10. Điểm đặt breakpoint khi học luồng

Đặt breakpoint/log theo đúng thứ tự này là đủ theo dõi một CV:

1. C#: `ApplicationService.SubmitApplicationAsync` tại bước gọi `ValidateCvAsync`.
2. Python: `analysis_controller.validate_cv`.
3. Python: `doc_parser_service.extract_document_from_file` trước và sau `choose_best_candidate`.
4. C#: `AiEvaluationQueueService.EnqueueAsync` sau khi tạo `AiEvaluationTask`.
5. C#: `AiEvaluationQueueWorker.ProcessNextAsync` lúc đổi task sang `Processing`.
6. C#: `AiEvaluationService.RunAiEvaluationJobAsync` trước lời gọi AI.
7. Python: `analysis_controller.score_cv`.
8. Python: `cv_analysis_service.score_resume_sync` sau `extracted_info`, sau `scoring_result` và trước `return`.
9. Python: `gemini_service.generate_content_with_retry` khi chọn router/model/key.
10. C#: `AiEvaluationService` trước `_context.SaveChangesAsync()` và worker trước `FinishTaskAsync`.

Chỉ cần theo một CV qua mười điểm này trước; sau đó mới đi sâu vào từng thuật toán.

## 11. Nợ kỹ thuật cần nhớ khi trình bày

- Hàng đợi AI đã bền vững trong SQL nhưng worker hiện xử lý tuần tự theo từng instance. Muốn tăng concurrency phải đo quota/provider, khóa nhận task và tải SQL trước; không tự tăng số worker chỉ vì có nhiều hồ sơ chờ.
- Task cũ trước migration không được backfill tự động để tránh bùng quota. Hồ sơ lịch sử chỉ vào queue khi người dùng dùng luồng phân tích lại được cho phép.
- Cache extraction/score nằm trong RAM Python; restart hoặc nhiều replica không dùng chung cache.
- Model Apriori/HUIM được lưu file runtime; nếu chạy nhiều replica phải dùng volume/state dùng chung hoặc chỉ định một instance huấn luyện.
- `scoring_service.py` và `cv_analysis_service.py` còn lớn; nên tách tiếp orchestration, scoring rules, evidence và language review sau khi khóa luận ổn định.
- Kết quả synthetic chứng minh luồng và tính nhất quán, không chứng minh accuracy trên CV thật hoặc toàn thị trường.
- Timeline chỉ tính section Experience/Employment/Work History. Khi CV không có heading, fallback chỉ nhận block có tín hiệu việc làm rõ như chức danh + công ty/thực tập; Education/Project/Certificate/Hackathon bị loại. Dự án vẫn là bằng chứng kỹ năng nhưng không phải thâm niên nghề nghiệp.
- Bộ ZIP kiểm thử bổ sung ngày 2026-08-25 có 450 PDF duy nhất cho 30 JD, 15 CV/JD; tất cả đọc được lớp text và hiện đều một trang. Nhóm E/F khai báo 3–4 template; bộ này chưa được nhập/chấm toàn bộ và chưa chứng minh accuracy hoặc khả năng OCR scan nhiều trang.

## 12. Bản đồ đầy đủ các chức năng Python

Phần này là mục lục tra cứu toàn bộ FastAPI runtime. Khi một tính năng lỗi, đi từ endpoint sang service theo bảng thay vì tìm theo từ khóa giao diện.

### 12.1 Khởi động, middleware và health

`main.py` thực hiện theo thứ tự:

1. Nạp biến môi trường bằng `load_dotenv` trước khi import service cần cấu hình.
2. Tạo tác vụ `run_taxonomy_sync_scheduler` trong lifespan, thử đồng bộ taxonomy tối đa sáu lần nhưng không chặn `/health`.
3. Sau lần khởi động, scheduler ngủ tới 02:00 giờ Việt Nam rồi đồng bộ lại `Skills` và `SkillAliases` từ backend.
4. Chặn request có `Content-Length` vượt 10 MB bằng HTTP `413`.
5. Chuẩn hóa lỗi Pydantic thành HTTP `400`, chỉ log endpoint và số lỗi validation.
6. Đăng ký CORS local và bốn router: analysis, chat, skills, search.
7. `GET /` trả trạng thái mô tả; `GET /health` là probe tối giản cho Docker.

Scheduler taxonomy trong Python chỉ làm mới catalog nhận diện kỹ năng. Scheduler Apriori/HUIM chạy ở `MiningSchedulerService.cs` của backend; hai lịch không thay thế nhau.

### 12.2 Toàn bộ endpoint runtime

| Endpoint | Dữ liệu chính | Luồng xử lý | Trạng thái đáng chú ý |
|---|---|---|---|
| `POST /validate-cv` | một file tối đa 10 MB | chữ ký file → parser đa nguồn → safety gate → kiểm tra có phải CV → cache SHA-256 | `is_valid=true/false`; dependency lỗi trả `503` |
| `POST /extract-cv` | một file CV | parser → safety gate → `extract_information` → timeline nghề nghiệp | `success`, `insufficient_data`, `invalid_document` |
| `POST /score-cv` | file, JD, JSON criteria | validation tiêu chí → `score_resume_sync` trong threadpool | HTTP `422` khi tiêu chí/file sai; `503` khi dịch vụ không xử lý được |
| `POST /score-cv-text` | text CV Builder, JD, criteria | kiểm tra tối thiểu 80 ký tự → cùng pipeline score | trả lỗi dữ liệu nếu CV trực tuyến quá ngắn |
| `POST /analyze-cv-preview` | file hoặc text, JD, job/company | preview extraction và phân tích trước khi nộp | rate limit 10 request/phút/IP, cooldown 10 giây |
| `POST /analyze-cv-star` | `LazyAnalysisRequest` | `generate_cv_star_tips` | LLM hoặc fallback STAR có cấu trúc |
| `POST /analyze-cv-language` | `LazyAnalysisRequest` | `generate_cv_language_review` → grounded/unverified normalization | phân biệt complete, partial/fallback và insufficient |
| `POST /analyze-cv-interview` | CV, JD, skill, job/company | `generate_cv_mock_interview` | LLM hoặc bộ câu hỏi fallback theo skill thiếu |
| `POST /chat` | prompt, history JSON, JD, system knowledge, file tùy chọn | trích text file → dựng prompt → fast-path router/Gemini | `200 success`; provider lỗi trả HTTP `503` |
| `POST /evaluate-answer` | question, answer, job title | `evaluate_interview_answer` | JSON đánh giá hoặc trạng thái lỗi |
| `POST /generate-email` | invite/reject và context ứng viên | validation nghiệp vụ → `generate_candidate_email` | reject bắt buộc có lý do; có template fallback riêng |
| `POST /semantic-search` | query và danh sách `{id,text}` | batch embedding query + job → cosine → sort giảm dần | input rỗng hoặc embedding lỗi trả danh sách rỗng |
| `POST /refresh-config` | không có body | `nlp_processor.reload_knowledge_base` | trả tổng skill đã nạp lại |
| `POST /update-skills` | danh sách skill | luôn từ chối | HTTP `409`; kỹ năng mới phải qua observation và Admin duyệt |
| `POST /train-apriori` | transaction, threshold, domain, taxonomy, dataset ID | canonicalize → guard dataset → train → lưu model domain | `success`, `skipped`, `error` |
| `POST /recommend-skills` | skill hiện có, top N | đọc model Apriori các domain phù hợp | trả danh sách gợi ý, không cộng điểm CV |
| `GET /association-rules` | không có body | flatten model Apriori hiện hành | dữ liệu kỹ thuật, không phải API quyết định tuyển dụng |
| `POST /train-huim` | item/quantity, utility, threshold, domain, taxonomy | canonicalize → Two-Phase → lưu model domain | `success`, `skipped`, `error` |
| `POST /recommend-high-utility-skills` | skill hiện có, top N | đọc model HUIM | trả skill kèm utility theo dataset |
| `GET /high-utility-itemsets` | không có body | flatten model HUIM hiện hành | không được gọi là độ hiếm hoặc giá trị thị trường |

Các endpoint train/recommend được backend gọi nội bộ. Không có nút Admin/HR chạy thuật toán thủ công trong luồng người dùng.

### 12.3 Luồng preview và các tab phân tích lười

```text
Ứng viên chọn CV ở màn phân tích
  -> /analyze-cv-preview
      |-- đọc và kiểm tra extraction
      |-- bóc skill CV/JD
      |-- tính similarity và phần tổng quan cần thiết
      `-- trả snapshot nền cho giao diện

Người dùng mở tab STAR
  -> /analyze-cv-star
Người dùng mở tab Ngôn từ & Chân thực
  -> /analyze-cv-language
Người dùng mở tab Lộ trình/phỏng vấn
  -> /analyze-cv-interview
```

Tách tab giúp không tiêu thụ tất cả lời gọi LLM ngay khi người dùng chỉ xem tổng quan. Tuy vậy `/score-cv` của application vẫn tạo snapshot đầy đủ theo contract lưu trữ hiện tại; không nhầm hai luồng preview và đánh giá hồ sơ đã nộp.

### 12.4 Trách nhiệm của từng service

| File | Trách nhiệm runtime | Không chịu trách nhiệm |
|---|---|---|
| `cv_analysis_service.py` | điều phối score/preview, cache extraction, ghép snapshot và trạng thái | không quyết định tuyển dụng |
| `doc_parser_service.py` | chọn chiến lược PDF/DOCX/ảnh, gọi OCR/Vision khi cần, áp safety gate | không chấm kỹ năng |
| `document_layout_service.py` | candidate text, block/cột, deskew, quality và agreement | không xác minh nội dung CV là thật |
| `nlp_processor.py` | email/phone, skill canonical và skill observation | không tự duyệt skill mới |
| `section_segmentation_service.py` | phân đoạn experience, project, education, skill, certificate | không cộng tháng kinh nghiệm |
| `timeline_service.py` | chuẩn hóa mốc tháng, hợp nhất overlap, gap/future và tháng theo skill | không dùng mốc dự án/học vấn làm thâm niên |
| `criterion_validation_service.py` | parse JSON và kiểm tra type/operator/weight/option | không chấm điểm |
| `scoring_service.py` | score criteria, reconcile rule, evidence, deep analysis, red flag, language, chatbot | không lưu SQL |
| `ml_service.py` | TF-IDF/cosine local | không hiểu tương đương ngữ nghĩa sâu |
| `gemini_service.py` | router/direct provider, timeout, retry, cooldown, JSON, embedding, vision | không quyết định fallback nghiệp vụ của UI |
| `interview_service.py` | STAR, mock interview, đánh giá câu trả lời và fallback tương ứng | không sửa điểm tiêu chí tuyển dụng |
| `email_service.py` | email mời/từ chối và template fallback | không gửi email thực tế |
| `skills_sync_service.py` | tải taxonomy SQL, ghi file atomically, tính thời điểm 02:00 | không train Apriori/HUIM |
| `skill_observation_service.py` | phát hiện cụm kỹ năng lạ và tạo observation có confidence/evidence | không thêm thẳng vào taxonomy |
| `skill_mining_guard.py` | canonicalize transaction, loại item đáng ngờ, kiểm tra minimum support | không tạo dữ liệu giả khi thiếu mẫu |
| `apriori_service.py` | frequent itemset, association rule, recommendation | không tính utility lương |
| `huim_service.py` | Two-Phase HUIM, TWU và exact utility | không suy ra độ hiếm |
| `mining_model_store.py` | đọc/ghi model theo domain bằng file JSON atomic | không lấy dataset từ SQL |
| `mining_context_service.py` | gom gợi ý Apriori/HUIM thành context quan sát cho deep analysis | không biến context thành evidence |
| `runtime_paths.py` | định tuyến file state vào runtime volume | không chứa logic thuật toán |
| `utils/rate_limiter.py` | giới hạn request theo IP trong một process Python | không thay rate limit tài khoản ở backend |
| `utils/error_handler.py` | đổi exception kỹ thuật thành thông báo an toàn | không che trạng thái fallback/insufficient |
| `utils/logger.py` | định dạng log vận hành | không được log secret hoặc toàn văn CV |

### 12.5 Cách `score_resume_sync` ghép kết quả cuối

```text
criteria_list
  + extraction_quality
  + cv_text / jd_text
  + CV skills canonical / JD skills canonical
  + skill_observations tách riêng
  + sections
  + timeline
  + raw LLM criterion result
  + local criterion reconciliation
  + TF-IDF similarity
  + mining_context quan sát
  + deep analysis
  + red_flags có evidence
  + red_flag_suspicions chưa đối chiếu
  + STAR / language / interview
  -> full_analysis_data, analysis_version=5
```

Điểm tiêu chí được giới hạn bởi trọng số và mức bằng chứng. Timeline/rule cấu trúc được quyền ghi đè nhận định LLM cho dữ kiện có thể tính trực tiếp. Apriori/HUIM, điểm ngôn từ và số lượng công việc không được cộng vào tổng điểm đáp ứng job.

### 12.6 Các nguồn dữ liệu và file state

| Nguồn | Nơi sở hữu | Python dùng như thế nào |
|---|---|---|
| Job, criteria, application, CV, talent pool | SQL Server qua ASP.NET Core | backend dựng request hoặc dataset rồi gọi Python |
| Skills và SkillAliases đã duyệt | SQL Server | đồng bộ thành taxonomy runtime và reload matcher |
| SkillObservations | SQL Server | backend lưu observation Python trả về; Admin quyết định duyệt/map/từ chối |
| `approved_skill_taxonomy.json` | runtime volume Python | catalog canonical hiện hành; ghi atomic |
| `association_rules.json` và metadata | runtime volume Python | model Apriori tách theo domain |
| `high_utility_itemsets.json` và metadata | runtime volume Python | model HUIM tách theo domain |
| `TEXT_CACHE`, `SCORE_CACHE` | RAM process Python | tránh đọc/chấm lặp trong cùng process; mất khi restart |
| `test_data/` | Git, dữ liệu hư cấu | benchmark và regression; không phải dữ liệu production |
| `tools/` | Git, script thủ công | sinh/audit corpus; không được import vào runtime |
| `scratch/`, `auto_trainer.py`, `pdf_extractor.py` | mã cũ/thử nghiệm | không phải đường chạy chính thức |

Trong Docker, file taxonomy/model phải nằm trên volume `ai-runtime`. Khi có nhiều replica Python, cache RAM không chia sẻ và model file cần cơ chế single-writer hoặc storage dùng chung.

### 12.7 Luồng tìm kiếm ngữ nghĩa

```text
Backend chọn tập job ứng viên được phép xem
  -> POST /semantic-search với query + id/text từng job
  -> một batch embedding duy nhất
  -> vector query so cosine với từng vector job
  -> sort score giảm dần
  -> backend ghép ID với dữ liệu SQL và áp bộ lọc/quyền hiện hành
```

Python chỉ trả ID và similarity. Nó không tự công khai job, không thay bộ lọc SQL, không tự quyết định job đã hết hạn và không được trả dữ liệu job ngoài tập backend gửi vào.

### 12.8 Luồng email, phỏng vấn và chatbot

- Email: backend cấp đúng context nghiệp vụ; Python sinh subject/body. `email_service` có template fallback để HR vẫn có bản nháp khi provider lỗi, nhưng payload phải giữ trạng thái phân biệt nếu caller cần hiển thị nguồn.
- Đánh giá trả lời phỏng vấn: câu hỏi, câu trả lời và vị trí đi vào `interview_service`; kết quả chỉ hỗ trợ HR, không tự đổi trạng thái application.
- Chatbot: backend lưu session/history, cắt độ dài và bổ sung job SQL có chọn lọc; Python chỉ tạo câu trả lời. Backend xác thực job recommendation trước khi lưu và trả frontend.
- File đính kèm chatbot được parser chuyển thành text trong request hiện tại; nội dung này không tự trở thành CandidateCV, Application hoặc dataset mining.

### 12.9 Luồng skill observation tới taxonomy

```text
CV hoặc JD có cụm lạ ở section phù hợp
  -> nlp_processor.extract_skill_observations
  -> response skill_observations gồm label, evidence, confidence, source
  -> backend ghi SkillObservations
  -> SkillDiscoveryService nhóm theo nguồn độc lập
  -> đủ ngưỡng thì CandidateForReview
  -> Admin map alias / duyệt skill mới / từ chối
  -> chu kỳ taxonomy 02:00 hoặc lần khởi động kế tiếp
  -> Python reload catalog canonical
  -> fingerprint mining đổi thì Apriori/HUIM chạy lại theo domain
```

Observation chưa duyệt không được khớp tiêu chí, không tạo red flag, không vào transaction và không làm tăng support/utility.

### 12.10 Luồng Apriori và Two-Phase trong code

Apriori:

1. Backend dựng transaction CV theo domain và truyền taxonomy/alias/dataset ID.
2. `skill_mining_guard.canonicalize_transactions_with_indices` chuẩn hóa và giữ chỉ số nguồn.
3. Dataset dưới ngưỡng trả `skipped`, không thêm transaction giả.
4. `AprioriAlgorithm.fit` tạo frequent itemset theo support count.
5. `generate_rules` lọc confidence/lift.
6. `mining_model_store.save_domain_model` ghi kết quả + metadata atomically.
7. `get_recommended_skills` đọc luật có antecedent phù hợp với skill hiện có.

Two-Phase HUIM:

1. Backend dựng item/quantity của CV và external utility từ JD/lương cùng domain.
2. Guard canonicalize item và kiểm tra taxonomy.
3. Phase 1 tính Transaction Utility và TWU để lấy candidate upper-bound.
4. Phase 2 quét lại transaction, tính exact utility và lọc theo `min_utility`.
5. Model/metadata được ghi theo domain; recommendation chỉ đọc itemset đã lưu.

Khi phản biện, nói đúng rằng HUIM hiện đo utility theo định nghĩa dữ liệu JD/lương quan sát trong hệ thống. Nó không chứng minh kỹ năng hiếm, mức lương nguyên nhân hoặc xu hướng toàn thị trường.

### 12.11 Trạng thái trả về cần phân biệt

| Trạng thái | Ý nghĩa | Cách UI nên xử lý |
|---|---|---|
| `success` | pipeline cần thiết đã hoàn tất | hiển thị kết quả và provenance phù hợp |
| `partial` hoặc `is_fallback=true` | có kết quả cục bộ/một phần | hiển thị kết quả kèm giới hạn, cho phép chạy lại khi phù hợp |
| `insufficient_data` | extraction/text/dataset chưa đủ | yêu cầu file rõ hơn hoặc chờ thêm dữ liệu; không hiển thị 0% |
| `skipped` | mining không cần chạy hoặc chưa đạt ngưỡng | giữ model hợp lệ trước đó theo metadata; không gọi là lỗi |
| `invalid_document` | file không phải CV hoặc sai định dạng | thông báo validation, không gọi scoring |
| HTTP `409` | thao tác bị chặn theo chính sách taxonomy | chuyển người dùng sang quy trình Admin review |
| HTTP `422` | request/criteria hợp lệ về HTTP nhưng sai nghiệp vụ đầu vào | sửa dữ liệu gửi lên |
| HTTP `503` | provider/dependency tạm thời không khả dụng | giữ trạng thái lỗi dịch vụ, không lưu như AI success |

### 12.12 Bộ test và lệnh kiểm tra theo lớp

Chạy từ thư mục `Python/` bằng virtual environment của dự án:

```powershell
.\venv\Scripts\python.exe -m unittest tests.test_criterion_validation_service
.\venv\Scripts\python.exe -m unittest tests.test_document_layout_service tests.test_cv_analysis_extraction_gate
.\venv\Scripts\python.exe -m unittest tests.test_skill_taxonomy_aliases tests.test_skill_mining_pipeline
.\venv\Scripts\python.exe -m unittest tests.test_timeline_service tests.test_section_segmentation_service
.\venv\Scripts\python.exe -m unittest tests.test_scoring_evidence tests.test_local_analysis_fallbacks
.\venv\Scripts\python.exe -m unittest tests.test_gemini_failover tests.test_llm_router_service
.\venv\Scripts\python.exe -m unittest tests.test_offline_benchmark
```

Các lớp kiểm chứng khác nhau:

- Unit test bảo vệ phép tính, normalization, status và fallback.
- Corpus layout kiểm tra khả năng đọc PDF/DOCX/ảnh tổng hợp có ground truth.
- Offline benchmark kiểm tra consistency trên dữ liệu hư cấu dài và nhiều domain, không gọi Gemini/SQL.
- Selenium kiểm tra luồng web thật qua frontend/backend/database, nhưng không thay benchmark thuật toán.
- Smoke VPS kiểm tra container, health, API và HTTPS ở đúng commit triển khai.
- Chỉ bộ dữ liệu CV thật đã ẩn danh và gán nhãn mới dùng để phát biểu accuracy thực tế.

### 12.13 Ba đường đọc source theo mục tiêu

Nếu cần hiểu chấm CV:

```text
analysis_controller
  -> cv_analysis_service
  -> doc_parser_service + document_layout_service
  -> nlp_processor + section_segmentation_service + timeline_service
  -> scoring_service + gemini_service
```

Nếu cần hiểu học kỹ năng và hai thuật toán:

```text
skills_sync_service + nlp_processor
  -> skill_observation_service + skill_mining_guard
  -> CandidateCvDomainService.cs + MiningSchedulerService.cs
  -> apriori_service + huim_service + mining_model_store
  -> mining_context_service
```

Nếu cần hiểu chatbot nhanh/chậm hoặc gợi ý job:

```text
ChatbotController.cs
  -> ChatbotService.cs
  -> chat_controller.chat_bot
  -> scoring_service.chat_with_candidate
  -> gemini_service.generate_content_with_retry
  -> ChatbotService.NormalizeJobRecommendations
```
