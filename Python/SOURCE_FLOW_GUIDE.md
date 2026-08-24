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
  |-- lưu CandidateCV + Application trước
  |-- trả aiStatus=Processing để người dùng nộp job khác
  `-- Task.Run -> AiEvaluationService.cs
                  |
                  |-- lấy JD + JobCriteria từ SQL
                  |-- POST /score-cv hoặc /score-cv-text
                  |-- lưu text/skill/điểm/kết quả
                  `-- SignalR + thông báo hoàn tất/lỗi
```

Điểm quan trọng:

- CV Builder gọi `/score-cv-text`; PDF/DOCX/ảnh gọi `/score-cv`.
- `/validate-cv` chạy trước và cache kết quả trích xuất theo SHA-256. `/score-cv` dùng lại text đó để tránh OCR hai lần.
- `Application` được lưu trước khi AI chạy nền. Vì vậy ứng viên không phải chờ job thứ nhất phân tích xong mới nộp job thứ hai.
- Mỗi request `/score-cv` vẫn xử lý đồng bộ bên trong một tác vụ nền. Nhiều hồ sơ tạo nhiều tác vụ song song; đây không phải hàng đợi bền vững.
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
| 6 | `timeline_service.extract_experience_timeline` | Tổng tháng không cộng trùng, tháng theo kỹ năng, gap/future |
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
- Skill lạ được `SkillDiscoveryService` đưa vào hàng chờ; không tự thêm vào taxonomy.
- Note/tag HR là context phân loại nguồn ứng viên, không tự biến thành bằng chứng kỹ năng trong CV.

## 7. Luồng Apriori và Two-Phase HUIM chạy nền

Scheduler thực tế nằm ở `RecruitmentBackend/Services/MiningSchedulerService.cs`, không nằm trong `auto_trainer.py`.

```text
Backend khởi động hoặc đến 02:00 giờ Việt Nam
  |
  |-- SkillDiscoveryService: gom skill chưa duyệt vào queue
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

## 9. Bản đồ debug theo triệu chứng

| Triệu chứng | Mở file/hàm trước |
|---|---|
| Tệp bị báo không phải CV | `analysis_controller.validate_cv` → `is_document_a_resume` |
| PDF/ảnh đọc sai dấu hoặc đảo cột | `doc_parser_service.extract_document_from_file` → `document_layout_service` |
| `analysis_safe=false` | `_apply_analysis_safety_gate`, xem alternatives/agreement/warnings |
| Skill không được nhận diện | `nlp_processor.extract_skills` → taxonomy SQL/alias sync |
| Điểm 0 hoặc 100 bất hợp lý | `calculate_resume_score` → `normalize_scoring_result` → hai hàm `reconcile_*` |
| Kinh nghiệm bị cộng trùng | `timeline_service.extract_experience_timeline` |
| Red flag biến mất | `partition_red_flags` → `resolve_grounded_evidence` |
| Tab Ngôn từ trống | `build_language_review_for_extraction` → `normalize_language_review` |
| LLM timeout/quota | `gemini_service.generate_content_with_retry` |
| Apriori/HUIM không chạy | `MiningSchedulerService.RunIfInputChangedAsync` và metadata Python |
| Mining sai ngành | `CandidateCvDomainService.InferAndPersistAsync` |
| Nộp xong nhưng AI mãi Processing | `ApplicationService` Task.Run → `AiEvaluationService` → SignalR/database |

## 10. Điểm đặt breakpoint khi học luồng

Đặt breakpoint/log theo đúng thứ tự này là đủ theo dõi một CV:

1. C#: `ApplicationService.SubmitApplicationAsync` tại bước gọi `ValidateCvAsync`.
2. Python: `analysis_controller.validate_cv`.
3. Python: `doc_parser_service.extract_document_from_file` trước và sau `choose_best_candidate`.
4. C#: `AiEvaluationService.RunAiEvaluationInBackgroundAsync` trước lời gọi AI.
5. Python: `analysis_controller.score_cv`.
6. Python: `cv_analysis_service.score_resume_sync` sau `extracted_info`, sau `scoring_result` và trước `return`.
7. Python: `scoring_service.generate_content_with_retry` khi chọn router/model/key.
8. C#: `AiEvaluationService` trước `_context.SaveChangesAsync()`.

Chỉ cần theo một CV qua tám điểm này trước; sau đó mới đi sâu vào từng thuật toán.

## 11. Nợ kỹ thuật cần nhớ khi trình bày

- `Task.Run` trong web process cho phép nộp nhiều job nhưng không phải job queue bền vững; backend restart giữa chừng có thể làm tác vụ đang chạy mất. Luồng retry/hoàn tất lại là lớp phục hồi hiện tại.
- Cache extraction/score nằm trong RAM Python; restart hoặc nhiều replica không dùng chung cache.
- Model Apriori/HUIM được lưu file runtime; nếu chạy nhiều replica phải dùng volume/state dùng chung hoặc chỉ định một instance huấn luyện.
- `scoring_service.py` và `cv_analysis_service.py` còn lớn; nên tách tiếp orchestration, scoring rules, evidence và language review sau khi khóa luận ổn định.
- Kết quả synthetic chứng minh luồng và tính nhất quán, không chứng minh accuracy trên CV thật hoặc toàn thị trường.
