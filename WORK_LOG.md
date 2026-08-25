# Nhật ký thực hiện RecruitInsightAI

File này là nhật ký nối tiếp, không chứa credential hoặc dữ liệu cá nhân thật. Mục mới được thêm ngay dưới tiêu đề `Nhật ký thực hiện`, theo thứ tự mới nhất trước.

## Trạng thái môi trường

| Môi trường | Trạng thái xác nhận gần nhất | Commit | Ghi chú |
|---|---|---|---|
| Local | AI v5/timeline/observation đã đạt test; dữ liệu người dùng được giữ ngoài Git | `1db890a` + artifact untracked | Sáu ZIP 450 CV và tài liệu demo chưa nhập database, chưa stage |
| Git remote | Code AI v5, migration và tài liệu liên quan đã push | Nhánh `feature/feature-based-refactor-vps` | Commit runtime `1db890a`; không chứa credential hoặc ZIP dữ liệu |
| VPS | Bốn container healthy; migration observation đã áp dụng; HTTPS đạt | `1db890a` | AI/backend/frontend/9Router healthy, `/health` 200, API Admin ẩn trả 401 khi anonymous |

## Nhật ký thực hiện

### 2026-08-25 17:08 +07:00 — P1-04-CHATBOT-FAST-PATH-LOCAL — Rút ngắn chatbot, xác thực job gợi ý và cập nhật bản đồ Python

- Trạng thái: `ĐANG LÀM`; code, unit test, compile và backend build local đã đạt, chưa commit/push/deploy VPS tại thời điểm ghi mục này.
- Mục tiêu/phạm vi: giảm thời gian chatbot nhưng vẫn giữ ngữ cảnh có kiểm soát; tách model chatbot khỏi chuỗi model phân tích CV; không lưu lỗi provider như phản hồi AI; đối chiếu thẻ job do model sinh với SQL; cập nhật tài liệu đọc source cho toàn bộ chức năng Python. Không thay credential, DNS, firewall, dữ liệu tuyển dụng, API key hoặc SQLite 9Router.
- Quyết định kỹ thuật: thêm `LLM_ROUTER_CHAT_MODELS` mặc định `Gemini,deepseek`; `/chat` ưu tiên router với ngân sách 12 giây, request direct tối đa 10 giây trong ngân sách 12 giây và giới hạn khoảng 900 output token. `_generate_router_content` nhận model list theo chức năng và log thời gian millisecond nhưng không log prompt/secret.
- Hợp đồng lỗi và độ chính xác ngữ cảnh: Python `/chat` trả HTTP 503 khi provider không tạo được phản hồi; backend chuyển thành `ChatbotUnavailableException`/HTTP 503 tiếng Việt và không ghi `ChatMessages` lỗi như AI success. Backend chỉ giữ thẻ `[RECOMMEND_JOB]` có ID trong sáu job SQL vừa cấp cho prompt, đồng thời ghi đè vị trí/khu vực/lương bằng dữ liệu SQL; ID lạ bị loại.
- Tài liệu/source: `Python/SOURCE_FLOW_GUIDE.md` được mở rộng thành bản đồ endpoint/service/state/test đầy đủ và đính chính `Task.Run` cũ thành hàng đợi SQL `AiEvaluationTask` có grace 30 giây, huỷ/retry/recovery. `Python/README.md` ghi fast-path mới. Trong lúc đối chiếu endpoint phát hiện `/extract-cv` gọi `nlp_processor` nhưng thiếu import và đã bổ sung import trực tiếp.
- File thêm/sửa trong phạm vi: `.env.example`, `docker-compose.yml`, `Python/{README.md,SOURCE_FLOW_GUIDE.md}`, `Python/controllers/{analysis_controller.py,chat_controller.py}`, `Python/services/{gemini_service.py,scoring_service.py}`, hai test router/fallback, backend `ChatbotController.cs`, `ChatbotService.cs`, exception `ChatbotUnavailableException.cs`, `PROJECT_CONTEXT.md`, `WORK_LOG.md`.
- API/database/migration/cấu hình: `/chat` Python và `/api/Chatbot/chat` đổi lỗi dependency từ payload success giả sang HTTP 503; response thành công giữ tương thích. Thêm biến môi trường tùy chọn `LLM_ROUTER_CHAT_MODELS`; không đổi schema và không có migration/rollback database. Rollback code là bỏ model list riêng và exception typed, nhưng không nên quay lại lưu thông báo lỗi như câu trả lời AI.
- Kiểm thử thực tế: `python -m compileall` cho controller/service/DTO/utils/main đạt; `tests.test_llm_router_service` + `tests.test_local_analysis_fallbacks` đạt 17/17, gồm model list theo chức năng, forward cấu hình, router-first và provider failure. Backend Release build trước khi chốt tài liệu đạt 0 lỗi/442 warning legacy. `git diff --check` không có whitespace error, chỉ cảnh báo line ending Windows.
- Git/VPS/hạn chế: HEAD vẫn `7343fce`; worktree giữ nguyên `JobService`, tool Selenium, ZIP/thư mục CV, tài liệu demo và các artifact ngoài phạm vi. Chưa đo chatbot sau image mới và chưa kiểm chứng HTTPS; bước tiếp theo là stage đúng file, commit/push, deploy profile 9Router, đo request thật tối thiểu và kiểm tra container/log/API trước khi đổi `ĐÃ XONG`.

### 2026-08-25 15:12 +07:00 — P0-04-P1-03-AI-QUEUE-MOBILE-LOCAL — Hàng đợi AI bền vững và trang Jobs mobile

- Trạng thái: `ĐANG LÀM`; code, migration và build local đã đạt, chưa commit/push/deploy VPS tại thời điểm ghi mục này.
- Mục tiêu/phạm vi: tách trạng thái AI khỏi trạng thái tuyển dụng, thêm grace 30 giây để ứng viên có thể rút trước khi tốn lượt provider, retry lỗi tạm thời hữu hạn và sửa danh sách/chi tiết Jobs ở viewport mobile. Không thay credential, DNS, firewall, dữ liệu tài khoản, dữ liệu tuyển dụng hoặc SQLite 9Router.
- Nghiệp vụ: Application được lưu `Applied` cùng `AiEvaluationTask` trong một transaction; task mới `Pending` với `NotBeforeUtc` sau 30 giây. Cooldown chỉ thuộc từng application nên ứng viên vẫn nộp job khác ngay. Rút hồ sơ giữ Application/CV/lịch sử, chuyển task chưa chạy sang `Cancelled` hoặc task đang chạy sang `CancelRequested`; không cho nộp lại cùng job/vòng tuyển. HR vẫn là vai trò duy nhất chuyển `Reviewing`.
- Worker/API/UI: worker dùng claim có RowVersion, đọc lại trạng thái huỷ trước khi ghi kết quả, retry 30 giây/2 phút/5 phút và dừng lỗi xác thực/đầu vào. API danh sách trả `aiStatus`, lịch chạy, số lần thử và lỗi an toàn; UI phân biệt đang chờ/đang xử lý/hẹn thử lại/đã huỷ/thất bại, không dùng popup spinner toàn màn hình và không trình bày fallback như AI thật.
- Mobile Jobs: bộ lọc nâng cao mặc định thu gọn dưới breakpoint `lg`; search hero, sort, card việc làm, lương, metadata, hai nút thao tác và pagination tự co ở 390px. Trang chi tiết xếp logo/thông tin/nút theo một cột, form chọn CV cho phép tag/tên file xuống dòng. Đồng thời sửa pagination từ 10 sang đúng PageSize API 12.
- Database/migration: thêm `20260825074726_AddDurableAiEvaluationQueue`, cột nullable `CandidateCVs.ContentHash`, bảng `AiEvaluationTasks`, khóa ngoại cascade và các index application/status-time/hash. Migration chỉ cộng thêm schema và không backfill application cũ để tránh bùng quota. Rollback ưu tiên giữ schema và quay image/source; nếu buộc chạy `Down` về `20260825040550_AddSkillObservationQueue` thì bảng task và ContentHash sẽ bị xóa nên phải sao lưu trạng thái task trước.
- File chính: backend thêm constants/model/DTO/interface/settings/queue service/worker/migration và cập nhật `AppDbContext`, `ApplicationService`, `AiEvaluationService`, `Program`, cấu hình; frontend cập nhật trạng thái application/profile/apply và thêm CSS responsive cho `CandidateJobPage`, `CandidateJobDetailPage`, `JobApplyModal`; `PROJECT_CONTEXT.md`, `WORK_LOG.md` được cập nhật.
- Kiểm thử thực tế: backend `dotnet build -c Release --no-restore` đạt 0 lỗi/442 warning legacy; frontend `npm run build` đạt 3.306 module và hoàn tất Vite, chỉ còn warning chunk lớn/annotation SignalR đã biết. EF sinh script idempotent đúng `ContentHash`, bảng, FK, ba index và migration history; script tạm đã xóa sau kiểm tra. `git diff --check` không có whitespace error, chỉ cảnh báo chuyển LF/CRLF của Git trên Windows.
- Git/VPS/hạn chế: worktree vẫn giữ nguyên thay đổi `JobService`, tool Selenium, sáu ZIP/thư mục CV và tài liệu demo của người dùng ngoài phạm vi; các file đó không được đưa vào stage. Local không kết nối được SQL public nên chưa áp migration local; bước tiếp theo là stage đúng phạm vi, push, pull VPS, chạy deploy có profile 9Router, xác nhận migration/container/HTTPS/API và audit không tràn ngang 390px trước khi đổi trạng thái `ĐÃ XONG`.

### 2026-08-25 11:28 +07:00 — P0-02-AI-V5-VPS — Triển khai timeline đúng và hàng đợi kỹ năng lên VPS

- Trạng thái: `ĐÃ XONG` phần code, migration, Git và triển khai VPS của P0-02/AI v5. Theo yêu cầu người dùng, dừng trước bước nhập 450 PDF; không có CV trong sáu ZIP được upload, không tạo application và không ghi dữ liệu kiểm thử mới vào SQL trong mục này.
- Mục tiêu/phạm vi: phát hành commit sửa timeline CV không có việc làm, observation kỹ năng có kiểm soát, version gate v5 và giới hạn chatbot; không thay đổi credential, DNS, firewall, dữ liệu tài khoản hoặc 9Router SQLite.
- Git/deploy: commit `1db890a` (`fix(ai): correct experience timeline and observe new skills`) đã push lên nhánh `feature/feature-based-refactor-vps`; VPS fast-forward từ `5fc56d2` lên `1db890a` và chạy `deploy/vps/deploy.sh` với profile 9Router. Backend/frontend/AI build thành công; frontend chỉ còn warning chunk lớn và annotation SignalR đã biết, backend 0 lỗi/449 warning legacy.
- Database/migration: EF áp dụng `20260825040550_AddSkillObservationQueue`, tạo `SkillObservations`, khóa chính và ba index rồi ghi lịch sử migration. Log sau khởi động không có `Unhandled exception`, `Failed executing` hoặc `fail:`. Rollback vẫn là migration `Down`: xóa bảng observation và trả `CandidateCvDomains.Confidence` về precision trước đó.
- Runtime AI/mining: AI service chờ backend trong hai lần đầu rồi đồng bộ taxonomy SQL thành công với 140 kỹ năng/58 bí danh. Scheduler cập nhật 2 phân loại domain, chạy Apriori riêng cho 7 ngành và HUIM riêng cho 4 ngành; toàn bộ request train quan sát được trả HTTP 200. Đây là xác nhận luồng chạy, không phải phép đo accuracy thị trường.
- Smoke production: bốn container `ai-service`, backend, frontend và 9Router đều `healthy`; `https://recruitinsightai.com/health` trả 200. `GET /api/jobs/published?pageSize=100` trả 44 tin công khai; đã quan sát các vị trí mới thuộc cloud/security/AI/product. API ẩn `GET /api/skills/observations` trả 401 khi không đăng nhập, đúng ranh giới Admin.
- Dữ liệu mới còn lại: sáu ZIP chứa đúng 450 PDF/30 nhóm/15 CV mỗi nhóm. Automation cũ chưa hỗ trợ trực tiếp ZIP gắn với job được người khác tạo; đã chỉ đọc cấu trúc để xác nhận nhóm, chưa sửa tool và chưa giải nén. Bước sau phải đối chiếu đủ 30 `JobID`, hạn/trạng thái nhận hồ sơ và chạy Selenium có checkpoint; không dùng 44 tin công khai làm bằng chứng rằng mọi cặp nhóm-job đã ghép đúng.
- File tài liệu cập nhật trong bước chốt: `PROJECT_CONTEXT.md`, `WORK_LOG.md`. Worktree tiếp tục giữ nguyên sáu ZIP, thư mục tài liệu demo và script demo của người dùng ở trạng thái untracked.

### 2026-08-25 11:21 +07:00 — P0-02-P2-01-AI-V5-LOCAL — Sửa timeline, học kỹ năng có kiểm soát và rút ngắn chatbot

- Trạng thái: `ĐANG LÀM`; code/migration/test local đã đạt, chưa commit/push/deploy VPS và chưa nhập 450 PDF mới vào luồng ứng tuyển.
- Mục tiêu/phạm vi: sửa trường hợp CV chỉ có học vấn/dự án nhưng bị tính 44 tháng kinh nghiệm; không bỏ mất kỹ năng ngoài catalog mà cũng không cho từ lạ đi thẳng vào scoring/Apriori/HUIM; đánh dấu kết quả cũ cần phân tích lại; giảm thời gian chờ chatbot. Phạm vi gồm Python AI, backend/DTO/schema, hai điểm frontend và tài liệu flow; không sửa credential, DNS, firewall hoặc dữ liệu nghiệp vụ.
- Timeline/nghiệp vụ: chỉ section kinh nghiệm hoặc block fallback có bằng chứng việc làm/thực tập mới tạo tháng nghề nghiệp. Education, Project, Certificate, Hackathon không được tính tenure nhưng vẫn là bằng chứng kỹ năng. Context từng giai đoạn dừng tại mốc ngày kế tiếp để không gán skill của công việc sau cho công việc trước. Regression trên `TranAnhDuc_InternBackend_Developer.pdf` trả 0 tháng vì hồ sơ chỉ có Summary/Education/Skills/Projects/Certificate; case thực tập không heading `04/2026–06/2026` trả đúng 3 tháng.
- Kỹ năng mới: Python chỉ trích observation từ vùng Skills/Technology/Tools/Requirements và trả riêng khỏi kỹ năng canonical. Backend lưu provenance CV/JD, evidence, confidence và trạng thái vào `SkillObservations`; cùng nguồn/cụm được upsert bằng SQL parameter. Scheduler startup/02:00 gom theo nguồn độc lập: tối thiểu 3 nguồn, ít nhất 2 CV hoặc 2 JD và confidence trung bình từ 0,75 mới chuyển sang chờ duyệt. Observation chưa duyệt không chấm điểm, không tạo red flag và không train mining. API review chỉ cho Admin, có kiểm tra xung đột tên/alias; không thêm màn hình thuật toán.
- Dữ liệu cũ/phiên bản: kết quả mới ghi `analysis_version=5`; backend/frontend xem v4/legacy là chưa hoàn chỉnh để người sở hữu chạy lại. Không bulk re-analysis âm thầm vì sẽ đổi lịch sử và tiêu tốn quota. Khi retry thành công, `CandidateCV.CVExtractedSkills`/JD được cập nhật; fingerprint mining nhận thay đổi ở lần startup hoặc 02:00 kế tiếp. Apriori/HUIM không tự ghi đè `AIEvaluation` cũ.
- Chatbot: backend chỉ tải tối đa 6 job còn hạn khi câu hỏi có ý định tìm việc/lương, giới hạn prompt/history/JD, dùng truy vấn `AsNoTracking` và timeout HTTP 35 giây. Python giới hạn 10 lượt lịch sử, dùng Gemini trực tiếp trong ngân sách 20 giây rồi thử 9Router tối đa 8 giây, giới hạn 900 token. Frontend gửi 10 tin gần nhất và timeout 45 giây; đây là giới hạn độ trễ, không phải cam kết provider luôn thành công.
- Database/migration: thêm migration `20260825040550_AddSkillObservationQueue`, tạo bảng/ba index và đồng thời reconcile `CandidateCvDomains.Confidence` về `decimal(5,2)` đúng model. Script idempotent từ `20260822011500_AddSkillAliases` đã sinh đúng `ALTER COLUMN`, `CREATE TABLE`, index và lịch sử migration. Rollback `Down` xóa `SkillObservations` và trả precision cũ `decimal(18,2)`; chưa áp migration lên database local/production trong mục này.
- Dữ liệu kiểm thử mới: sáu ZIP người dùng cung cấp chứa đúng 450 PDF duy nhất cho 30 JD, 15 CV/JD; 450/450 có text, độ dài khoảng 1.282–2.858 ký tự và hiện đều một trang. Nhóm E/F khai báo 3–4 template. Bộ này hữu ích cho E2E/scoring nhưng chưa chứng minh OCR scan/nhiều trang hay accuracy thị trường; chưa giải nén, chưa stage và chưa ghi vào database. Người dùng cho biết 30 tin tương ứng đã được tạo trên hệ thống, cần đối chiếu trạng thái/ID trước khi chạy Selenium.
- File chính: `timeline_service.py`, `skill_observation_service.py`, `nlp_processor.py`, `cv_analysis_service.py`, `gemini_service.py`, `scoring_service.py` và test/tài liệu Python; backend thêm model/service/interface/migration/API observation và cập nhật AI evaluation/application/chatbot/scheduler; frontend cập nhật trạng thái phân tích và chatbot; `PROJECT_CONTEXT.md` được cập nhật quyết định/backlog.
- Kiểm thử thực tế: Python mục tiêu đạt 42/42 test gồm extraction gate, timeline, alias/observation, Gemini failover và direct-first → router fallback; còn warning tương thích spaCy model 3.8 với runtime 3.7.4. Backend Release build đạt 0 lỗi/449 warning legacy; frontend production build trước thay đổi test cuối đạt, chỉ còn warning chunk/SignalR đã biết. EF sinh script idempotent đúng và `git diff --check` không có whitespace error. Quét file thay đổi không phát hiện credential hard-code; kết quả khớp tên biến cấu hình như `API_KEY`/`DefaultConnection` không chứa giá trị.
- Git/VPS/bước tiếp theo: worktree giữ nguyên sáu ZIP và hai artifact demo của người dùng ở trạng thái untracked, không stage. Tiếp theo commit riêng code liên quan, push, deploy VPS, xác nhận migration/container/health/API/HTTPS rồi mới chạy batch 450 CV qua UI với checkpoint; không gọi batch thành công trước khi có report thực tế.

### 2026-08-25 01:47 +07:00 — VPS-9ROUTER-README-CLOSE — Nghiệm thu router và tạo trang giới thiệu dự án

- Trạng thái: `ĐÃ XONG` cho migration/triển khai 9Router, circuit breaker Python và README gốc; không thay đổi SQL Server hoặc dữ liệu tuyển dụng trong bước nghiệm thu.
- 9Router runtime: commit `b5322a2` đã build/recreate riêng `ai-service`; bốn container `9router`, `ai-service`, backend và frontend đều healthy, origin `/health` trả 200. Port router được xác nhận đúng `127.0.0.1:20128`; `/v1/models` từ container Python trả 200 với 18 model.
- Provider thật: probe sau deploy qua combo `Gemini` có một lượt thành công trong 1,84 giây, xác nhận OAuth/provider trong SQLite đã dùng được trên VPS. Lượt kế tiếp timeout đúng ngân sách 25 giây và chuyển cooldown; kết quả thất thường phù hợp trạng thái tài khoản free, không được diễn giải thành SLA. Unit JSON/SSE/budget/cooldown vẫn đạt 4/4.
- Bảo mật/khôi phục: đã xóa các bản sao tạm chứa SQLite/script/probe khỏi `/tmp` VPS và khỏi container sau nghiệm thu; bản backup nhất quán còn ở `.local` trên máy người dùng nên có thể phục hồi, không nằm trong Git. Dashboard chỉ quản lý qua SSH tunnel cổng local `20129`; không mở firewall/Nginx cho 9Router.
- README: thêm `README.md` ngay root với phần giới thiệu, badges công nghệ, bảng chức năng theo vai trò, hai sơ đồ Mermaid, luồng OCR/scoring/bằng chứng/red flag, Apriori/HUIM, cấu trúc source, hướng dẫn local/VPS, 9Router, dữ liệu kiểm thử, bảo mật và giới hạn. Không dùng ảnh cũ `ai_recruitment_visual.png` làm banner vì nội dung minh họa có lỗi chữ và không phản ánh dữ liệu thật.
- Cấu hình mẫu: `.env.example` đổi model mặc định lỗi thời Gemini 2.x sang chuỗi Gemini 3.x đang dùng và bổ sung toàn bộ biến 9Router dưới dạng comment/placeholder; không chứa credential. Commit `5fc56d2` đã push và VPS fast-forward; `docker compose --profile llm-router config --quiet` đạt, không recreate container vì thay đổi chỉ là README/config mẫu.
- Kiểm thử tài liệu: README có 334 dòng, 28 code fence cân bằng và 0 relative link bị thiếu; `git diff --check` đạt. Local không chạy được Compose do Docker Desktop/config không khả dụng, nhưng cùng Compose đã được xác nhận trực tiếp trên VPS sau pull. Không ghi đây là lỗi source.
- Git/trạng thái còn lại: hai tệp demo untracked có credential thử nghiệm tiếp tục bị loại khỏi stage/commit. Hạn chế tiếp theo của P3-02 vẫn là snapshot AI lịch sử chưa tự được phân tích lại; đây là task riêng, không phải lỗi 9Router/README.

### 2026-08-25 01:39 +07:00 — VPS-9ROUTER-MIGRATION — Chuyển nguyên SQLite và bảo vệ failover

- Trạng thái: `ĐANG LÀM`; 9Router/SQLite trên VPS đã phục hồi và healthy, code circuit breaker đạt unit local nhưng chưa commit/push/rebuild `ai-service`.
- Mục tiêu/phạm vi: đưa 9Router local lên Ubuntu như provider dự phòng mà không bắt người dùng tạo lại provider OAuth, combo hoặc API key; không công khai dashboard và không để tài khoản free lỗi làm chậm toàn bộ batch CV.
- Dữ liệu/bảo mật: SQLite Online Backup trả `integrity=ok`, app `0.5.55`, 11 provider, 2 combo và 2 API key active. Gói sao lưu nằm trong `.local` bị Git ignore, truyền bằng SSH, đặt mode `600`; secret/value/email/token không được in ra. Phục hồi cả database, JWT, machine identity và trạng thái auth vào volume `recruitment_nine_router_data`; local giữ nguyên làm rollback.
- VPS/cấu hình: ghim `decolua/9router:0.5.55` để khớp schema, profile `llm-router`, port chỉ `127.0.0.1:20128`; Python gọi `http://9router:20128/v1`. Dashboard dùng SSH tunnel, đề xuất cổng local `20129` vì `20128` đang được bản Windows sử dụng. Cả `9router`, `ai-service`, backend và frontend đều healthy.
- Kiểm thử thật: từ container Python gọi `/v1/models` đạt HTTP 200 và nhận 18 model, xác nhận network nội bộ, SQLite và API key hoạt động. Completion qua combo chưa thành công: VPS log Antigravity refresh trả 403/không có project ID; đối chứng ngay trên local trả `deepseek=429` và `Gemini=timeout`, nên đây là trạng thái provider/tài khoản free hiện tại, không phải mất dữ liệu do migration. Không khẳng định upstream AI đã khả dụng.
- Sửa failover local: `gemini_service.py` thêm ngân sách tổng router 25 giây và cooldown 120 giây; sau lần router lỗi, request kế tiếp đi thẳng Gemini trực tiếp/fallback thay vì thử lại ba model × 25 giây. Compose thêm hai biến tương ứng; test router JSON/SSE/budget/cooldown đạt 4/4, `py_compile` và `git diff --check` đạt.
- Database/API/migration: không đổi SQL Server, không chạy EF migration, không ghi dữ liệu tuyển dụng. Chỉ phục hồi SQLite riêng của 9Router. Không đổi DNS/firewall/Nginx.
- File sửa: `Python/services/gemini_service.py`, `Python/tests/test_llm_router_service.py`, `docker-compose.yml`, `deploy/vps/9router-ubuntu.md`, `PROJECT_CONTEXT.md`, `WORK_LOG.md`.
- Rollback: dừng profile 9Router, bỏ `LLM_ROUTER_BASE_URL` khỏi `.env` rồi recreate `ai-service`; volume và gói backup vẫn giữ. Hạn chế còn lại: chờ quota free reset hoặc người dùng chủ động refresh provider; circuit breaker cần được commit/push và deploy trước khi đóng task.

### 2026-08-25 01:22 +07:00 — VPS-DEPLOY-45FDD9C — Phát hành bản realtime, audit AI và responsive

- Trạng thái: `ĐÃ XONG` cho commit/push/deploy ba service lõi và smoke HTTPS; 9Router vẫn là profile tùy chọn chưa bật, P3-02 tổng thể vẫn `ĐANG LÀM` theo các hạn chế audit snapshot.
- Mục tiêu/phạm vi: phát hành toàn bộ thay đổi đã kiểm thử từ các task realtime/filter/responsive, dữ liệu E2E, fallback ngôn từ và policy red flag; giữ Git là nguồn phát hành và không sao chép credential vào repository/log.
- Git/bảo mật: commit `45fdd9c1b7151caf58061d7dadf669a300455fe5` gồm 179 tệp tích lũy đã push lên `feature/feature-based-refactor-vps`. Quét vùng stage phát hiện hai tệp demo có thông tin đăng nhập thử nghiệm; hai tệp này được loại khỏi commit và vẫn untracked local. `.env`, deploy key, API key, token và connection string không được stage/in ra log.
- VPS: IP origin mới `180.93.100.30`, SSH bằng user `ubuntu`; source cũ và `.env` còn nguyên ở `/home/ubuntu/KhoaLuan`, nên không dùng thư mục `/opt/recruitment/app` trống vừa tạo. VPS fast-forward sạch từ `7d1e2db` lên `45fdd9c`; `docker compose config --quiet` đạt. Script có rollback build/activate thành công `ai-service`, `backend`, `frontend`; backend image build 0 lỗi/452 warning legacy, frontend Vite build đạt với warning chunk/SignalR đã biết.
- Health/API/log: cả ba container báo `healthy`. Origin HTTPS qua Nginx trả 200 cho `/health`, `/api/jobs/published`, `/api/skills`; `/api/dashboard/admin-stats` ẩn danh trả đúng 401. Log 5 phút sau startup có 0 `Unhandled exception`, 0 `Failed executing DbCommand`; không có migration/schema mới trong commit và dữ liệu cũ không bị xóa.
- HTTPS công khai: ba lượt `/health` từ máy ngoài đều 200 trong 0,36–0,43 giây; `/api/jobs/published` trả 200 trong 1,26 giây. Đây là smoke latency đơn lẻ, không phải benchmark tải hoặc SLA.
- Vai trò/UI: Selenium production read-only đạt 26 bước gồm đăng nhập HR và 24 route/breakpoint HR; dừng khi tool đổi phiên từ HR sang Admin trong cùng Chrome. Retry vẫn dừng đúng điểm này, nhưng access log cho thấy các POST login đều 200, probe API Admin trả 200/role Admin và người dùng xác nhận tự đăng nhập được cả Admin lẫn HR. Vì vậy ghi đây là hạn chế cô lập phiên của automation, không kết luận production login lỗi; audit local trước deploy đã đạt 54/54 cho 17 route × 3 breakpoint.
- Database/API/cấu hình: không migration, không thay DNS/firewall và không bật `llm-router`. Database external dùng nguyên cấu hình VPS hiện có; deploy không chạy seeder hoặc cleanup dữ liệu.
- Rollback: image trước deploy đã được gắn tag `rollback` cho cả ba service. Nếu cần, dùng script rollback/image tag theo `deploy/vps/deploy.sh`; schema không cần rollback. Source có thể trở về commit `7d1e2db`, nhưng chưa có lý do rollback vì health/API/đăng nhập đều đạt.
- Hạn chế/bước tiếp theo: sửa tool để mỗi role dùng browser riêng hoặc audit role độc lập trước lần đo kế tiếp; chọn một số snapshot lịch sử để phân tích lại policy mới. 9Router chỉ cấu hình sau khi secret được nhập trực tiếp trên VPS và phải kiểm tra profile/health/request thật riêng.

### 2026-08-25 01:12 +07:00 — P3-02-AI-SNAPSHOT-AUDIT — Audit 480 kết quả và thu hẹp chính sách red flag

- Trạng thái: `ĐANG LÀM`; audit dữ liệu đã lưu, sửa policy, unit mục tiêu và live API local đạt. Chưa phân tích lại các snapshot lịch sử; đang chuẩn bị commit/push/deploy VPS theo yêu cầu người dùng.
- Mục tiêu/phạm vi: kiểm tra kết quả AI thực sự đã lưu cho 24 job/480 application synthetic, tránh chỉ dựa vào việc request trả 200; đồng thời giảm tải trang chiến dịch và sửa hai lỗi nghiệp vụ đã phát hiện: ngôn từ `insufficient` trên văn bản đọc tốt và red flag bao gồm cả điểm yếu thông thường.
- API/hiệu năng: `GET /api/Recruitment/hr/applications` nhận thêm `jobId` tùy chọn và lọc tại SQL; frontend chiến dịch chỉ tải application của đúng job. Sau khi backend được restart, probe một job trả 22 bản ghi, không có job ngoại lai và hoàn tất trong 621 ms; trước đó request chi tiết toàn bộ 638 application kéo dài hơn 2 phút. Contract cũ không truyền `jobId` vẫn tương thích.
- Audit Selenium read-only: lệnh `audit-job-scores` đạt 29/29 bước, đọc đủ 480/480 checkpoint, không thiếu profile và chỉ ghi `job_key/profile_key` cùng số liệu tổng hợp, không ghi tên/email/điện thoại/CV/đoạn trích. Có 81 mức điểm từ 0 đến 100, trung bình 37,99; phân bố không bị dồn về 100. Snapshot gồm 479 JSON v4 và 1 legacy; extraction 471 high, 8 partial, 1 thiếu; deep analysis 393 success, 86 degraded, 1 thiếu; bằng chứng tiêu chí 1.907/3.832 (49,77%).
- Phát hiện cần đính chính dữ liệu cũ: 211 snapshot mang language state `insufficient:unknown` dù phần lớn extraction an toàn; đây là kết quả đã lưu trước bản fallback ngôn từ hiện tại, không phải 211 CV không đọc được. Có 373/480 hồ sơ với 972 red flag cũ; nhiều mục thuộc `GENERIC_CV`, `MISSING_METRICS`, `CHRONOLOGY_GAP` hoặc `OTHER`, nên không đủ căn cứ gọi là red flag.
- Quyết định/sửa AI: prompt và hậu kiểm chỉ cho phép `KEYWORD_STUFFING`, `INTERNAL_CONTRADICTION`, `CREDENTIAL_INCONSISTENCY`, `CONTACT_INCONSISTENCY`, `CHRONOLOGY_INCONSISTENCY`; OCR, thiếu kỹ năng JD, thiếu số liệu, mô tả chung và gap thông thường không phải red flag. Các mục hữu ích bị trả nhãn cũ được chuyển sang `weaknesses` thay vì xóa mất. Timeline xác định bằng quy tắc vẫn bắt mốc đảo và mốc sau ngày phân tích, kể cả tiêu đề kinh nghiệm nằm cùng dòng. Không ép hồ sơ bình thường phải có cảnh báo.
- File chính sửa: backend `RecruitmentController.cs`, `IApplicationService.cs`, `IRecruitmentService.cs`, `ApplicationService.cs`, `RecruitmentService.cs`; frontend hai `recruitmentService.ts` và `useCampaignApplications.ts`; Python `scoring_prompts.py`, `scoring_service.py`, `cv_analysis_service.py`, `test_scoring_evidence.py`; Selenium `webapp.py`, `run.py`, `README.md`; tài liệu `PROJECT_CONTEXT.md`, `WORK_LOG.md`.
- Kiểm thử: backend custom build 0 lỗi/452 warning legacy; frontend production build đạt, còn warning chunk/SignalR đã biết; Selenium unit 10/10; audit runtime 29/29. Unit hậu kiểm Python đạt 25/25 khi loại đúng một test alias không thể khởi tạo do Windows lỗi native `torch/c10.dll`; full nhóm không được ghi là đạt. Live `POST /score-cv-text` bằng CV tổng hợp không lưu DB trả success, điểm yếu 3, `language_insufficient=false`, mode Gemini và 0 red flag/suspicion đúng dữ liệu đầu vào.
- Database/migration/cấu hình: không đổi schema, không migration, không ghi dữ liệu nghiệp vụ trong audit/live text test. Report an toàn nằm tại `.local/selenium-e2e/local-create-jobs-ui-20260824/job-score-audit.json` và bị Git ignore.
- Git/VPS/rollback: trước phát hành HEAD local và VPS cùng `7d1e2db`; VPS mới ở `180.93.100.30`, source và `.env` cũ còn tại `/home/ubuntu/KhoaLuan`, ba container hiện hữu. Không ghi credential vào log. Rollback API là bỏ tham số `jobId`; rollback policy là phục hồi danh sách loại red flag cũ, không liên quan schema.
- Hạn chế/bước tiếp theo: snapshot cũ không tự được sửa; cần phân tích lại tập mẫu sau deploy để chứng minh policy mới trên dữ liệu đã lưu. P3-02 chưa hoàn tất role-flow HR/Admin và báo cáo tổng hợp, benchmark synthetic không phải accuracy thị trường.

### 2026-08-25 00:31 +07:00 — REALTIME-FILTER-RUNTIME-10 — Sửa API chiến dịch và nghiệm thu HR/Admin trên trình duyệt

- Trạng thái: `ĐÃ XONG` local cho P1-03; chưa commit/push/deploy VPS, không thay đổi DNS/firewall/credential và không ghi dữ liệu nghiệp vụ trong audit.
- Mục tiêu/phạm vi: nghiệm thu runtime endpoint chiến dịch mới, realtime connection, bộ lọc và responsive menu HR/Admin sau khi người dùng khởi động lại backend; kiểm tra bằng tài khoản HR/Admin qua Selenium nhưng chỉ đọc dữ liệu.
- Lỗi runtime thật và cách sửa: `GET /api/Jobs/my-campaigns` ban đầu trả 500 `Nullable object must have a value` tại phép `LEFT JOIN` thống kê application. `JobService` nay lấy danh sách chiến dịch trước, chạy một truy vấn `GROUP BY JobID` riêng cho các ID thuộc quyền HR rồi ghép số liệu trong bộ nhớ. Vẫn chỉ có hai truy vấn tổng hợp, không tải CV, PII hay báo cáo AI; dữ liệu cũ thiếu quan hệ không còn làm materializer lỗi.
- Đính chính audit đầu: lượt đầu 43/54 và lượt hai 45/54 không phải 11/9 lỗi responsive. Một lỗi là endpoint chiến dịch 500; các lỗi lịch/email/Admin còn lại do tool dùng `driver.get` tải lại cả MainLayout ba lần/route và tự vượt global quota 100 request/phút. Audit nay tải mỗi route một lần, đổi breakpoint trên cùng DOM và dùng History API giống React Router; đồng thời chờ nội dung/skeleton ổn định trước khi đo. Không nới rate limit backend và không bỏ kiểm tra alert lỗi.
- File sửa trong lượt nghiệm thu: `RecruitmentBackend/RecruitmentBackend/Services/JobService.cs`, `tools/selenium_e2e/webapp.py`, `tools/selenium_e2e/run.py`, `PROJECT_CONTEXT.md`, `WORK_LOG.md`. Endpoint/DTO/frontend realtime-filter đã được thêm ở mục `REALTIME-FILTER-RESPONSIVE-09` trước đó.
- API/database/cấu hình: giữ nguyên contract `GET /api/Jobs/my-campaigns`, phân quyền Recruiter và payload metadata + stats; không đổi schema, không tạo migration, không sửa cấu hình bảo mật. File `.env` Selenium bị Git ignore, log chỉ kiểm tra 4/4 biến đã có giá trị và không in credential.
- Kiểm thử thực tế: backend build custom output đạt 0 lỗi/452 warning legacy; endpoint runtime sau restart trả HTTP 200 trong khoảng 1,0 giây với 113 chiến dịch và đúng các nhóm field `position/category/branch/jobLevel/stats`; API lịch HR, email log, Admin jobs và users đều trả 200 khi probe read-only. `py_compile` đạt; Selenium unit đạt 10/10.
- Nghiệm thu trình duyệt cuối: report `portal-audit-20260825-verified` đạt 54/54 bước, gồm 51 kiểm tra của 17 route HR/Admin trên desktop 1440 px, tablet 820 px và mobile 390 px; `max_overflow_px=0`, không có alert lỗi, HTTP 429, Axios/connection/WebSocket/SignalR error hoặc lỗi network nội bộ. Bốn lỗi tải stylesheet Google Fonts là do môi trường Selenium chặn Internet và không ảnh hưởng chức năng; fallback font hệ thống vẫn render. Thời gian đo route chậm nhất 834 ms sau khi chờ skeleton, không dùng số này làm benchmark tải production.
- Realtime: hai hub dùng chung kết nối không phát lỗi trong browser log; dashboard realtime đã được người dùng xác nhận thủ công trước lượt audit. Audit read-only không phát sinh mutation chỉ để chứng minh event, nên không coi lượt này là load/concurrency benchmark.
- Git/VPS/hạn chế/bước tiếp theo: HEAD `7d1e2db`, giữ nguyên worktree bẩn từ các task trước. P1-03 được đóng ở local; 9Router Compose vẫn chỉ là cấu hình chuẩn bị, chưa deploy. Bước tiếp theo thuộc P3-02 là audit trạng thái/kết quả AI đã lưu trên tập CV đại diện, sau đó mới đóng gói commit và triển khai VPS khi hạ tầng Pika ổn định.

### 2026-08-25 00:12 +07:00 — REALTIME-FILTER-RESPONSIVE-09 — Tối ưu chiến dịch, đồng bộ HR/Admin và chuẩn bị 9Router Ubuntu

- Trạng thái: `ĐANG LÀM` local. Code/build/unit/Compose validation đã đạt; chưa thể nghiệm thu runtime endpoint mới và toàn bộ route responsive vì backend người dùng đang chạy bản cũ, còn bốn biến đăng nhập trong `tools/selenium_e2e/.env` đều để trống. Chưa commit/push/deploy hoặc thay đổi VPS/DNS/firewall.
- Mục tiêu/phạm vi: kiểm tra nguyên nhân trang HR/Admin chưa realtime, Quản lý tin/chiến dịch ít bộ lọc, chiến dịch search/reload chậm và các điểm UI tràn trên mobile; đồng thời xác định cách đưa 9Router đang chạy quyền cao ở Windows sang VPS Ubuntu mà không mở router công khai.
- Đính chính mục `FE-FILTERS-PERF` 23:33: so sánh state notification đã giảm re-render nhưng chưa giải quyết nút thắt chính. Trang chiến dịch vẫn tải toàn bộ `getHrApplications(false)` rồi group theo từng job và mới chỉ có vài bộ lọc; chưa đủ để gọi là tối ưu dữ liệu lớn hoặc responsive toàn hệ thống.
- Quyết định/backend: thêm `GET /api/Jobs/my-campaigns` dành riêng Recruiter, group/count application theo job trực tiếp trong SQL và chỉ trả metadata job + `total/new/interview/offer/hired`, không trả CV, PII hoặc báo cáo AI. Sửa nhãn `Đã tuyển` chỉ đếm trạng thái `Hired`, không đếm `Offer`. Tất cả mutation job phát `MetadataChanged`; application mới/trạng thái/kết quả AI phát event tối thiểu có `jobId`. Lỗi broadcast SignalR bị log warning nhưng không làm API nghiệp vụ báo thất bại sau khi DB đã lưu.
- Quyết định/frontend: `MainLayout` giữ một kết nối NotificationHub và một kết nối AIEvaluationHub, phát event tài nguyên dùng chung; các trang refetch nền có debounce thay vì bật skeleton. Poll notification 30 giây không đổi loading/state khi payload giống nhau. Chiến dịch ưu tiên endpoint tóm tắt, chỉ fallback O(A+J) khi backend cũ trả 404/405; danh sách tin và chiến dịch có tìm kiếm cùng vị trí/lĩnh vực/cấp bậc/chi nhánh, trạng thái/vòng đời, đợt tuyển, khoảng hạn, sắp xếp; chiến dịch thêm tình trạng hồ sơ và số CV/lượt xem. Option bộ lọc lấy từ dữ liệu thực đang có, không bày toàn catalog gây no-data giả.
- Responsive/UI: sửa toolbar dùng chung HR/Admin, active menu cho route chi tiết, Drawer mobile, header/breadcrumb ở màn nhỏ, biểu đồ dashboard HR, leaderboard, nhật ký email, form lưu ứng viên, toolbar duyệt tin Admin và các vùng flex/grid dễ tràn. Bảng/Kanban rộng vẫn dùng vùng scroll nội bộ có chủ ý, không ép co chữ đến mất khả năng đọc. Style giữ hệ thống sáng, màu/spacing/radius hiện có theo `style_guide`.
- Realtime danh mục: trang tạo tin và hook metadata HR nhận thay đổi Category/Position/JobLevel; trang Admin Organization nhận thay đổi Branch/Category/Level/Position/CriterionGroup; badge chờ duyệt Admin và danh sách phê duyệt nhận thay đổi job; trang chi tiết chiến dịch nhận thay đổi application/job.
- 9Router Ubuntu: thêm Compose profile `llm-router`, volume riêng, healthcheck, giới hạn tài nguyên và chỉ map `127.0.0.1:20128`; Python nhận bốn biến `LLM_ROUTER_*`. `deploy.sh` chỉ kèm profile/health khi `ENABLE_9ROUTER=true`. Tài liệu `deploy/vps/9router-ubuntu.md` mô tả SSH tunnel, secret `[REDACTED]`, sao lưu/khôi phục SQLite và rollback. Image chính thức hạ process xuống user `node`; quyền quản trị host chỉ cần cho Docker. Do issue upstream từng ghi nhận cờ host có thể vẫn bind mọi interface, lớp bảo vệ quyết định nằm ở port mapping loopback + API key, không dựa riêng vào `--host`.
- File chính thêm/sửa: backend `RecruiterCampaignSummaryDto.cs`, `IJobService.cs`, `JobService.cs`, `JobsController.cs`, `ApplicationService.cs`, `AiEvaluationService.cs`, `MetadataChangeNotifier.cs`; frontend `useRealtimeRefresh.ts`, `MainLayout.tsx`, `SideNav.tsx`, `TableToolbar.tsx`, các trang/hook Job Management, Campaign, Campaign Applications, Job Approval, Organization, Dashboard chart, Email Logs và Candidate Search Detail; deployment `docker-compose.yml`, `deploy/vps/deploy.sh`, `deploy/vps/9router-ubuntu.md`; automation `tools/selenium_e2e/{run.py,webapp.py,README.md}`.
- API/database/migration/cấu hình: thêm một GET tương thích ngược và payload SignalR tối thiểu; không đổi schema, không tạo migration, không ghi database trong task. Compose thêm profile tùy chọn, core ba service vẫn không phụ thuộc 9Router.
- Kiểm thử thực tế: backend build custom output đạt 0 lỗi/452 warning legacy; frontend `npm.cmd run build` đạt 0 lỗi TypeScript (chỉ warning chunk lớn và annotation SignalR có sẵn); Selenium unit `unittest` đạt 10/10; test adapter 9Router đạt 2/2; `py_compile` tool đạt; `docker-compose --profile llm-router config --quiet` đạt với placeholder validation; `git diff --check` không có whitespace error. `bash -n` chưa chạy được vì WSL trên máy trả `E_ACCESSDENIED`, không phải lỗi script.
- Selenium runtime: đã thêm lệnh read-only `portal-audit` đi qua 17 route HR/Admin ở desktop/tablet/mobile, đo load time, alert lỗi và document overflow. Lượt chạy dừng đúng validation trước khi mở browser vì credential env trống; không đưa mật khẩu đã trao đổi vào command/source/log để né quy tắc bảo mật.
- Git/VPS/hạn chế/bước tiếp theo: HEAD `7d1e2db`, giữ nguyên worktree rất bẩn từ các task dữ liệu/AI trước. Cần (1) người dùng điền credential vào `.env` bị ignore, (2) restart backend để nạp endpoint/event mới, (3) chạy `portal-audit` và smoke `my-campaigns`, rồi mới đánh dấu `ĐÃ XONG`; sau đó mới commit/push và triển khai Ubuntu. Không sao chép database/OAuth 9Router lên VPS khi router local còn đang ghi.

### 2026-08-24 23:33 +07:00 — FE-FILTERS-PERF — Bổ sung bộ lọc tin/chiến dịch và sửa giật khi poll thông báo

- Trạng thái: `ĐÃ XONG` local (build + typecheck đạt); chỉ frontend, chưa commit/push, không đụng backend/Python/API/database.
- Mục tiêu/phạm vi: theo phản hồi người dùng — bộ lọc Quản lý tin tuyển dụng và Quản lý chiến dịch quá ít; search/load trang giật khi poll thông báo; hoàn thiện nốt responsive còn sót của hệ thống.
- Bộ lọc mới (đều lọc client-side trên dữ liệu đã tải, không thêm endpoint): `JobManagementPage` thêm "Lọc theo Cấp bậc" (từ `raw.jobLevel.name`) và "Lọc theo Địa điểm" (branch), có showSearch, tham gia hasActiveFilters và nút Xóa lọc; `useJobCampaigns` thêm `jobBranchFilter` (state, options từ branch, điều kiện lọc, reset, return) và `JobCampaignListPage` thêm Select "Lọc chi nhánh" kèm đưa ô tìm kiếm cứng 300px về co giãn `100%/maxWidth 300`.
- Hiệu năng thông báo: `MainLayout.fetchNotifications` trước đây luôn `setNotifications(res.data)` mỗi 30 giây tạo state mới gây re-render toàn layout (kèm trang đang mở) kể cả khi dữ liệu không đổi; nay so sánh JSON và chỉ setState khi khác. SignalR push thời gian thực và nút đánh dấu đọc giữ nguyên.
- Responsive còn sót: `TableToolbar` (dùng chung nhiều trang Admin/HR) và `RecruiterPerformancePage` đổi ô search cứng 320px sang `100%/maxWidth`; panel popover `AppHeader` và `PublicLayout` thêm `maxWidth: calc(100vw - 24px)`; `NotificationPopover` kiểm tra thấy đã có sẵn maxWidth nên giữ nguyên.
- API/database/config: không thay đổi.
- Kiểm thử thực tế: `npm run build` (tsc -b + vite) đạt 0 lỗi sau khi áp toàn bộ thay đổi; xác minh các file sửa vẫn còn nguyên trong worktree trước khi ghi log.
- Git/VPS: giữ nguyên worktree bẩn của các phiên khác (480 CV synthetic, tài liệu Python); chưa commit/push; chưa deploy VPS.
- Hạn chế/bước tiếp theo: bộ lọc client-side phù hợp quy mô hiện tại, dữ liệu lớn cần chuyển server-side kèm phân trang API; hiệu năng search cảm nhận cần người dùng xác nhận lại sau bản vá poll 30s; nghiệm thu trên trình duyệt theo checklist đã gửi (tin tuyển dụng, chiến dịch, chuông thông báo, mobile).

### 2026-08-24 21:11 +07:00 — E2E-MATRIX-FLOW-GUIDE-08 — Hoàn tất 480 CV qua UI và lập bản đồ source Python

- Trạng thái: `ĐÃ XONG` local cho mục tiêu tạo đủ application và tài liệu hóa flow source; P3-02 tổng thể vẫn `ĐANG LÀM` vì còn audit kết quả AI trên tập đại diện và các kịch bản HR/Admin; chưa commit/push/deploy VPS.
- Mục tiêu/phạm vi: chạy nối ma trận dữ liệu từ checkpoint không tạo trùng, xác nhận đủ 20 CV cho 24 job, và tạo tài liệu giúp đọc đúng luồng Python/C# thay vì lần theo hàng chục file rời rạc.
- Kết quả dữ liệu: `job-application-progress.json` lúc 21:11 xác nhận 480/480 hồ sơ, 24/24 job hoàn tất. Mỗi job dùng 20 profile bao phủ tiêu chí từ trái ngành/thiếu bằng chứng tới đầy đủ tám nhóm và 20 biến thể layout được xen kẽ; generator chặn nội dung dưới 900 từ và nhãn ground truth chỉ nằm trong manifest. Toàn bộ application được tạo qua đăng ký/đăng nhập/upload/nộp trên giao diện local, không chèn SQL/API/seeder.
- Độ tin cậy của checkpoint: lượt 8-worker trước kết thúc 787 bước đạt/18 bước lỗi qua các retry và còn một profile Business Analyst. Lượt nối dùng batch tag mới, một worker và checkpoint cũ; report cuối ghi 8 bước đạt/1 attempt lỗi, nhưng lần thử tiếp theo nộp thành công nên checkpoint đạt 480 và job được đánh dấu complete. Không xóa tài khoản/hồ sơ synthetic phát sinh.
- Tài liệu kiến trúc: thêm `Python/SOURCE_FLOW_GUIDE.md` gồm thứ tự đọc file, sơ đồ nộp CV end-to-end, parser PDF/DOCX/ảnh, scoring/criteria/timeline/evidence/red flag, taxonomy/alias, scheduler startup + 02:00, nguồn domain CV, Apriori, Two-Phase HUIM, 9Router/Gemini/fallback, bản đồ debug và điểm đặt breakpoint. `Python/README.md` liên kết tới guide; `PROJECT_CONTEXT.md` cập nhật số liệu và backlog thực tế.
- Quyết định kỹ thuật được ghi rõ: C# lưu Application trước rồi chạy `AiEvaluationService` nền; `/validate-cv` cache extraction cho `/score-cv`; Apriori/HUIM chỉ bổ sung context, không làm bằng chứng hoặc điểm; dữ liệu synthetic chứng minh luồng/độ nhất quán chứ không chứng minh accuracy thị trường. Tài liệu cũng ghi nợ kỹ thuật `Task.Run` không phải durable queue, cache/model file chưa chia sẻ giữa nhiều replica.
- File thêm/sửa: `Python/SOURCE_FLOW_GUIDE.md`, `Python/README.md`, `PROJECT_CONTEXT.md`, `WORK_LOG.md`. Không sửa API runtime, schema hoặc migration trong mục này; database chỉ nhận dữ liệu synthetic qua UI theo phạm vi đã cho phép.
- Kiểm thử/đối chiếu: checkpoint 480/480 và 24/24 complete; `unittest tests.test_cv_analysis_extraction_gate tests.test_scoring_evidence` đạt 28/28 sau sửa language fallback; `git diff --check -- Python/README.md Python/SOURCE_FLOW_GUIDE.md` không có whitespace error (chỉ warning LF/CRLF); guide có 326 dòng, 18 heading và không có ký tự thay thế Unicode.
- Runtime/hạn chế: log Python cho thấy nhiều `/validate-cv` và `/score-cv` HTTP 200, đồng thời 9Router có các lần timeout/401/429 và chuyển fallback; vì vậy 480 application không đồng nghĩa 480 kết quả Gemini hoàn chỉnh. Domain public đang có HTTP 522 do Cloudflare không kết nối ổn định tới origin Pika; không quy lỗi này cho frontend/backend và chưa triển khai 9Router lên VPS cho tới khi hạ tầng ổn định.
- Git/VPS/bước tiếp theo: HEAD `7d1e2db`, branch `feature/feature-based-refactor-vps`, worktree bẩn được giữ nguyên; chưa deploy. Bước tiếp theo là audit read-only trạng thái AI/điểm/phân tầng/extraction trên mẫu đại diện của 24 job, chạy role flow HR/Admin còn thiếu, sau đó mới chuẩn bị triển khai VPS.

### 2026-08-24 20:43 +07:00 — AI-LANGUAGE-FALLBACK-07 — Không để phản hồi rỗng làm mất toàn bộ tab Ngôn từ

- Trạng thái: `ĐÃ XONG` local cho nhánh chuẩn hóa kết quả; chưa commit/push/deploy VPS. Batch Selenium bổ sung dữ liệu vẫn `ĐANG LÀM` theo checkpoint riêng.
- Mục tiêu/phạm vi: xử lý trường hợp provider trả object rỗng hoặc payload không đúng cấu trúc dù văn bản CV vẫn đủ an toàn để rà soát; không thay đổi nguyên tắc không xác minh lời khai thật/giả.
- Quyết định kỹ thuật: `normalize_language_review` không còn biến phản hồi `{}`/không phải object thành “không đủ dữ liệu”. Hệ thống chuyển sang bộ rà soát ngôn từ cục bộ có nhãn `analysis_mode=local`, `is_fallback=true`; chỉ trả `insufficient_data=true` khi chính chất lượng trích xuất hoặc độ dài văn bản không đủ. UI nhờ đó có nội dung phân tích một phần thay vì tab trống, đồng thời không trình bày fallback như kết quả Gemini.
- File sửa: `Python/services/scoring_service.py`, `WORK_LOG.md`.
- API/database/cấu hình: không đổi route, DTO bắt buộc, schema, migration hoặc credential. Payload hiện có được giữ tương thích.
- Kiểm thử thực tế: `python -m unittest tests.test_cv_analysis_extraction_gate tests.test_scoring_evidence` đạt 28/28. Log test xác nhận các nhánh extraction không an toàn, cảnh báo không đủ bằng chứng và truy hồi đoạn trích vẫn hoạt động.
- Git/VPS/hạn chế: giữ nguyên worktree bẩn; chưa deploy. Kết quả AI cũ đã lưu không tự thay đổi, cần dùng luồng “Hoàn tất phân tích AI” nếu muốn chạy lại snapshot CV cũ.

### 2026-08-24 20:21 +07:00 — AI-LANGUAGE-NOTIFICATION-06 — Khôi phục tab Ngôn từ cho CV mới/cũ và chi tiết hóa thông báo

- Trạng thái: `ĐÃ XONG` code/unit/build/runtime local cho tab Ngôn từ và thông báo; batch dữ liệu Selenium kết thúc một lượt ở checkpoint 293 hồ sơ nhưng tổng ma trận vẫn `ĐANG LÀM`, chưa commit/push/deploy VPS.
- Mục tiêu/phạm vi: sửa việc Admin/HR chỉ thấy tiêu đề thông báo chung và tab Ngôn từ & Chân thực thường chỉ hiện trạng thái thiếu dữ liệu trên cả hồ sơ mới lẫn kết quả cũ; kiểm tra đúng contract frontend/backend/Python và giữ nguyên ranh giới không xác minh lời khai.
- Nguyên nhân thông báo: API trả nội dung ở `content` nhưng popover dùng `message`, nên tên ứng viên/vị trí đã có trong dữ liệu không được render. Frontend nay đọc `content`, tương thích `message` cũ, wrap nội dung, có loading/empty state, thời gian và liên kết chi tiết. Thông báo mới nêu tên ứng viên, vị trí, đợt tuyển; thông báo tin chờ duyệt/đã duyệt/từ chối nêu HR, vị trí, vòng tuyển, hạn hoặc lý do và mở đúng trang chi tiết.
- Nguyên nhân tab Ngôn từ: orchestration cũ coi bất kỳ warning chứa “mất dấu/mã hóa/nhận dạng sai” là lý do bỏ toàn bộ language review dù parser vẫn trả `analysis_safe=true`. Luồng mới chỉ dừng khi `analysis_safe=false` hoặc chất lượng `low/insufficient`; trường hợp `partial`/có giới hạn vẫn phân tích phần văn bản đọc được và trả `analysis_scope=extracted_text_with_quality_limitations` cùng chú thích không quy lỗi OCR cho ứng viên. Khi provider lỗi nhưng text đủ dài, rà soát quy tắc cục bộ vẫn trả dữ liệu `is_fallback=true` và được xem là phân tích một phần.
- Tương thích dữ liệu cũ: không ghi đè kết quả AI đã lưu và không đổi snapshot CV. Hồ sơ cũ thiếu language review tiếp tục được nhận diện là chưa hoàn chỉnh; ứng viên dùng “Hoàn tất phân tích AI” để chạy lại trên tệp/snapshot đã nộp, không nộp lại CV. Hồ sơ mới dùng logic mới ngay sau khi Python reload; cache tiến trình được làm mới bởi Uvicorn reload.
- File sửa chính: `Python/main.py`, `Python/services/cv_analysis_service.py`, `Python/tests/test_cv_analysis_extraction_gate.py`, `Python/README.md`, `LanguageReviewTab.tsx`, `NotificationPopover.tsx`, `ApplicationService.cs`, `JobService.cs`, `NotificationService.cs`, `PROJECT_CONTEXT.md`, `WORK_LOG.md`.
- API/database/cấu hình: không đổi route, DTO bắt buộc, schema hoặc migration. Payload language review mở rộng tương thích bằng hai field tùy chọn `analysis_scope` và `source_quality_notice`. Thời gian thông báo mới dùng giờ Việt Nam qua service dùng chung. Không lưu provider name/credential ở UI hoặc tài liệu.
- Kiểm thử thực tế: `unittest tests.test_cv_analysis_extraction_gate tests.test_scoring_evidence` đạt 28/28, gồm case extraction an toàn có warning vẫn chạy review và extraction không an toàn vẫn bị chặn; frontend `npm.cmd run build` đạt, chỉ còn warning chunk lớn/SignalR dependency có sẵn. Backend build trước thay đổi UI cuối đạt 0 lỗi, 451 warning legacy. Kiểm tra 9Router local trước đó trả `/v1/models` HTTP 200 và `/analyze-cv-language` trả `status=success`, `analysis_mode=gemini`; phép thử runtime trong lúc batch quá tải vẫn trả `status=success`, điểm 68, 5 động từ, 2 cụm cần sửa, `analysis_mode=local`, `is_fallback=true`, `insufficient_data=false`. Điều này xác nhận tab vẫn có dữ liệu khi provider lỗi, nhưng không giả là AI chuyên sâu.
- Lỗi phụ phát hiện trong smoke: gửi sai `Content-Type` từng làm handler validation cố serialize raw bytes và trả 500, đồng thời log cả payload. Handler nay chỉ log endpoint/số lỗi và trả HTTP 400 với `type/location/message` đã làm sạch; test trực tiếp handler trả đúng 400 và không chứa input CV. Runtime đang chạy chưa reload phần `main.py`, nên cần restart Python sau khi batch Selenium kết thúc để áp dụng fix này cùng language gate.
- Dữ liệu E2E: lượt 8 worker kết thúc với 447 bước đạt/8 lỗi và checkpoint 293 hồ sơ trên 19 job đã bắt đầu, 11 job đủ 20/20. Các lỗi gồm stale element/timeout lúc upload và một lượt đăng ký chưa có phản hồi; checkpoint không ghi hồ sơ lỗi nên có thể chạy nối mà không nộp trùng. Đây là dữ liệu synthetic phục vụ kiểm thử, không phải bằng chứng accuracy thị trường.
- Git/VPS/hạn chế: giữ nguyên worktree bẩn và runtime JSON của các task trước; chưa commit/push/deploy. Kết quả cũ chỉ thay đổi sau khi người dùng chủ động chạy lại; không tự gọi hàng loạt LLM khi mở trang. Một CV thật sự `analysis_safe=false` vẫn không được đánh giá ngôn từ vì ưu tiên chống suy diễn từ bản đọc sai.

### 2026-08-24 18:56 +07:00 — E2E-BULK05-RUNTIME-ACCOUNT — Chạy batch CV mới bằng tài khoản ứng viên tạo tạm

- Trạng thái: `ĐANG LÀM` local; Selenium đang chạy nối qua UI với 3 worker. Năm job đã đủ 20/20; Flutter, Full-stack và Frontend React đang được bổ sung tiếp từ checkpoint.
- Mục tiêu/phạm vi: bổ sung dữ liệu CV chi tiết cho nhiều job mà không cần biết lại mật khẩu tài khoản cũ; không tạo trùng hồ sơ đã có trong checkpoint.
- Quyết định kỹ thuật/bảo mật: khi bật `E2E_AUTO_GENERATE_CANDIDATE_PASSWORD=true`, tool sinh mật khẩu ngẫu nhiên chỉ trong RAM cho một batch mới; không ghi mật khẩu vào file, log, database seed hay tài liệu. Không dùng lại tài khoản cũ vì credential cũ không được lưu lại an toàn.
- Lệnh kiểm thử: `python -m tools.selenium_e2e.run seed-job-applications --env-file .\tools\selenium_e2e\.env` với batch tag `bulk05`, 3 worker, pause 0 và batch size 24; test config Selenium đạt 4/4 trước khi chạy. Checkpoint hiện ghi 5 job hoàn tất và các job kế tiếp đang tăng dần.
- File đã sửa: `tools/selenium_e2e/config.py`, `tools/selenium_e2e/.env.example`, `tools/selenium_e2e/tests/test_config_and_fixtures.py`.
- API/database: không đổi schema hoặc migration; dữ liệu được ghi qua đăng ký/nộp CV trên giao diện thật, backend C# và Python đang chạy, không restart trong lúc batch.
- Ghi nhận phản biện và thay đổi đã triển khai: API/prompt tách cảnh báo có bằng chứng (`red_flags`) khỏi `red_flag_suspicions` chưa đối chiếu; tab Năng lực và PDF hiển thị cả hai nhóm, nhưng nhóm chưa đối chiếu không có đoạn trích, không dùng tính điểm và không kết luận gian dối. Tab Ngôn từ giữ riêng `unverified_language_observations`; trạng thái thiếu dữ liệu có `insufficient_reason` để phân biệt OCR, AI lỗi và nội dung quá ít.
- Kiểm thử thay đổi phản biện: 4/4 test mới đạt; nhóm extraction/fallback đạt 8/8; `py_compile` ba file Python đạt; frontend production build đạt. Toàn file scoring đạt 22/23, còn một lỗi môi trường cũ do Windows không khởi tạo `torch/lib/c10.dll` trong test alias, không liên quan thay đổi này.
- Sự cố và phục hồi batch: Python tự reload sau khi sửa source làm ba lượt CV số 7 timeout; checkpoint giữ 6 hồ sơ/job. Batch `bulk06` được tạo với mật khẩu RAM mới và chạy nối từ checkpoint, không nộp lại hồ sơ 1–6.
- Git/VPS/hạn chế: worktree bẩn được giữ nguyên, chưa commit/push/deploy VPS. Nếu tiến trình bị dừng, mật khẩu RAM của batch này mất; phải tạo batch tag mới hoặc cấp credential runtime an toàn để chạy tiếp.


### 2026-08-24 18:31 +07:00 — E2E-ROUTER-REDFLAG-04 — Chạy 24 job, 40 CV và làm rõ red flag có bằng chứng

- Trạng thái: `ĐÃ XONG` local cho tích hợp 9Router, 24 tin tuyển dụng, hai batch CV đầu và sửa red flag; ma trận dữ liệu toàn bộ vẫn `ĐANG LÀM` vì mới hoàn tất 2/24 job (40 hồ sơ theo checkpoint), chưa commit/push/deploy VPS.
- Mục tiêu/phạm vi: tiếp tục bộ kiểm thử qua website, giảm phụ thuộc quota Gemini trực tiếp bằng 9Router local, sửa nhận diện alias kỹ năng, phân biệt lỗi AI/fallback, và xử lý hiểu nhầm rằng trạng thái không có red flag đồng nghĩa CV đã được xác minh là đúng.
- Quyết định red flag/timeline: hệ thống chỉ xác nhận đoạn trích có tồn tại trong CV, không xác nhận lời khai là thật và không kết luận ứng viên bịa. Cảnh báo LLM bị loại nếu không truy hồi được đoạn gần-nguyên-văn; thay số hoặc phủ định vẫn bị chặn. Bổ sung lớp quy tắc độc lập chỉ cho hai bất thường khách quan trong section kinh nghiệm: mốc kết thúc sau ngày phân tích và mốc bắt đầu sau mốc kết thúc. Quy tắc không chạy khi OCR ở mức `low/insufficient` hoặc `analysis_safe=false`; kết quả luôn là “cần xác minh”. Timeline giữ mốc khai báo để HR đối chiếu nhưng chặn các tháng sau ngày phân tích khỏi tổng kinh nghiệm; giai đoạn nằm hoàn toàn trong tương lai được ghi riêng và không tính điểm.
- UI/PDF: trạng thái rỗng red flag đổi từ màu thành công sang trung tính và từ “không phát hiện” thành “chưa ghi nhận red flag có bằng chứng trực tiếp”; kèm câu ngắn khẳng định đây không phải xác nhận lời khai đúng. PDF red flag nay in cả đoạn trích gốc và chú thích thông tin tự khai thay vì chỉ in nhận xét AI.
- Dữ liệu E2E: tạo và Admin duyệt đủ 24/24 tin IT qua Selenium. API read-only xác nhận toàn bộ 24 tin truy cập được và hạn tuyển nằm trong `23/09/2026–07/10/2026`; ngày `09/08/2026` người dùng nhìn thấy thuộc tin cũ, không phải dữ liệu vừa tạo. Hai job `Backend Developer` và `Backend Node.js Developer` hoàn tất 20 CV/job; batch Node kết thúc 78 bước đạt, 0 bước lỗi. Từ các batch kế tiếp, mỗi nhóm 20 CV có hai case red flag ground truth (`timeline_future_end`, `timeline_reversed`) và 18 case đối chứng; nhãn ground truth chỉ nằm trong manifest, không dùng ghi đè kết quả AI.
- AI/runtime: thêm provider OpenAI-compatible 9Router theo thứ tự 9Router → Gemini → fallback và mã nguyên nhân lỗi an toàn cho UI; API key chỉ được nhập ở runtime, không ghi vào source/env/log/tài liệu. Uvicorn local tự reload sau thay đổi. Một phép thử API thật trên PDF scan hai cột trả HTTP 200, extraction `high` 99,9, `analysis_safe=true`, deep analysis `success`, language review đầy đủ và ba red flag có bằng chứng; điều này xác nhận trạng thái rỗng ở CV Nguyễn Minh An là do hồ sơ đối chứng không có bất thường đủ căn cứ, không phải toàn bộ tab hỏng.
- File chính sửa/thêm: `Python/services/{gemini_service.py,scoring_service.py,cv_analysis_service.py,timeline_service.py}`, `Python/tests/{test_llm_router_service.py,test_local_analysis_fallbacks.py,test_scoring_evidence.py,test_timeline_service.py}`, `tools/selenium_e2e/{config.py,run.py,webapp.py,job_candidate_fixtures.py,README.md,.env.example,tests/test_config_and_fixtures.py}`, `CompetencyTab.tsx`, `PdfExportUtils.tsx`, `Python/README.md`, `PROJECT_CONTEXT.md`, `WORK_LOG.md`.
- API/database/migration/cấu hình: không đổi schema và không tạo migration. Database dùng chung nhận dữ liệu synthetic qua đúng UI; không chèn SQL/seeder. 9Router/Gemini được điều khiển bằng biến môi trường runtime; không lưu credential. Backend C# do người dùng chạy và không bị restart trong task.
- Kiểm thử thực tế: test red flag mục tiêu đạt 5/5; timeline đạt 13/13, gồm chặn một giai đoạn tương lai toàn phần và cắt mốc kết thúc tương lai về tháng phân tích; Selenium unit đạt 7/7; `py_compile` các file Python/tool liên quan đạt; frontend `npm.cmd run build` tạo `dist/index.html` mới và không có lỗi TypeScript (chỉ warning Rollup/SignalR có sẵn); `git diff --check` không có whitespace error, chỉ cảnh báo LF/CRLF. Chạy toàn `test_scoring_evidence` đạt 19 test và vướng 1 lỗi môi trường cũ khi Windows không khởi tạo được `torch/lib/c10.dll` trong test alias; năm test red flag chạy tách đều đạt.
- Git/VPS/hạn chế: worktree vốn rất bẩn được giữ nguyên, chưa commit và chưa deploy. Còn 22 job chưa nhận đủ 20 CV; muốn chạy tiếp cần nhập lại credential ứng viên theo cơ chế bí mật runtime. Không có red flag không chứng minh CV trung thực; muốn xác minh sự thật cần phỏng vấn, bài kiểm tra, người tham chiếu hoặc tài liệu bên ngoài có sự đồng ý của ứng viên.

### 2026-08-24 13:23 +07:00 — E2E-MATRIX-JOBS-03 — Ma trận 15 CV, sửa quota theo tài khoản và chuẩn bị 24 job qua Selenium

- Trạng thái: `ĐANG LÀM`; code/unit/build/doctor đạt, batch 15 CV đã vào database, nhưng chưa chạy lệnh tạo 24 job vì `.env` chưa có credential HR. Theo lựa chọn trước đó của người dùng, mặc định Selenium chỉ tạo Pending và người dùng tự duyệt trên Admin. Không dùng seeder, API trực tiếp hoặc SQL để tạo job.
- Mục tiêu/phạm vi: giải thích và khắc phục hiện tượng batch CV cùng đạt 100; tạo dữ liệu đủ phân tầng mạnh/một phần/trái ngành, nhiều bố cục tài liệu; kiểm chứng timeline không thưởng số lượng công việc chồng lắp; phân biệt red flag không phát hiện với AI chuyên sâu không khả dụng; chuẩn bị thêm tin tuyển dụng chi tiết qua đúng luồng HR tạo → Admin duyệt.
- Phát hiện dữ liệu live: batch Backend cũ toàn 100 vì fixture chỉ chọn `strong_same_role`. Batch ma trận mới tạo đủ 15 application và phân tầng 5×49, 5×11, 5×0. Audit tiêu chí cho thấy job `Backend Developer` mục tiêu có đúng năm tiêu chí nhưng cả năm đều là `CUSTOM` chung chung, không có `SKILL`/`TOTAL_EXPERIENCE`; vì vậy 49/11/0 chỉ chứng minh có phân tầng, chưa phải mốc chất lượng scorer. Job DevOps đang tuyển là ứng viên benchmark tốt hơn vì có 5 tiêu chí kỹ năng, 1 kinh nghiệm và tổng trọng số 100.
- Sự cố E2E và sửa backend: lượt đầu dừng ở ứng viên thứ ba vì frontend nhận nhiều HTTP 429 từ backend. Global rate limiter trước đó chia mọi request theo IP và chạy trước authentication; sửa `Program.cs` để `UseAuthentication()` chạy trước limiter, tài khoản đã đăng nhập chia quota theo `AccountID`, ẩn danh mới chia theo IP. Backend build custom output đạt 0 lỗi, còn 451 warning có sẵn. Sau người dùng restart backend, browser log không còn 429; SQL xác nhận đủ 15/15 application dù UI lượt đó timeout chờ toast ở PDF thứ 15.
- Dữ liệu CV: `fixtures.py` chọn đúng ma trận `3 match scenario × 5 evidence case`, mỗi cặp chỉ xuất hiện một lần; 15 layout không trùng được xen kẽ từ đầu, gồm 9 DOCX và 6 PDF text/scan rõ, hai cột, nhiễu hoặc nghiêng. Timeout upload mặc định tăng từ 45 lên 180 giây riêng cho OCR scan. Test timeline bổ sung xác nhận một công việc Backend 12 tháng và 100 công việc Backend cùng chồng đúng 12 tháng đều chỉ cho 12 tháng tổng/theo kỹ năng; trường hợp 100 job có cờ overlap.
- Red flag/UI: Python thêm `deep_analysis_status` và `red_flag_review_status`; frontend đổi nhãn thành “Red flag cần xác minh”. Trạng thái rỗng nay tách “không phát hiện red flag có đủ đoạn trích” khỏi “chưa thể hoàn tất vì AI chuyên sâu không khả dụng”; PDF export dùng cùng nhãn. Cần restart Python AI và phân tích hồ sơ mới để nhận trường trạng thái mới.
- Tạo job qua website: thêm `job_fixtures.py` với 24 vị trí IT không trùng, 7 chi nhánh, 4 cấp bậc và cả nhóm ngành con AI/Cybersecurity/Cloud-IoT. Mỗi mô tả tối thiểu 900 ký tự, yêu cầu tối thiểu 700 ký tự, không có marker test trên nội dung; mỗi job có 4 kỹ năng + tổng kinh nghiệm + dự án + giải quyết vấn đề + phối hợp, tám tiêu chí tổng 100. Lệnh `create-jobs` đăng nhập HR, điền form Ant Design, tạo tin, rồi tùy chọn đăng nhập Admin duyệt; `job-progress.json` theo `E2E_RUN_ID` giúp chạy tiếp sau gián đoạn mà không tạo trùng. `TestJobPostingSeeder.cs` đã được hoàn nguyên và `git diff --exit-code` xác nhận không đổi.
- File thêm/sửa: `tools/selenium_e2e/{job_fixtures.py,config.py,fixtures.py,webapp.py,run.py,requirements.txt,.env.example,README.md,tests/test_config_and_fixtures.py}`; `Python/tests/test_timeline_service.py`; `Python/services/cv_analysis_service.py`; `RecruitmentBackend/RecruitmentBackend/Program.cs`; `CompetencyTab.tsx`; `PdfExportUtils.tsx`; `PROJECT_CONTEXT.md`; `WORK_LOG.md`. `.env` local và ChromeDriver nằm trong `.local`/Git ignore, không chứa credential trong source hoặc nhật ký.
- API/database/migration/config: không đổi API contract hoặc schema, không có migration. Batch Selenium đã ghi 15 application synthetic vào database dùng chung trước mục này; lệnh `create-jobs` chưa ghi job nào. Lượt thử chạy seeder bị dừng, đường dẫn DLL không hợp lệ và cổng 5299 không có tiến trình; public API vẫn báo 19 tin đang tuyển, nên không có dữ liệu seeder mới.
- Kiểm thử thực tế: offline benchmark chạy lại đạt với 1.170 CV/162 JD/3.510 cặp; nhóm scoring/timeline đạt 24/24 khi preload `torch`; timeline riêng đạt 10/10; frontend production build đạt; backend build đạt 0 lỗi; Selenium fixture/config đạt 4/4; `py_compile` đạt; local browser doctor cuối đạt 5/5 với Chrome 151. Đối chiếu read-only với metadata backend xác nhận 24/24 vị trí tồn tại, đúng ngành, toàn bộ category path/level path/branch có thật (`missing=0`, `mismatch=0`, `metadata_errors=0`). ChromeDriver 151.0.7922.137 cần thêm `--disable-gpu --no-sandbox --disable-dev-shm-usage` để tránh tab crash. Performance log chỉ có stylesheet ngoài bị `ERR_NETWORK_ACCESS_DENIED`, không ảnh hưởng năm bước doctor.
- Git/VPS: HEAD `7d1e2db`, worktree bẩn được bảo toàn, chưa commit/push/deploy. Không thay đổi credential, DNS, firewall hoặc dữ liệu ngoài phạm vi.
- Hạn chế/bước tiếp theo: người dùng chỉ cần điền `E2E_HR_EMAIL` và `E2E_HR_PASSWORD` vào `tools/selenium_e2e/.env` bị ignore; chạy smoke một job qua UI, kiểm tra chính xác 8 tiêu chí và trạng thái Pending, sau đó chạy đủ 24 job để người dùng tự duyệt trên Admin. Tiếp theo dùng job DevOps cấu trúc chuẩn chạy ma trận 15 CV và đối chiếu strong > partial > cross-domain trước khi nhân rộng nhiều job.

### 2026-08-24 11:48 +07:00 — E2E-SELENIUM-02 — Sửa automation và nộp đủ 15 CV qua website

- Trạng thái: `ĐÃ XONG` cho tool + luồng ứng viên nộp 15 CV; P3-02 tổng thể vẫn `ĐANG LÀM` vì chưa chạy HR/Admin theo role và chưa chờ kết quả AI hoàn tất.
- Mục tiêu/phạm vi: tái hiện lỗi bằng source local, sửa đúng automation thay vì sửa frontend không có lỗi, chạy một smoke local, một smoke public rồi nộp đủ 15 CV chi tiết vào cùng job `Backend Developer` qua HTTPS. Không gọi API/SQL để tạo dữ liệu.
- Đính chính mục `E2E-SELENIUM-01`: kết luận “frontend public không mở modal” là sai. Ba nguyên nhân thuộc tool: URL wait `"/jobs/"` khớp nhầm trang danh sách có slash cuối nên bấm nút điều hướng của card; Ant Design 6 dùng `.ant-modal-container` thay `.ant-modal-content`; selector primary trong modal chọn nhầm nút `Chọn file` thay vì `Nộp hồ sơ`. Ảnh local cho thấy AI modal đã mở trong lúc selector cũ vẫn báo không có modal.
- Thay đổi: `webapp.py` chờ route có đúng hai segment `jobs/<id>` và tiêu đề chi tiết; modal selector tương thích AntD 5/6; input file được tìm theo active modal dù bị ẩn; submit chọn theo nhãn `Nộp hồ sơ`; bỏ click CDP/React diagnostic không còn cần. `.gitignore` tiếp tục loại metadata Selenium Manager.
- Dữ liệu ghi: vì backend Development dùng database production chung theo quyết định dự án, tổng các lượt chẩn đoán/local/public trong hai mục đã tạo 30 tài khoản ứng viên synthetic; 17 tài khoản có application (1 local smoke + 1 public smoke + 15 public batch), 13 tài khoản chẩn đoán không có application. Không tự xóa vì đây là thao tác phá hủy ngoài phạm vi và người dùng đã yêu cầu bổ sung dữ liệu test. Tên hiển thị hư cấu, email thuộc domain test; credential không được lưu vào code/log/tài liệu.
- Kiểm thử thực tế: local `doctor` 5/5; local corrected smoke 6/6; public corrected smoke 6/6; public batch `public-backend-15cv-20260824` đạt 62/62 gồm sinh fixture + khởi động browser + 15×(đăng ký, đăng nhập, nộp CV, ghi trạng thái AI). Manifest xác nhận 15 CV/8 layout; report xác nhận `registered=15`, `submitted=15`; performance log có 0 HTTP failure, browser log có 0 SEVERE. AI status của 15 hồ sơ là `skipped` có chủ đích vì `E2E_WAIT_AI_SECONDS=0`, không được trình bày là Gemini đã phân tích xong.
- Kiểm thử mã tool: `py_compile` đạt; `unittest tools.selenium_e2e.tests.test_config_and_fixtures -v` đạt 2/2; `git diff --check` không có whitespace error, chỉ cảnh báo line ending LF/CRLF của workspace.
- Frontend/backend/AI/database: không sửa frontend/backend/AI, không migration, không deploy. Backend do người dùng chạy; frontend Vite và Python AI chỉ được mở để smoke local. Job public nhận hồ sơ bình thường.
- Git/VPS: HEAD vẫn `7d1e2db`, worktree bẩn được bảo toàn, chưa commit/push. HTTPS public được kiểm chứng từ trình duyệt nhưng chưa đối chiếu commit/container VPS nên không ghi “đã deploy”.
- Hạn chế/bước tiếp theo: cần người dùng đặt credential HR/Admin vào env local để chạy `candidate-search`, `repost`, `dashboard`; cần theo dõi/đọc kết quả AI của batch nếu muốn chứng minh end-to-end Gemini, và test tải/p95 riêng trước khi kết luận hiệu năng.

### 2026-08-24 11:24 +07:00 — E2E-SELENIUM-01 — Tạo bộ Selenium web và smoke public

- Trạng thái: `ĐANG LÀM`; tool và dữ liệu fixture local đã đạt, public doctor đạt, nhưng luồng nộp CV trên public đang lỗi trước modal nên chưa chạy đủ 15 hồ sơ/role.
- Mục tiêu/phạm vi: bổ sung bằng chứng test qua trình duyệt thật thay vì chèn database/API; bao phủ trang công khai, đăng ký/đăng nhập ứng viên, upload/nộp CV, quyền discovery, HR tìm và lưu Talent Pool, đăng lại tin, Admin duyệt và dashboard trong ngày. Không thay đổi API, backend, AI hoặc schema.
- Quyết định kỹ thuật/nghiệp vụ: tạo package độc lập `tools/selenium_e2e`; cấu hình và credential chỉ đọc từ env không commit; mặc định cấm ghi, URL không phải localhost phải bật thêm cờ xác nhận từ xa. Report luôn ghi `synthetic_web_e2e`, còn nhãn case/ground truth không được chèn vào text CV để tránh rò đáp án cho AI. Một lỗi dừng đúng kịch bản và lưu screenshot/browser log/network failure.
- Dữ liệu: tái sử dụng benchmark chi tiết nhưng thay thông tin liên hệ bằng danh tính hư cấu; sinh 15 DOCX cho cùng job Backend Junior, mỗi CV trên 900 từ sau chuẩn hóa, tám layout luân phiên (một cột, tiêu đề màu, bảng thông tin, hai cột bảng, bảng kỹ năng, bảng timeline, hai cột Word, trang đầu ngang). Lượt verify tạo đủ 15 tệp, kích thước 40.508–40.813 byte; manifest nằm trong `.local/selenium-e2e/local-fixture-verify`.
- File thêm: `tools/selenium_e2e/{config.py,artifacts.py,fixtures.py,webapp.py,run.py,requirements.txt,.env.example,README.md,__init__.py,tests/test_config_and_fixtures.py}`. File sửa: `.gitignore`, `PROJECT_CONTEXT.md`, `WORK_LOG.md`. Selenium Manager metadata phát sinh đã xóa và thêm ignore.
- API/database/migration/config: không đổi contract hoặc schema. Public test đã tạo chín tài khoản ứng viên synthetic trong quá trình chẩn đoán; chưa tài khoản nào nộp được CV nên không có application/AI result mới từ tool. Không ghi credential/tài khoản cụ thể vào nhật ký.
- Kiểm thử thực tế: `py_compile` đạt; `unittest tools.selenium_e2e.tests.test_config_and_fixtures -v` đạt 2/2; command `fixtures` đạt 1/1 và sinh 15 CV; `doctor` trên `https://recruitinsightai.com` đạt 5/5, đọc 12 job card trang đầu và xác nhận `Backend Developer` đang có nút ứng tuyển. Chrome 151 + Selenium 4.47/ChromeDriver khởi động thành công. `pip check` còn xung đột có sẵn `typer-slim 0.24.0` yêu cầu `typer>=0.24.0` nhưng môi trường có `typer 0.9.4`; Selenium không tạo xung đột này.
- Lỗi public có bằng chứng: chín smoke đều đăng ký/đăng nhập đạt; các lần đầu giúp sửa lỗi selector input file ẩn và React stale trong chính tool. Sau khi dùng click DOM nguyên tử và sự kiện chuột cấp Chrome, trang job `Backend Developer` vẫn không mở modal; chẩn đoán cuối ghi `token=True`, `modal=0`, `disabled=False`, `ai-probe=not-opened`. Vì cả direct apply và AI button không phát handler, dừng seed hàng loạt để tránh thêm tài khoản rỗng.
- Git/VPS: HEAD local vẫn `7d1e2db`, branch `feature/feature-based-refactor-vps`; worktree vốn bẩn được giữ nguyên, chưa commit/push/deploy. Domain public hiện truy cập được, khác trạng thái tunnel cũ trong log; chưa xác nhận container/source VPS đã cập nhật theo local.
- Hạn chế/bước tiếp theo: xác minh nút bằng thao tác tay trên public hoặc deploy lại frontend local hiện tại, chạy lại `seed-applications` với 1 CV; chỉ khi đạt mới chạy 15. Cần tài khoản test HR/Admin qua env để chạy `candidate-search`, `repost`, `dashboard`; không yêu cầu gửi credential trong chat hoặc commit.

### 2026-08-23 01:25 +07:00 — FE-MOBILE-FIX-3 — Sửa card tô đặc màu trạng thái và nút tràn ngang trên my-applications

- Trạng thái: `ĐÃ XONG` local (build đạt); chỉ frontend, chưa commit/push.
- Mục tiêu/phạm vi: xử lý lỗi thực tế người dùng chụp màn hình tại `/my-applications` trên điện thoại: toàn bộ card ứng tuyển bị tô đặc xanh lá/red/blue và hàng nút hành động tràn ra ngoài mép phải.
- Nguyên nhân gốc: media query <768px của trang dùng selector `.app-card > div { width: 100% !important }`, vô tình ghi đè cả dải màu trạng thái tuyệt đối rộng 5px là con trực tiếp đầu tiên của card, khiến nó phủ kín toàn bộ nền card theo màu trạng thái (success=#10B981, error=đỏ, processing=xanh brand). Hàng nút `app-card-actions` không wrap nên nút "Rút hồ sơ" (danger) tràn khung.
- Thay đổi: loại dải màu khỏi selector bằng class mới `app-card-strip` kết hợp `:not()`; đổi căn hành động mobile từ `space-between` sang `flex-start` kèm `flex-wrap: wrap` và gap 12px để các nút (Xem AI đánh giá / Hoàn tất phân tích / Rút hồ sơ) xuống dòng gọn gàng.
- File sửa: `ApplicationStatusPage.tsx` (khối customStyles và dải brand strip).
- API/database/config: không thay đổi.
- Kiểm thử thực tế: `npm run build` (tsc -b + vite) đạt 0 lỗi.
- Git/VPS: chưa commit/push; chưa deploy VPS.
- Hạn chế/bước tiếp theo: cần người dùng tải lại trang trên điện thoại để nghiệm thu; nếu còn trang vỡ khác, gửi screenshot kèm route để khoanh vùng tiếp.

### 2026-08-23 00:55 +07:00 — FE-MOBILE-FIX-2 — Sửa vỡ giao diện nhóm Đăng nhập/Đăng ký và Tạo CV trên điện thoại

- Trạng thái: `ĐÃ XONG` local (build + typecheck đạt); chỉ frontend, chưa commit/push.
- Mục tiêu/phạm vi: xử lý tiếp các trang người dùng báo lỗi trên thiết bị di động sau phiên `FE-MOBILE-FIX`: Đăng nhập/Đăng ký/Quên mật khẩu, Tạo CV trực tuyến, và quét lại toàn bộ bố cục nhiều cột cố định.
- Nguyên nhân gốc: `AuthLayout` dùng grid `1.1fr 0.9fr` không có media query khiến hai panel bị bóp còn ~180px mỗi bên trên màn hình nhỏ; đây là lớp dùng chung của cả ba trang auth.
- Thay đổi chính: `AuthLayout` thêm class `auth-shell/auth-left-panel/auth-right-panel/auth-back-wrap` với media query <992px chuyển một cột, ẩn panel marketing tối màu, giảm padding; `CvBuilderPage` đặt zoom mặc định 55% khi màn hình <768px và nới Slider zoom tối thiểu từ 70 xuống 50 để xem trước khổ A4 vừa màn hình; ba lưới thông tin cố định đổi sang `repeat(auto-fit, minmax(220–260px, 1fr))`: `ApplicationStatusPage`, `CandidateDetailPage`, section Năng lực/Cảnh báo của `HomePage`.
- Đã xác minh và chủ động KHÔNG sửa (tránh thừa): AntD v5 Modal tự áp `max-width: calc(100vw - 16px)` dưới 576px nên mọi modal an toàn kể cả width 520+; Drawer có `maxWidth: 100vw`; form Đăng ký/Đăng nhập vốn đã một cột.
- API/database/config: không thay đổi.
- Kiểm thử thực tế: `npm run build` (tsc -b + vite) đạt 0 lỗi.
- Git/VPS: giữ nguyên worktree bẩn; chưa commit/push; chưa deploy VPS.
- Hạn chế/bước tiếp theo: preview CV thu nhỏ bằng transform nên khi zoom <100% còn khoảng trống phía dưới (cosmetic); cần nghiệm thu trên máy thật ở `/login`, `/register`, `/candidate/cv-builder`, `/my-applications`, `/recruiter/candidates/:id`.

### 2026-08-23 00:20 +07:00 — FE-MOBILE-FIX — Chống vỡ giao diện trên điện thoại cho toàn bộ portal

- Trạng thái: `ĐÃ XONG` local (build + typecheck đạt); chỉ frontend, chưa commit/push, không đụng backend/Python/API/database.
- Mục tiêu/phạm vi: kiểm tra responsive toàn bộ route và xử lý nhóm lỗi gây vỡ layout trên thiết bị di động; không đổi nghiệp vụ, payload hay quyền.
- Khảo sát: viewport meta có sẵn; MainLayout đã ẩn sider <992px kèm hamburger; PublicLayout có Drawer menu; chatbot đã có maxWidth clamp nên không tràn màn hình; Kanban chiến dịch dùng được trên mobile nhờ cuộn ngang và Select đổi trạng thái; trang So sánh ứng viên là thiết kế cuộn ngang chủ đích nên giữ nguyên. Không tìm thấy hook breakpoint nào trước đó.
- Thay đổi chính: tạo `src/hooks/useResponsive.ts` (Grid.useBreakpoint) làm hook dùng chung; thêm `scroll={{ x: "max-content" }}` cho 27 bảng AntD thiếu scroll tại 18 file (Admin/HR/Ứng viên, gồm cả bảng trong drawer/modal/dashboard); Modal "AI đang phân tích hồ sơ" đổi width 560 cứng thành `92vw` dưới 640px; MainLayout thêm media query thu margin Content xuống 12px/16px dưới 768px và thu gọn ô tìm kiếm Admin thành icon dưới 640px.
- Sự cố xử lý trong phiên: script chèn tự động lần đầu đâm vào 6 chỗ member expression `Table.Summary.Row/Cell` ở `AdminJobDetailPage` và `JobDetailModal`; đã khôi phục đúng cú pháp và build lại đạt. Hai file dùng generic `<Table<T>` (CVRankingPage, CandidateAiDrawer) được sửa tay.
- API/database/config: không thay đổi.
- Kiểm thử thực tế: quét lại toàn src còn 0 bảng thiếu scroll; `npm run build` (tsc -b + vite) đạt 0 lỗi, warning chunk lớn như cũ.
- Git/VPS: giữ nguyên worktree bẩn của người dùng; chưa commit/push; chưa deploy VPS.
- Hạn chế/bước tiếp theo: chưa test trên máy thật, cần người dùng mở trình duyệt mobile/emulator theo danh sách trang đã ghi để nghiệm thu; các điểm còn lại (CvBuilder xem trước A4 trên mobile, tối ưu sâu từng trang) chưa làm trong phiên này.

### 2026-08-22 23:16 +07:00 — FE-STYLE-SYNC — Thống nhất khuôn mẫu UI theo style guide dự án

- Trạng thái: `ĐÃ XONG` local (build + typecheck đạt); chưa commit/push, không liên quan backend/Python/API/database.
- Mục tiêu/phạm vi: chỉ frontend `ai-recruitment-frontend`; loại màu mặc định AntD cũ và bán kính lệch token, gộp component thẻ số liệu, chuẩn hóa header hai trang candidate. Không đổi luồng nghiệp vụ, payload, route hay quyền.
- Quyết định kỹ thuật: ánh xạ màu `#1677ff→#2563EB`, `#52c41a→#10B981`, `#faad14→#F59E0B`, `#fa8c16/#722ed1→#F97316` (accent AI theo `theme.ts`), `#13c2c2→#0EA5E9`, `#f5222d/#ff4d4f→#EF4444`, nền nhạt `#e6f4ff→#EFF6FF`, `#f6ffed→#ECFDF5`, gradient đầu mút đổi thành tint rgba cùng hue; borderRadius quy về token {8,12,16,20} giữ 999 pill và 0 vuông. `StatCard` thêm accent `accent` và prop `trend` tương thích ngược; xóa `MetricCard`. Trang giữ pattern chủ đích: hero tìm kiếm (`CandidateJobPage`) và breadcrumb chi tiết (`CandidateJobDetailPage`).
- File sửa: 21 file màu (dashboard Admin/HR, chatbot ứng viên, email, taxonomy, hook biểu đồ), 42 file borderRadius, `StatCard.tsx`, `AdminDashboardPage.tsx`, `CvBuilderPage.tsx`, `CvAnalysisResultPage.tsx`; file xóa: `AdminDashboardPage/components/MetricCard.tsx`.
- Phát hiện code chết chưa xử lý (cần người dùng quyết): `BranchManagementPage`, `candidate-portal/pages/ProfilePage`, `UploadCVPage` — không còn route nào tham chiếu.
- API/database/config: không thay đổi.
- Kiểm thử thực tế: `npm run build` (tsc -b + vite) đạt 0 lỗi, chỉ còn warning chunk lớn/SignalR như trước; đếm lại toàn repo còn đúng bộ giá trị {0,8,12,16,20,999} cho radius và 0 match màu cũ.
- Git/VPS: giữ nguyên worktree bẩn sẵn có của người dùng; chưa commit/push; chưa deploy VPS.
- Hạn chế/bước tiếp theo: P5 dọn gradient/vùng tối HomePage/AuthLayout chưa làm vì cần duyệt thẩm mỹ; nên smoke test màn hình Admin Dashboard, HR Dashboard, Chatbot, Tạo CV và Kết quả phân tích trên trình duyệt.

### 2026-08-22 12:49 +07:00 — VPS-CLOUDFLARE-TUNNEL — Dựng đường ingress sau bảo trì nhà cung cấp

- Trạng thái: `ĐANG LÀM`; connector Cloudflare Tunnel đã hoạt động, nhưng tên miền công khai chưa đi qua tunnel nên chưa thể nghiệm thu HTTPS.
- Mục tiêu/phạm vi: khôi phục đường truy cập công khai sau khi PikaMC bảo trì và kết nối inbound 80/443 không còn tới NIC của VPS; không thay đổi ứng dụng, dữ liệu hoặc credential hiện có.
- Quyết định hạ tầng: dùng named Cloudflare Tunnel chạy nền trên VPS thay cho việc phụ thuộc inbound 80/443. Origin của tunnel là Nginx HTTPS loopback và vẫn xác minh chứng chỉ theo `recruitinsightai.com`; không dùng quick tunnel, domain tạm hoặc `noTLSVerify`.
- Thay đổi VPS: cài gói `cloudflared` chính thức phiên bản 2026.8.2; người dùng tự đăng nhập và Authorize zone; tạo tunnel `recruitinsightai`; cài systemd service tự khởi động. Certificate và tunnel credential chỉ nằm tại `/home/ubuntu/.cloudflared` với quyền 600/400, không được đọc ra log, chép vào Git hoặc tài liệu.
- Kiểm thử thực tế: cấu hình ingress validate `OK`; systemd trả `active`; tunnel có một connector kết nối đồng thời tới bốn Cloudflare edge Singapore. Origin `https://127.0.0.1:443/health` theo SNI tên miền trả `200 healthy`; domain gốc sau bảo trì vẫn timeout/522 nên chưa thể coi public ingress đã đạt.
- DNS: lệnh tạo route `www.recruitinsightai.com` được Cloudflare API xác nhận nhưng nameserver có thẩm quyền `donald.ns.cloudflare.com`/`kia.ns.cloudflare.com` chưa công bố bản ghi. Ghi đè domain gốc bị Cloudflare từ chối mã 1003 vì bản ghi A còn tồn tại; chưa xóa hoặc sửa bản ghi A hiện hành.
- Chẩn đoán bổ sung: zone Cloudflare người dùng vừa Authorize được gán `iris.ns.cloudflare.com`/`ray.ns.cloudflare.com`, trong khi registrar vẫn công bố `donald.ns.cloudflare.com`/`kia.ns.cloudflare.com`. Đây là nguyên nhân thay đổi trong dashboard hiện tại chưa ra Internet. Truy vấn DS công khai rỗng nên chưa có DNSSEC registrar cần tháo trước khi chuyển nameserver.
- File ảnh hưởng: chỉ thêm cấu hình tạm `.local/cloudflared-config.yml` thuộc vùng Git ignore và cập nhật `WORK_LOG.md`, `PROJECT_CONTEXT.md`; không đổi frontend/backend/AI, API, database, migration hay Docker image.
- Git/VPS: giữ nguyên toàn bộ runtime JSON và dữ liệu kiểm thử chưa track của người dùng; local/Git source ở `7d1e2db`, runtime container vẫn là `4e57223`. Chưa commit/push mục tài liệu này và chưa tuyên bố deploy công khai.
- Hạn chế/bước tiếp theo: trong zone chờ `iris`/`ray`, xóa riêng bản ghi A gốc đang xung đột rồi tạo CNAME route tới tunnel; sau đó đổi nameserver tại registrar PikaMC từ `donald`/`kia` sang `iris`/`ray`. Chỉ khi Cloudflare báo zone Active mới kiểm tra DNS có thẩm quyền, `/health`, trang HTTPS và smoke API công khai.

### 2026-08-22 02:02 +07:00 — VPS-PUBLIC-INGRESS-DIAG — Khoanh vùng Cloudflare 522 ngoài VPS

- Trạng thái: `BỊ CHẶN` bởi quyền bảng điều khiển Cloudflare/VPS; không còn thay đổi code hoặc lệnh trong máy chủ có thể tự khôi phục đường truy cập công khai.
- Mục tiêu/phạm vi: phân biệt lỗi Nginx/Docker/firewall hệ điều hành với DNS origin hoặc security group/firewall ở lớp nhà cung cấp.
- Bằng chứng trong VPS: Nginx nghe `0.0.0.0:80/443`, gọi origin theo hostname/certificate trả 200, Docker NAT có rule chuyển 80/443, `iptables INPUT` là `ACCEPT`, UFW inactive. Trong lúc chủ động gọi domain và nhận Cloudflare 522, `tcpdump` trên `eth0` bắt được 0 SYN đích 80/443; bộ đếm rule NAT cũng không tăng.
- Bằng chứng ngoài VPS: năm node TCP độc lập tại Đức, Romania, Ukraine và Anh đều timeout cổng 443; kiểm tra bổ sung cổng 80 cũng timeout. Vì gói chưa tới NIC, sửa Nginx, container, UFW hoặc source code không giải quyết được.
- Quyền/cấu hình khả dụng: workspace, biến môi trường local và `.env` VPS không có Cloudflare API token/zone ID; VPS không cài `cloudflared` và không có agent firewall nhà cung cấp. Không thu thập hoặc ghi credential vào nhật ký.
- Quyết định an toàn: không tự dựng quick tunnel/domain tạm, không thay kiến trúc public ingress và không đoán bản ghi DNS khi chưa có quyền zone. Cần kiểm tra A/AAAA origin trong Cloudflare và security group/firewall panel của nhà cung cấp; mở inbound TCP 80/443 tới đúng VPS hoặc cấp quyền Cloudflare Tunnel có kiểm soát.
- Git/database/runtime: không sửa code, schema, dữ liệu hoặc container; VPS vẫn ở source commit `3e279a5`, runtime hotfix `4e57223`, ba container healthy và taxonomy 140 kỹ năng/58 alias đã tải.
- Bước tiếp theo: người dùng cung cấp quyền thao tác panel hoặc thực hiện thay đổi 80/443/origin; sau đó chạy lại health công khai và smoke test đăng nhập đọc-only. VPS hiện cũng không có các biến credential smoke Admin/HR/Ứng viên nên E2E role cần bộ tài khoản kiểm thử riêng.

### 2026-08-22 01:54 +07:00 — VPS-DEPLOY-VERIFY — Xác minh hotfix, migration và runtime VPS

- Trạng thái: `ĐÃ XONG` phần code, migration và runtime Docker tại origin; `BỊ CHẶN` riêng đường truy cập công khai do Cloudflare 522/lớp ingress ngoài máy chủ.
- Mục tiêu/phạm vi: triển khai hotfix hostname nội bộ, xác minh từ AI tới backend, kiểm tra TLS/Nginx/API/phân quyền ẩn danh và phân tách lỗi ứng dụng khỏi lỗi hạ tầng mạng.
- Git/VPS: commit `4e57223` đã push và VPS fast-forward đúng commit. Deploy lần hai hoàn tất bằng script có rollback; `ai-service`, `backend`, `frontend` đều `running/healthy`. Stash và patch dự phòng trước deploy vẫn được giữ, không xóa dữ liệu cũ.
- Database/AI nền: migration `20260822011500_AddSkillAliases` đã có trong `__EFMigrationsHistory`; không phát sinh migration mới ở hotfix. Từ AI container, `GET http://backend:8080/api/skills` trả 200 với 140 kỹ năng duyệt và 58 bí danh. Log xác nhận taxonomy đã reload; scheduler backend khởi động theo lịch startup/02:00.
- Smoke origin qua Nginx/TLS: `/health`, `/api/jobs/published?pageIndex=1&pageSize=1`, `/api/skills` đều 200. Ba API bảo vệ `/api/dashboard/admin-stats`, `/api/systemsettings`, `/api/jobs` trả 401 khi ẩn danh. VPS không cấu hình bộ biến credential smoke Admin/HR/Ứng viên nên chưa chạy E2E đăng nhập theo vai trò; không dùng credential thật hoặc ghi chúng vào log.
- HTTPS công khai: gọi trực tiếp origin bằng hostname/certificate trả 200; Nginx listen 80/443, host firewall INPUT accept và UFW inactive. Từ mạng ngoài không kết nối được 443, Cloudflare trả 522 và bộ đếm NAT Docker không nhận gói ngoài; bằng chứng nghiêng về Cloudflare origin mapping hoặc firewall/security rule của nhà cung cấp. Không tự ý sửa DNS/firewall vì cần quyền hạ tầng riêng.
- File ảnh hưởng: không thêm code sau hotfix; cập nhật `WORK_LOG.md` và `PROJECT_CONTEXT.md` để phản ánh trạng thái triển khai thực, không ghi “HTTPS đạt” khi mới chỉ đạt ở origin.
- Kiểm thử tổng hợp trước deploy: Python 75/75; benchmark nội dung 1.170 CV/162 JD/3.510 cặp đạt; corpus tài liệu 15 CV đa layout + 1 non-CV đạt 16/16 theo ngưỡng, exact dấu tên OCR 13/15; backend/frontend production build đạt. Đây là kiểm thử synthetic/fixture, không phải độ chính xác thị trường.
- Rollback: deploy script đã giữ image rollback; migration alias có `Down` về `20260821233000_AddJobRepostingLifecycle`; source VPS cũ còn trong stash/patch. Không cần rollback vì runtime mới healthy và smoke origin đạt.
- Bước tiếp theo: trên bảng điều khiển VPS/Cloudflare, kiểm tra bản ghi origin và cho phép inbound TCP 80/443 tới VPS; sau đó chạy `PROJECT_DIR=/home/ubuntu/KhoaLuan PUBLIC_URL=https://recruitinsightai.com bash deploy/vps/health-check.sh` và E2E đọc-only theo ba vai trò khi có biến credential riêng.

### 2026-08-22 01:48 +07:00 — VPS-DEPLOY-HOST-HOTFIX — Triển khai và sửa hostname đồng bộ taxonomy

- Trạng thái: `ĐANG LÀM`; bản `122d6fd` đã build/kích hoạt, ba container healthy và migration đã áp, nhưng chưa nghiệm thu xong do đồng bộ taxonomy nhận HTTP 400 và HTTPS công khai trả 522.
- Mục tiêu/phạm vi: triển khai bản đã kiểm thử lên VPS theo script có rollback, xác minh migration/scheduler/API/HTTPS và sửa lỗi cấu hình phát hiện trong smoke test.
- Git/VPS: đã push `122d6fd`, cất 11 file sửa dở trên VPS vào Git stash `predeploy-20260822`; patch dự phòng đã lưu riêng trước đó. VPS fast-forward từ `9a4a64f` lên `122d6fd`; script `deploy/vps/deploy.sh` build và activate thành công, không kích hoạt rollback.
- Database/runtime: EF đã áp `20260822011500_AddSkillAliases`; backend ghi nhận scheduler khởi động và Apriori/HUIM hoàn tất riêng cho 4 ngành. AI startup retry đúng lúc backend chưa sẵn sàng, sau đó nhận HTTP 400 vì `AllowedHosts` chưa chứa hostname dịch vụ Docker `backend`.
- Quyết định hotfix: chỉ thêm `backend` vào `AllowedHosts`, không dùng wildcard và không đổi route/quyền truy cập. File sửa: `RecruitmentBackend/RecruitmentBackend/appsettings.json` và nhật ký/ngữ cảnh dự án.
- Kiểm thử: backend Release build sau hotfix đạt 0 lỗi, còn 451 warning legacy. Trước hotfix, gọi `/api/skills` trong container trả `Bad Request - Invalid Hostname`, xác nhận đúng nguyên nhân; migration không lỗi và ba healthcheck nội bộ đều đạt.
- HTTPS: Nginx trong VPS trả 200 khi gọi trực tiếp bằng hostname/certificate; cổng 80/443 đang listen và UFW local không bật. Cloudflare trả 522 và kết nối 443 từ máy ngoài không tới được origin, nên nghiêng về NAT/security rule/DNS origin ngoài ứng dụng; chưa tự ý đổi firewall hoặc DNS.
- Rollback: image cũ có tag rollback theo deploy script; migration alias có thể rollback về `20260821233000_AddJobRepostingLifecycle`; bỏ hostname `backend` sẽ tái tạo lỗi sync nên chỉ rollback nếu kiến trúc mạng đổi.
- Bước tiếp theo: commit/push hotfix, deploy lại backend, xác nhận AI sync trả taxonomy cùng alias; sau đó ghi rõ kết quả HTTPS hoặc blocker hạ tầng và mới chốt trạng thái.

### 2026-08-22 01:31 +07:00 — P2-02/P3-01/P3-03-PREDEPLOY — Khép kín scheduler và tách benchmark nội dung/layout

- Trạng thái: `ĐÃ XONG` code/unit/build/benchmark local; `ĐANG LÀM` deploy VPS và E2E theo vai trò.
- Mục tiêu/phạm vi: sửa khe hở alias mới không tự kích hoạt mining/reload; thay bằng chứng CV đơn giản cùng template bằng hai phép thử độc lập: đối sánh nội dung chi tiết và parser tài liệu đa bố cục.
- Scheduler: fingerprint backend thêm toàn bộ `SkillAliases`; Python đồng bộ taxonomy lúc startup và 02:00 giờ Việt Nam, ghi JSON atomically rồi reload `SKILL_DB/SKILL_ALIASES` trong tiến trình. Không thêm giao diện Admin; chỉ log/metadata kỹ thuật. CV mới không chờ train, vòng nền chỉ chạy khi input thay đổi và đủ ngưỡng.
- Dữ liệu nội dung: generator schema 3 tạo 1.170 CV synthetic tối thiểu 1.791 từ, trung bình 1.876,7 từ, có hai dự án, số liệu/cách đo và bằng chứng riêng theo kỹ năng. Đã bỏ `case_type` và ground truth khỏi text CV để tránh thuật toán đọc nhãn; metadata ngoài input vẫn giữ năm trường hợp kiểm thử.
- Dữ liệu layout: 15 CV dài trên PDF một/hai cột, nhiều trang, Việt/Anh/song ngữ, timeline overlap, heading tùy chỉnh, DOCX bảng/nhiều bảng, ảnh sạch/hai cột/nghiêng nhiễu, PDF scan và PDF dày; thêm 1 PDF không phải CV. Audit đạt 16/16, contact/role/skill đạt theo ngưỡng; OCR giữ đúng dấu tên 13/15 và nhận diện tên 15/15 sau chuẩn hóa dấu, nên không tuyên bố đã giải quyết hoàn toàn OCR.
- File chính sửa: `MiningSchedulerService.cs`, `Python/main.py`, `skills_sync_service.py`, generator/runner/audit benchmark và test liên quan; dữ liệu/report synthetic được tái sinh. Không thay đổi UI và không thêm màn hình quản trị thuật toán.
- Database/API/cấu hình: không thêm migration ngoài `20260822011500_AddSkillAliases` đã tạo ở task trước; EF Release nhận migration và sinh SQL create/index/seed hợp lệ. Scheduler đọc bảng alias sau khi migration được áp. Rollback alias là migrate về `20260821233000_AddJobRepostingLifecycle`; rollback scheduler/code không làm mất CV/JD.
- Kiểm thử thực tế: Python toàn suite 75/75; benchmark offline đạt 1.170 CV/162 JD/3.510 cặp, skill fixture 100%, timeline 1.170/1.170, thứ tự nghiêm ngặt 1.164/1.170 và Apriori/HUIM đúng phép tính/tách 8 domain. Backend Release build đạt 0 lỗi (452 warning legacy ở clean output, incremental 0); frontend production build đạt, còn warning chunk lớn/SignalR như trước. Corpus parser đạt 16/16; raster/scan ở mức `partial` vì chưa có nguồn OCR độc lập trong lần audit offline.
- Git/VPS: VPS trước deploy đang ở commit `9a4a64f`, ba container healthy nhưng source có 11 file sửa dở; đã lưu patch backup cả trên VPS và `.local` trước khi thay đổi. Chưa ghi database hoặc kích hoạt deploy tại thời điểm mục này.
- Hạn chế/bước tiếp theo: tạo commit phát hành, backup/preserve source VPS, pull đúng commit, build/activate bằng script rollback, kiểm tra migration/container/health/API/HTTPS và ghi mục deploy riêng. E2E đăng nhập theo vai trò vẫn là bước nghiệm thu sau deploy; benchmark synthetic không phải accuracy thị trường.

### 2026-08-22 01:05 +07:00 — P2-01-SKILL-ALIASES — Chuẩn hóa alias cho scoring, Apriori và Two-Phase HUIM

- Trạng thái: `ĐÃ XONG` phần code/unit/build/migration script local; migration chưa áp database, chưa restart Python, chưa E2E hoặc deploy VPS.
- Mục tiêu/phạm vi: sửa việc một kỹ năng có nhiều cách ghi bị bỏ sót hoặc bị tính thành nhiều item; tách toàn bộ kỹ năng trích xuất khỏi tập kỹ năng khớp job trên báo cáo; bảo đảm hai thuật toán khai phá dùng cùng canonical skill.
- Quyết định nghiệp vụ: transaction Apriori/HUIM chỉ lấy skill trích từ CV và đã duyệt. Job ứng tuyển, Category và context Talent Pool do HR lưu xác định domain; note/tag/giai đoạn/scoring chủ quan của HR không tự biến thành skill hoặc bằng chứng. HUIM dùng thêm skill/lương quan sát từ JD cùng domain. Kết quả mining chỉ là context gợi ý, không tự cộng điểm hoặc tạo red flag.
- Taxonomy/schema: thêm `SkillAliases` có FK cascade tới `Skills`, unique `NormalizedAlias`; migration seed 58 alias tham chiếu phổ biến và có `Down` xóa bảng. API `GET /api/skills` trả tên chuẩn cùng aliases; Admin có API thêm/xóa alias, kiểm tra xung đột với tên chuẩn/alias khác. Không hardcode alias trong thuật toán.
- Chuẩn hóa: C#/Python dùng cùng quy tắc Unicode, dấu, hoa thường, khoảng trắng và ký hiệu `.`, `#`, `+`, `&`. Alias SQL được quy về canonical trước trích xuất CV/JD, phân loại domain, support/confidence Apriori, quantity/external utility HUIM và đầu vào gợi ý. Cụm dài thắng cụm con trên cùng occurrence để `C#` không sinh thêm `C` và `SQL Server` không sinh thêm `SQL`; occurrence độc lập vẫn được giữ.
- UI: payload báo cáo lưu thêm `extracted_skills`; tab `Năng lực & Cảnh báo` có khối `Kỹ năng nhận diện trong CV`, tách khỏi `Năng lực tương thích tốt`/`Cần làm rõ`. Tiêu đề tóm tắt đổi thành trung tính `Tóm tắt đánh giá`. Giao diện theo style guide hiện hành, không thêm banner hoặc icon trang trí.
- Gemini failover cùng phiên: deadline attempt mặc định 15 giây/tối thiểu 10 giây; chuyển model sau hai key/project transient để không lặp lỗi deadline 2 giây và không log model chưa thử là không khả dụng. Cấu hình tương ứng đã có trong `docker-compose.yml`.
- File chính thêm: `SkillAlias.cs`, DTO alias/taxonomy, `SkillTaxonomyNormalizer.cs`, migration `20260822011500_AddSkillAliases.cs`, `test_skill_taxonomy_aliases.py`. File chính sửa: `SkillsController`, `AppDbContext`/snapshot, `AiService`/Apriori/HUIM/domain service, Python sync/NLP/mining guard/controller/DTO/service/timeline/report, ba component/trang frontend báo cáo, README/context/log.
- API/database/config: thay đổi response `GET /api/skills` theo hướng tương thích mở rộng (giữ `id/name/isApproved`, thêm `aliases`); thêm `POST /api/skills/{skillId}/aliases` và `DELETE /api/skills/{skillId}/aliases/{aliasId}` cho Admin. Payload nội bộ `/train-apriori` và `/train-huim` thêm `taxonomy_aliases`. Migration chưa được chạy vào database cấu hình hiện tại; rollback là migrate về `20260821233000_AddJobRepostingLifecycle`, thao tác này xóa bảng alias nhưng không xóa Skills/CV/JD.
- Kiểm thử thực tế: Python mục tiêu 36/36 rồi toàn suite 72/72 đạt; test alias xác nhận `Node.js/NodeJS/Node JS` thành một item và HUIM giữ đúng quantity/utility canonical; `compileall` đạt. Backend Debug build output riêng và cấu hình `AliasAudit` đều đạt `0 Error(s)` (451 warning legacy); EF nhận migration và sinh SQL nâng cấp thành công. Frontend production build đạt; còn warning chunk lớn/SignalR dependency như trước. `git diff --check` không có whitespace error, chỉ cảnh báo LF/CRLF.
- Git/VPS/dữ liệu: giữ nguyên worktree bẩn nhiều task, chưa commit/push; chưa deploy/kiểm tra VPS; không kết nối hoặc ghi database trong task. Không ghi credential vào code/log/tài liệu.
- Hạn chế/bước tiếp theo: restart backend để auto-migrate, sau đó restart Python để đồng bộ file taxonomy alias; phân tích lại hồ sơ cũ nếu muốn thay danh sách skill đã lưu trước cơ chế canonical mới. Chưa có màn hình Admin quản trị alias; API và schema đã sẵn sàng, UI quản trị taxonomy là task riêng nếu cần.

### 2026-08-22 00:38 +07:00 — P1-02-UX-CLEANUP — Bỏ thông báo thừa trên form đăng lại

- Trạng thái: `ĐÃ XONG` local; chưa commit/push/deploy VPS.
- Mục tiêu/phạm vi: thực hiện đúng yêu cầu không hiển thị banner giải thích việc sao chép nội dung/vòng tuyển trên form đăng lại; HR chỉ cần thấy form đã điền sẵn để chỉnh sửa.
- Frontend: xóa toàn bộ Alert `Tạo đợt ... từ tin ...`, mô tả hồ sơ đợt cũ, hai state chỉ phục vụ banner và import icon/component không còn dùng. Giữ tiêu đề `Đăng lại tin tuyển dụng`, dữ liệu form prefill, nút gửi duyệt và nghiệp vụ tạo vòng mới.
- Style guide: loại trang trí/thông báo lặp, giữ nguyên Card và khoảng cách của form hiện có; không phát sinh khoảng trống hoặc style mới.
- File sửa: `ai-recruitment-frontend/src/features/recruiter/pages/CreateJobPage/CreateJobPage.tsx`, `WORK_LOG.md`.
- API/database/config: không thay đổi API, backend, schema, migration, dữ liệu hoặc cấu hình.
- Kiểm thử: tìm lại toàn file không còn chuỗi banner/state/import liên quan; `npm.cmd run build` thành công. Còn warning chunk lớn và annotation SignalR của dependency như trước, không có TypeScript/build error.
- Git/VPS/rollback: giữ nguyên worktree bẩn; chưa commit/push; chưa deploy/kiểm tra VPS. Rollback chỉ cần khôi phục khối Alert, không liên quan dữ liệu.
- Bước tiếp theo: refresh frontend và mở lại `Đăng lại tin`; form phải bắt đầu trực tiếp bằng Card thông tin công việc, không còn banner giải thích.

### 2026-08-22 00:30 +07:00 — OCR-CONSENSUS-GATE — Chặn lỗi trích xuất lan sang toàn bộ phân tích

- Trạng thái: `ĐÃ XONG` phần code/unit/compile và smoke 15 PDF text; chưa đo accuracy trên CV scan thật đã gán nhãn, chưa commit/push/deploy VPS.
- Mục tiêu/phạm vi: xử lý điểm mù khi OCR/PDF parser trả văn bản dài, có cấu trúc nhưng sai nội dung nên không kích hoạt fallback và làm sai NLP, kỹ năng, điểm, red flag, STAR và ngôn từ phía sau.
- Quyết định kỹ thuật: thêm phép đồng thuận token không phụ thuộc dấu câu/thứ tự layout giữa PyPDF2, pdfplumber, Tesseract nhiều PSM và Gemini Vision; xếp hạng candidate dùng cả quality và hỗ trợ từ nguồn khác. OCR confidence thấp bị trừ điểm. PDF partial/có cảnh báo/thiếu đồng thuận tiếp tục qua OCR; PDF/ảnh chưa an toàn tiếp tục qua Vision.
- Safety gate: nếu hai nguồn độc lập mâu thuẫn dưới ngưỡng hoặc raster không có mức đối chiếu tối thiểu, kết quả có `quality_level=insufficient`, `analysis_safe=false` và log `EXTRACTION_UNSAFE`. `/validate-cv`, `/extract-cv`, preview và score dừng trước bước nhận diện CV/NLP/chấm điểm; UI nhận thông điệp `Không đủ dữ liệu`, không diễn giải thành CV không phù hợp 0%. Kết quả validate được cache theo hash để score/preview cùng tệp không gọi OCR/Vision lần hai trong cùng tiến trình.
- Giới hạn: đồng thuận không chứng minh văn bản đúng tuyệt đối vì nhiều engine vẫn có thể sai giống nhau. Ngưỡng hiện là chính sách an toàn có test hồi quy, chưa phải accuracy đã hiệu chỉnh trên dữ liệu thật; scan bị mờ có thể bị từ chối thận trọng.
- File sửa: `Python/services/document_layout_service.py`, `Python/services/doc_parser_service.py`, `Python/services/cv_analysis_service.py`, `Python/controllers/analysis_controller.py`, `Python/tests/test_document_layout_service.py`, `Python/README.md`, `PROJECT_CONTEXT.md`, `WORK_LOG.md`.
- API/database/config: response `extraction_quality` bổ sung `agreement_score`, `agreement_kind`, `analysis_safe`; không đổi route, schema database, migration hoặc credential. Tương thích cũ: `extract_text_from_file` vẫn tồn tại làm wrapper.
- Kiểm thử: `venv/Scripts/python.exe -m compileall -q services controllers tests` đạt; toàn bộ unit test `65/65` đạt; test mới xác nhận bỏ ảnh hưởng dấu câu/layout, phát hiện hai extractor cùng trả text dài nhưng trái nội dung, dừng trước resume validation/NLP và tái sử dụng metadata cache. `benchmark_layout_extraction.py` đạt `15/15` PDF bình thường ở mức high, không gọi OCR/Vision thừa. Smoke local không gọi Vision trên bốn mẫu raster 10/11/12/13 lần lượt có agreement `1.00/0.92/1.00/1.00`, đều được giữ mức `partial`; đây chỉ là kiểm tra fallback Tesseract còn hoạt động, không chứng minh nội dung đúng. Còn warning tương thích phiên bản model spaCy `3.8.0` với runtime `3.7.4`, chưa gây test fail nhưng cần đồng bộ dependency/model ở task riêng.
- Git/VPS/rollback: giữ nguyên worktree bẩn và thay đổi người dùng; chưa commit/push; không ghi database; chưa deploy/kiểm tra VPS. Rollback là bỏ metadata consensus/safety gate và trở lại chọn candidate theo quality, không cần rollback dữ liệu.
- Bước tiếp theo: restart Python service để xóa cache text cũ, chạy lại các mẫu ảnh/PDF scan 11/13 và lưu ground truth từng trường; chỉ sau đó mới hiệu chỉnh ngưỡng agreement thay vì nới ngưỡng theo cảm tính.

### 2026-08-22 00:22 +07:00 — P1-02-AI-EVIDENCE-KEY-FAILOVER — Form đăng lại đầy đủ, truy hồi bằng chứng và xoay project key

- Trạng thái: `ĐÃ XONG` phần code/unit/build/config validation; vẫn `ĐANG LÀM` ở nghiệm thu E2E theo tài khoản HR/Admin và chưa deploy VPS.
- Mục tiêu/phạm vi: xử lý cảnh báo bị loại dù câu có trong CV nhưng khác định dạng nhỏ; sửa 503 bỏ model ngay sau một key; đổi đăng lại từ popup thành form đầy đủ và thêm hành động trong trang chi tiết.
- Bằng chứng red flag: thêm `resolve_grounded_evidence` chuẩn hóa Unicode/token, bỏ ảnh hưởng dấu câu/xuống dòng và cho phép tối đa sai khác ký tự nhỏ có ngưỡng cao. Kết quả luôn dùng đúng substring truy hồi từ CV; thay số, thay từ phủ định hoặc paraphrase vẫn bị loại. Cơ chế này thiên về chống false positive, không bảo đảm phát hiện mọi vấn đề trong CV.
- Log red flag: gộp số mục bị loại thành `RED_FLAG_EVIDENCE_REJECTED`, nói rõ đây là cơ chế chống bịa bằng chứng; có `RED_FLAG_EVIDENCE_RECOVERED` khi phục hồi được đoạn nguồn. Không ghi nội dung CV vào log.
- Prompt: yêu cầu `evidence_text` là chuỗi từ liên tiếp sao chép trực tiếp, không sửa dấu/chính tả, không thêm dấu ba chấm, không ghép đoạn hoặc diễn giải lại.
- Failover key/model: bỏ random key; giữ thứ tự trong `GEMINI_API_KEY/GEMINI_API_KEYS` để project ưu tiên đặt trước. 503, 504 và timeout tạo cooldown theo cặp model-key rồi thử key kế tiếp trên cùng model; mặc định tối đa 3 key/model. Sau ít nhất hai project cùng lỗi mới cooldown model; tổng ngân sách một lần gọi mặc định 60 giây. 404 vẫn loại model, 429 vẫn cooldown riêng key.
- Giới hạn tier: code không thể nhận biết key paid/free từ giá trị key. Người vận hành phải đặt key project paid trước key free; log chỉ dùng số thứ tự, không lộ key.
- Docker: cập nhật model mặc định sang chuỗi Gemini 3.x và thêm biến cấu hình model-key cooldown, số key mỗi model, ngân sách request. `docker-compose config -q` đạt với toàn bộ giá trị kiểm tra giả; chỉ còn warning quyền đọc Docker config local, không phải lỗi compose.
- Luồng đăng lại: bỏ modal khỏi danh sách. Nút ở danh sách và trang chi tiết mở route `/recruiter/jobs/:repostSourceId/repost`, tái sử dụng toàn bộ form tạo tin. Form clone category/position/level/branch/salary/description/requirements/max candidates/criteria; ngày mặc định hôm nay và +30 ngày; có draft riêng và cho chỉnh mọi trường trước khi gửi.
- Backend đăng lại: `RepostJobRequest` dùng contract đầy đủ của `CreateJobRequest`; service kiểm tra danh mục, ngày và tổng trọng số, dùng nội dung HR đã chỉnh để tạo bản `Pending` mới, reset extracted skills, tăng vòng và giữ liên kết nguồn. Không thay đổi schema/migration trong bước này.
- Style guide: giao diện dùng Card/Alert sáng, viền `#E2E8F0`/`#BFDBFE`, nút primary hiện có; không thêm modal, dark theme hay trang trí thừa.
- File sửa chính: `scoring_service.py`, `scoring_prompts.py`, `gemini_service.py`, hai test evidence/failover, `docker-compose.yml`; `RepostJobRequest.cs`, `JobService.cs`; `CreateJobPage.tsx`, `JobManagementPage.tsx`, `RecruiterJobDetailPage.tsx`, route và job service type; tài liệu dự án.
- Kiểm thử: test mục tiêu 18/18 đạt; toàn bộ Python `61/61` đạt; compileall đạt; backend Release build `0 Error(s)` và còn 451 warning legacy; frontend production build đạt, còn warning dependency/chunk lớn; compose config hợp lệ với biến giả.
- Git/database/VPS/rollback: giữ nguyên worktree bẩn, chưa commit/push; không ghi/xóa database trong bước này; migration lifecycle đã áp từ bước trước; chưa kiểm tra/deploy VPS. Rollback code là trả lại contract repost rút gọn và modal cũ, không cần rollback schema.
- Bước tiếp theo: khởi động lại Python/backend, đặt key project paid ở đầu danh sách cấu hình, thử một hồ sơ từng có evidence bị loại; sau đó đăng nhập HR, mở chi tiết một tin hết hạn → Đăng lại → chỉnh tiêu chí → gửi duyệt, rồi dùng Admin xác nhận vòng mới ở trạng thái chờ duyệt.

### 2026-08-22 00:04 +07:00 — P1-02-P3-03-JOB-LIFECYCLE-GEMINI-LANGUAGE — Vòng tuyển, benchmark 15 CV/JD và hoàn tất lại tab ngôn từ

- Trạng thái: `ĐÃ XONG` phần code/migration/build/unit/public smoke/Gemini smoke; P1-02 và P3-03 tổng thể vẫn `ĐANG LÀM` vì chưa E2E đăng lại bằng HR rồi duyệt bằng Admin, chưa đo tải đồng thời hoặc accuracy trên CV thật đã ẩn danh. Chưa commit, chưa deploy VPS.
- Mục tiêu/phạm vi: sửa trạng thái tin duyệt nhưng hết hạn; bổ sung đăng lại thành vòng mới; mở rộng bằng chứng synthetic tối thiểu 15 CV cho mỗi JD; thay model Gemini 2.5 không còn khả dụng; sửa lỗi `mining_context` trong phân tích ngôn từ; phân biệt rõ kết quả Gemini với rà soát cục bộ.
- Quyết định vòng đời: `Published` chỉ là đã duyệt. Tin đang tuyển phải đồng thời đã đến ngày bắt đầu và chưa qua hết hạn tuyển theo ngày Việt Nam. `JobLifecyclePolicy` được tái sử dụng ở public job, apply, dashboard, Admin/HR, campaign, chatbot và gợi ý Talent Pool.
- Đăng lại tin: thêm `POST /api/jobs/{id}/repost`; chỉ HR sở hữu tin đã hết hạn được thao tác. Hệ thống sao chép JD/yêu cầu/kỹ năng/tiêu chí sang tin `Pending` mới, liên kết `RepostedFromJobID`/`CampaignGroupID`, tăng `RecruitmentRound`; không sửa tin cũ và không trộn application cũ.
- Schema/database: migration `20260821233000_AddJobRepostingLifecycle` thêm ba cột vòng tuyển, self-FK và unique index vòng trong chiến dịch; `Down` xóa FK/index/cột. Migration đã áp thành công lên database đang được cấu hình. Không xóa hồ sơ/tin cũ.
- Dữ liệu kiểm tra database theo ngày 2026-08-21: 88 tin tổng; 19 tin thực sự đang tuyển; 57 tin `Published` đã hết hạn; 8 tin `Closed` đã hết hạn; 2 tin `Closed` chưa hết hạn; 2 tin bị từ chối. Nguyên nhân số Admin/HR lệch là cách diễn giải trạng thái, không phải lệch múi giờ SQL. Public API trả đúng `totalCount=19`.
- Dữ liệu mô tả: loại marker hiển thị `[TEST-DATA-IT-V3]` khỏi đúng 15 mô tả đã có trong database; kiểm tra còn 0 marker. Không xóa tin hoặc thay credential.
- Gemini: mặc định chuyển sang `gemini-3.6-flash`, `gemini-3.7-flash`, `gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`; nâng `google-genai` lên 2.17.0. Thêm timeout/retry SDK, cache model 404, key cooldown cho 429 và model cooldown/chuyển ngay model khác khi 503.
- Gemini smoke thật: cả năm model trả phản hồi `OK` trên tài khoản hiện có. Phép phân tích ngôn từ dài gặp 503 ở model đầu và failover thành công sang model tiếp theo, trả `analysis_mode=gemini`, `is_fallback=false`, điểm diễn đạt 78 và hai cụm cần cải thiện. Đây là kiểm tra tính khả dụng/contract, không phải phép đo accuracy.
- Ngôn từ & Chân thực: xóa phép gán nhầm biến `mining_context` gây `NameError`; chuẩn hóa kết quả Gemini có trạng thái rõ. Kết quả cục bộ `is_fallback=true` không còn được backend/frontend coi là báo cáo chi tiết hoàn chỉnh; UI gắn nhãn ngắn `Rà soát cục bộ`, cho xem kết quả hiện có và có nút hoàn tất phân tích lại. Dữ liệu lịch sử không tự đổi, cần bấm chạy lại sau khi Python/backend dùng bản mới.
- UI ngôn từ: bỏ banner fallback dài và câu khẳng định `Tuyệt vời! AI không phát hiện...`; giữ một giới hạn ngắn về việc không xác minh thật/giả hoặc tác giả. Bỏ subtitle lặp dưới tiêu đề báo cáo. Điểm diễn đạt là tham khảo riêng và không cộng vào điểm phù hợp job.
- Chẩn đoán hồ sơ UI/UX bị 0: phép tính có đủ năm tiêu chí tổng 100%, nhưng CV trích xuất chỉ có kỹ năng backend/DevOps, 0 tháng kinh nghiệm UI/UX và không có bằng chứng user research/dự án thiết kế/tư duy thiết kế/phối hợp sản phẩm. Điểm 0 là tổng tiêu chí không đạt, không phải thiếu phép tính; điểm diễn đạt 59 của fallback cũ là thang độc lập.
- Benchmark synthetic: automation sinh 8 ngành, 54 vị trí, 162 JD, 1.170 CV dài và 3.510 cặp; CNTT 540 CV (46,2%). Mỗi JD có 15–40 CV và đủ năm case; CV tối thiểu 1.169 từ, JD tối thiểu 993 từ. Thứ tự mạnh/thiếu một phần/trái ngành đạt 1.164/1.170; sáu ngoại lệ kỹ năng chuyển đổi được giữ, không ép thành 100% nhân tạo.
- Kết quả thuật toán offline: timeline 1.170/1.170; kỹ năng fixture 100% trong taxonomy test; Apriori/HUIM đủ 8 domain và 0 lỗi phép tính/rò domain. Dữ liệu không đọc SQL/backend, không gọi Gemini và không được trình bày là dữ liệu thị trường.
- File chính thêm/sửa: `JobLifecyclePolicy.cs`, `RepostJobRequest.cs`, model/context/service/controller job và migration lifecycle; các trang quản lý tin/campaign/Admin và `jobLifecycle.ts`; `gemini_service.py`, `scoring_service.py`, requirements/test failover; generator/runner/test/report benchmark; `LanguageReviewTab.tsx`, trang/hook lịch sử ứng tuyển; `Python/README.md`, `PROJECT_CONTEXT.md`, `WORK_LOG.md`.
- Kiểm thử thực tế: Python unit `56/56` đạt; backend Release build `0 Error(s)` và còn 451 warning legacy; frontend production build đạt, còn cảnh báo dependency/chunk lớn. Backend tạm trên cổng riêng khởi động, migration báo up-to-date, `/health` và public jobs trả 200; tiến trình đã dừng.
- Git/VPS/rollback: branch `feature/feature-based-refactor-vps`, HEAD trước task `9a4a64f`; giữ nguyên worktree bẩn nhiều task, chưa commit/push. Chưa kiểm tra/deploy VPS. Rollback schema dùng `dotnet ef database update` về migration trước `20260821233000`; việc xóa marker mô tả không có auto-rollback và chỉ ảnh hưởng chuỗi nhãn kỹ thuật.
- Bước tiếp theo: người dùng khởi động lại Python và backend, mở hồ sơ cũ rồi chọn `Hoàn tất phân tích AI` để thay kết quả cục bộ bằng Gemini; sau đó E2E một vòng HR đăng lại tin hết hạn → Admin duyệt → ứng viên mới ứng tuyển, xác nhận hồ sơ vòng cũ/vòng mới tách biệt.

### 2026-08-21 23:05 +07:00 — P3-03-OFFLINE-BENCHMARK-JOBLEVELS — Benchmark dài đa ngành và chuẩn hóa cấp bậc

- Trạng thái: `ĐÃ XONG` phần benchmark offline, timeline và danh mục cấp bậc local/SQL cấu hình hiện tại; chưa commit, chưa deploy VPS. P3-03 tổng thể vẫn `ĐANG LÀM` vì chưa đo Gemini end-to-end/tải đồng thời hoặc accuracy trên CV thật đã ẩn danh.
- Mục tiêu/phạm vi: thay việc tạo hàng loạt hồ sơ bằng backend/SQL bằng automation có thể tái tạo; dữ liệu phải dài, đủ section, nhiều vị trí/cấp bậc và tập trung sâu vào CNTT nhưng vẫn có ngành đối chứng. Đồng thời bổ sung JobLevel không trùng tên/đồng nghĩa.
- Quyết định dữ liệu: dữ liệu là synthetic, không cần nhãn thủ công. Ba quan hệ `strong_same_role`, `partial_same_domain`, `negative_cross_domain` chỉ kiểm tra thứ tự điểm. Không gọi kết quả này là accuracy thị trường. CNTT được tăng lên 12 vị trí và ba biến thể CV cho mỗi vị trí–cấp bậc; bảy ngành khác có sáu vị trí/ngành làm đối chứng.
- Dữ liệu sinh thực tế: 8 ngành, 54 vị trí, 3 cấp bậc benchmark, 162 JD, 234 CV và 702 cặp. CNTT có 108/234 CV (46,2%). CV ngắn nhất 1.077 từ; JD ngắn nhất 993 từ. Mỗi job có tiêu chí cấu trúc tổng đúng 100%.
- Automation: `generate_offline_benchmark.py` sinh JSON; `run_offline_algorithm_benchmark.py` chạy section/timeline/kỹ năng/đối sánh tiêu chí, Apriori và Two-Phase HUIM trực tiếp trong Python rồi xuất JSON/CSV/Markdown. Runner không import client database/network, không đọc appsettings, không chạy backend và không gọi Gemini.
- Lỗi tìm được và sửa: lần benchmark đầu timeline đúng 0/234 vì parser cộng cả ngày dự án/học vấn. `timeline_service` nay chỉ dùng section kinh nghiệm khi nhận diện được; fallback toàn văn chỉ dành cho CV không có heading. Thêm test chống cộng ngày dự án/học vấn.
- Kết quả benchmark sau sửa: 234/234 CV có thứ tự điểm nghiêm ngặt `cùng vị trí > cùng ngành khác vị trí > trái ngành`; điểm trung bình lần lượt 100, 51,58 và 28,23. Timeline đúng 234/234; skill fixture được trích xuất 100% trong điều kiện taxonomy test; Apriori support/confidence và HUIM exact utility không có sai số trên tám domain, không lẫn item ngoài taxonomy ngành. Tổng thời gian local khoảng 21,5 giây; đây không phải phép đo tải đồng thời hay Gemini.
- Cấp bậc: thêm catalog tự kiểm tra alias và seeder hợp nhất không xóa. Danh mục hoạt động gồm 5 nhóm và 14 cấp con từ Intern/Trainee/Fresher tới Director/VP/C-level; tách Director khỏi C-level, tách Senior Manager khỏi Head of Function. API Admin ngăn tạo/sửa tên đồng nghĩa và ngăn hierarchy sâu sai. UI ứng viên/Talent Pool chỉ cho chọn cấp con.
- SQL/API thực tế: backend chạy với database đang cấu hình; không có migration mới cần áp. Seeder chuyển tham chiếu job về bản chuẩn, API trả 19 mục hoạt động = 5 nhóm + 14 cấp con, 0 tên hoạt động trùng; sáu alias legacy được giữ ở trạng thái `[Đã hợp nhất]`. `GET /health` trả 200. Tiến trình smoke test đã dừng.
- Tác động scheduler khi startup: lần khởi động đầu cập nhật thêm phân loại domain cho 1 CV và chạy mining theo fingerprint hiện hành; lần khởi động thứ hai báo không có dữ liệu mới và bỏ qua huấn luyện. Benchmark offline không gây các thay đổi SQL này; đây là hành vi startup sẵn có của `MiningSchedulerService`.
- File thêm: `Python/test_data/offline_benchmark/catalog.json`, dữ liệu trong `generated/`, báo cáo trong `results/`, `Python/tools/generate_offline_benchmark.py`, `run_offline_algorithm_benchmark.py`, `Python/tests/test_offline_benchmark.py`, `JobLevelCatalog.cs`.
- File sửa chính: `timeline_service.py`, `test_timeline_service.py`, `JobLevelCatalogSeeder.cs`, `JobLevelService.cs`, ba trang frontend lọc cấp bậc, `Python/README.md`, `PROJECT_CONTEXT.md`, `WORK_LOG.md`.
- Kiểm thử: benchmark command trả exit code 0; Python unit `51/51` đạt; backend build đạt 0 error (còn 434 warning legacy ở clean build, incremental cuối có thể 0 warning); frontend production build đạt, chỉ còn cảnh báo chunk lớn/annotation từ dependency; API health và danh mục đạt như trên.
- Git/VPS/rollback: worktree vốn bẩn được giữ nguyên, chưa commit/push; chưa kiểm tra/deploy VPS. Bản ghi JobLevel cũ không bị xóa nên có thể phục hồi thủ công, nhưng seeder không có auto-rollback cho việc chuyển tham chiếu; cần sao lưu trước khi thay đổi thang cấp bậc lần nữa.
- Bước tiếp theo: dùng báo cáo này làm bằng chứng synthetic; nếu giáo viên yêu cầu độ chính xác thực tế, cần tập CV thật đã ẩn danh và quy trình đánh giá độc lập. Tiếp tục test API theo role/E2E và đo Gemini/p95 riêng, không gộp với benchmark offline.

### 2026-08-21 22:35 +07:00 — BUG-AI-LEGACY-CRITERIA — Sửa AI_ERROR dù Python trả HTTP 200

- Trạng thái: `ĐÃ XONG` ở unit/build; chưa replay lại đúng hồ sơ qua HTTP sau khi người dùng dừng phép thử, chưa deploy VPS.
- Nguyên nhân: 15 job legacy dùng `EXPERIENCE/PROJECT`, `CONTAINS_ANY/MIN_DURATION`; validator mới chỉ chấp nhận contract chuẩn nên trả payload `status=error` bên trong HTTP 200. Backend lưu `AI_ERROR` dù log chỉ thấy `/score-cv 200`.
- Thay đổi: ánh xạ có kiểm soát `EXPERIENCE → TOTAL_EXPERIENCE`, `PROJECT → CUSTOM`, `CONTAINS_ANY → IN`, `MIN_DURATION → MINIMUM`; chấp nhận yêu cầu 0 tháng cho Fresher; timeline cho tiêu chí 0 tháng trả FULL mà không bịa kinh nghiệm. `/score-cv` và `/score-cv-text` trả 422 cho dữ liệu tiêu chí sai, 503 cho lỗi dịch vụ thay vì payload lỗi HTTP 200.
- File sửa: `criterion_validation_service.py`, `scoring_service.py`, `analysis_controller.py`, test criterion/timeline.
- Kiểm thử: test mục tiêu 20 case đạt; toàn bộ suite sau các thay đổi cùng phiên đạt 51/51. Chưa khẳng định lỗi UI của hồ sơ cũ tự biến mất vì bản ghi `AIEvaluation` cũ vẫn là lịch sử và cần phân tích lại nếu muốn cập nhật.
- API/database/Git/VPS: không thay schema hoặc database trong sửa lỗi này; chưa commit, chưa deploy VPS.

### 2026-08-21 22:24 +07:00 — BUG-MIGRATION-TALENTPOOL-OWNERSHIP — Sửa migration làm backend không khởi động

- Trạng thái: `ĐÃ XONG` local/database cấu hình hiện tại; chưa commit, chưa deploy VPS.
- Nguyên nhân: migration thêm `TalentPoolCandidates.RecruiterID` rồi tham chiếu cột mới trong cùng SQL batch, nên SQL Server kiểm tra tên cột trước khi chạy `ALTER TABLE` và báo `Invalid column name 'RecruiterID'`. Migration còn dùng nhầm `LastUpdated` thay vì cột thật `LastUpdatedAt`.
- Thay đổi: tách bước thêm cột và bước backfill/tạo index thành hai `migrationBuilder.Sql` riêng; sửa tên cột sắp xếp thành `LastUpdatedAt`. Không xóa bản ghi và giữ nguyên rollback đã có.
- File sửa: `RecruitmentBackend/RecruitmentBackend/Migrations/20260821213000_AddTalentPoolRecruiterOwnership.cs`.
- Database/API/cấu hình: đã áp thành công `20260821213000_AddTalentPoolRecruiterOwnership` và `20260821220000_SeedReviewedSkillCatalog` vào database đang được `appsettings.Development.json` cấu hình; không thay đổi API hoặc credential.
- Kiểm thử thực tế: backend build đầy đủ đạt `0 Error(s)` (còn 431 warning legacy); script EF sinh hai batch có `GO`; `dotnet ef database update --no-build` trả `Done`; lần khởi động kế tiếp báo database đã cập nhật; `GET http://localhost:5286/health` trả `200 Healthy`; scheduler startup hoàn tất Apriori/HUIM cho 4 ngành. Sau khi dừng hẳn tiến trình con, build incremental cuối đạt `0 Warning(s), 0 Error(s)`.
- Trạng thái runtime/Git/VPS: đã dừng cả tiến trình host `dotnet run` và tiến trình con `RecruitmentBackend.exe` dùng cho smoke test; cổng 5286 và file build đã được giải phóng để người dùng chạy từ Visual Studio. Worktree vẫn chứa nhiều thay đổi từ các task trước, chưa commit; chưa kiểm tra/deploy VPS.
- Hạn chế/bước tiếp theo: chưa smoke test đăng nhập và các API Talent Pool theo tài khoản HR trên trình duyệt; cần chạy backend bình thường rồi kiểm tra danh sách, chi tiết, lưu hồ sơ và gợi ý job.

### 2026-08-21 — THESIS-DB-DEPLOYMENT-DECISION — Giữ database dùng chung và auto-migration

- Trạng thái: `ĐÃ XONG` về quyết định phạm vi; không thay đổi code/cấu hình.
- Quyết định của chủ đề tài: hệ thống phục vụ khóa luận, không hướng tới thương mại; tiếp tục dùng connection string database production trong `appsettings.Development.json` và giữ `Database.MigrateAsync()` lúc backend khởi động để cập nhật toàn bộ thay đổi nhanh.
- Điều chỉnh backlog: loại hai đề xuất “tách database Development/production” và “bỏ auto-migrate trên production” khỏi công việc cần làm hiện tại.
- Biện pháp giữ lại: `EnableTestJobSeed=false`; không tự chạy seeder dữ liệu job; migration mới phải bảo toàn dữ liệu cũ và có `Down`; theo dõi exception migration/startup sau mỗi lần chạy lại backend.
- File cập nhật: `PROJECT_CONTEXT.md`, `WORK_LOG.md`.
- Kiểm thử/Git/VPS: không cần build vì không sửa code; chưa commit, chưa deploy VPS.

### 2026-08-21 22:07 +07:00 — AUDIT-REVIEWER-20260821 — Sửa luồng AI/mining, OCR, Talent Pool, dashboard và dữ liệu kiểm thử

- Trạng thái: `ĐANG LÀM` local; các phần code/build/unit/corpus đã đạt, còn migration database và E2E theo vai trò. Chưa commit, chưa push, chưa deploy VPS.
- Mục tiêu/phạm vi: kiểm tra lại phản biện về prompt/bằng chứng, OCR, điểm 100, dashboard/filter/realtime, nộp nhiều job, Talent Pool chủ động và Apriori/Two-Phase; sửa các lỗi có bằng chứng trong source thay vì dựa vào mô tả cũ.
- Quyết định AI/bằng chứng: `analysis_confidence` không còn bị gọi nhầm là tỷ lệ đầy đủ bằng chứng; thêm `evidence_coverage`. Red flag/tiêu chí chỉ giữ khi có đoạn trích cục bộ; OCR/mất dấu không phải lỗi ứng viên. Kết quả mining chỉ là context gợi ý, không phải bằng chứng, không cộng điểm và không tạo cảnh báo.
- Quyết định mining: bỏ `skills.json`, taxonomy IT mặc định, `KnownSkills` và bảng ánh xạ 5 domain khỏi runtime. Taxonomy lấy từ `Skills.IsApproved`; kỹ năng mới vào queue chờ duyệt. Domain lấy động từ Category/job/application/context HR. Apriori/HUIM chạy riêng từng domain đủ tối thiểu 5 CV, lưu nhiều model không ghi đè, reset model stale ở chu kỳ mới, skip bằng fingerprint nếu dữ liệu không đổi.
- Scheduler/runtime: kiểm tra mining ngay lúc backend khởi động và tiếp tục lúc 02:00 giờ Việt Nam; state/model lưu ở volume runtime. Sửa lệch quantity HUIM khi transaction bị loại. API C# chỉ coi phản hồi Python `status=success` là thành công.
- OCR/default CV: pipeline native PyPDF2/pdfplumber/layout → OCR Tesseract `vie+eng` → Gemini Vision chỉ khi local không đủ; điểm chất lượng phạt mojibake/mất dấu. Sửa gom dòng theo chiều cao chữ để tên tiếng Việt trên ảnh hai cột không bị đảo. Upload/đồng bộ CV mặc định dùng endpoint `/extract-cv`, không đọc byte PDF như UTF-8 và không gán skill cứng.
- Tiêu chí/chấm điểm: thêm hậu kiểm deterministic cho SKILL, EDUCATION, CERTIFICATION, LANGUAGE và LOCATION_WORK_MODE theo đúng section/bằng chứng; mining context được cách ly khỏi score. UI `Năng lực & Cảnh báo` dùng coverage bằng chứng thực.
- Talent Pool/privacy: thêm owner `RecruiterID`, scope toàn bộ list/detail/note/update/remove/suggestion theo HR hiện tại; migration backfill owner và giữ bản trùng cũ ở trạng thái chưa gán thay vì xóa. Gợi ý job hiển thị tỷ lệ bao phủ kỹ năng và matched/missing skills, không gọi là điểm phù hợp tổng thể. Form sourcing dùng metadata Category/Position/JobLevel chung.
- Dashboard/filter: Admin filter Category gồm category con; time-to-hire lấy sự kiện Hired theo filter; top branch dùng snapshot đã lọc. HR/Admin tự xóa selection không tương thích khi đổi category/job; job option có trạng thái/hạn. Gỡ vùng Admin AI Insights rỗng.
- Dữ liệu tham chiếu/test: migration `20260821220000_SeedReviewedSkillCatalog` bổ sung 140 skill đã duyệt bằng ID âm để rollback đúng dòng; đây không phải training data. Seeder job mặc định tắt, tạo 16 job IT theo nhiều vai trò/chi nhánh với trách nhiệm, yêu cầu và tiêu chí chi tiết; marker chỉ nằm ở mã nội bộ, mã công khai UI lấy từ GUID. Không chạy seeder hoặc ghi dữ liệu vào database production trong task này.
- Corpus: tạo 15 hồ sơ hư cấu khác nhau (đa ngành, PDF/DOCX/ảnh, scan, hai cột, Việt/Anh, timeline overlap) và 1 PDF đối chứng không phải CV. Ground truth/audit kiểm tra validation, contact, tên, vai trò, skill, section và timeline.
- File Python chính thêm/sửa: `services/runtime_paths.py`, `skill_mining_guard.py`, `mining_model_store.py`, `mining_context_service.py`, `document_layout_service.py`, `doc_parser_service.py`, `cv_analysis_service.py`, `scoring_service.py`, `apriori_service.py`, `huim_service.py`, `skills_sync_service.py`, `nlp_processor.py`, controller/DTO, `tools/generate_cv_layout_corpus.py`, `tools/audit_cv_layout_corpus.py`, `tests/*` và `test_data/cv_layout_corpus/*`.
- File backend chính thêm/sửa: `CandidateCvDomainService.cs`, `SkillDiscoveryService.cs`, `MiningSchedulerService.cs`, `AprioriService.cs`, `HighUtilityService.cs`, `AiService.cs`, `ProfileService.cs`, `TalentPoolService.cs`, `DashboardService.cs`, các controller/interface/DTO/model liên quan, migration `20260821213000_AddTalentPoolRecruiterOwnership.cs`, `20260821220000_SeedReviewedSkillCatalog.cs` và snapshot.
- File frontend chính sửa: `CompetencyTab.tsx`, dashboard Admin/HR và hooks, Candidate Search/Detail, Talent Pool/Detail, metadata hook dùng chung, `CandidateJobPage.tsx` và service/type liên quan. Cấu hình runtime sửa ở `.gitignore`, `docker-compose.yml`; dữ liệu test mô tả tại `TestData/README.md`.
- Database/migration: migration ownership có `Down` xóa index/cột; trước khi tạo unique index, bản trùng cùng HR/ứng viên chỉ bỏ owner của bản cũ, không xóa record. Migration catalog dùng ID âm `-2601140..-2601001`; `Down` chỉ xóa đúng ID do migration tạo. Chưa áp hai migration này lên database đang chạy.
- Kiểm thử thực tế: `python -m unittest discover -s tests -p 'test_*.py'` đạt `43/43`; `python -m compileall -q .` đạt; corpus audit đạt phân loại `16/16`, contact/tên/vai trò `15/15`, skill literal trung bình `98,3%`, thời gian OCR lớn nhất khoảng `2,93s` trên máy local. `dotnet build ... -o .tmp_audit_backend/bin -clp:ErrorsOnly` đạt `0 lỗi`, còn `431` cảnh báo nullable/legacy. `npm.cmd run build` đạt, còn cảnh báo chunk lớn/SignalR của thư viện. Build vào `bin/Debug` thất bại do backend đang khóa EXE/DLL, không phải lỗi biên dịch; build cấu hình riêng `Audit` đạt và `dotnet ef migrations list --no-connect` nhận đủ `20260821213000`/`20260821220000`; đã sinh script migration offline thành công, không kết nối DB. `git diff --check` không có whitespace error, chỉ cảnh báo quy đổi LF/CRLF.
- Git/VPS: branch `feature/feature-based-refactor-vps`, HEAD trước task `9a4a64f`; worktree đã bẩn từ nhiều task trước và được giữ nguyên, chưa tạo commit. Không kiểm tra hoặc thay đổi VPS.
- Hạn chế/bước tiếp theo: cần backup rồi restart backend để áp migration và smoke test Candidate/HR/Admin trên database hiện hữu; test API phân quyền và E2E trình duyệt; kiểm thử đồng thời/queue bền vững cho phân tích nhiều job; triển khai cohort khi đăng lại tin; đo p95/end-to-end và độ chính xác trên CV thật đã gán nhãn. Catalog 140 skill không thể bao phủ mọi kỹ năng; skill mới vẫn cần quy trình review. Utility HUIM là tín hiệu lương quan sát trong dataset, không chứng minh độ hiếm hoặc giá thị trường.

### 2026-08-21 — REUSE-HR-METADATA — Dùng chung metadata với bộ lọc HR

- Trạng thái: `ĐANG LÀM` local; chưa deploy VPS.
- Quyết định: không tạo danh mục lĩnh vực/vị trí/cấp bậc riêng cho sourcing; dùng cùng API metadata mà HR đang dùng (`categories`, `jobpositions`, `joblevels`).
- Frontend: thêm hook dùng chung `useRecruitmentMetadata`; form sourcing ở chi tiết Talent Pool và trang hồ sơ tìm ứng viên dùng cùng nguồn/options, vẫn cho phép giữ giá trị cũ nếu API metadata tạm lỗi.
- File sửa: `src/features/recruiter/hooks/useRecruitmentMetadata.ts`, `features/recruiter/services/jobService.ts`, `TalentPoolDetailPage.tsx`, `CandidateSearchDetailPage.tsx`.
- Kiểm thử: `npm.cmd run build` thành công; chưa E2E sau restart backend.
- Ghi chú nghiệp vụ: `Giai đoạn` chỉ là tiến độ HR quản lý hồ sơ trong Talent Pool, không phải dữ liệu CV và không dùng để kết luận ứng viên phù hợp; có thể để mặc định `Đã lưu`.

### 2026-08-21 — DATA-REUSE-SOURCING-CONTEXT — Tái sử dụng lĩnh vực/vị trí đã có trong hồ sơ

- Trạng thái: `ĐANG LÀM` local; chưa deploy VPS.
- Nguyên nhân: form sourcing chỉ đọc các cột context đã lưu ở `TalentPoolCandidates`, không tự lấy domain của CV, chuyên ngành hoặc vị trí từ các lần ứng tuyển.
- Thay đổi backend: hồ sơ tìm kiếm chi tiết trả thêm `ProfileDomains` và `ProfilePositions`; nguồn gồm `CandidateCvDomains`, `CandidateCV.Major` và vị trí từ các application. Chi tiết Talent Pool/job suggestion tự suy luận context khi metadata sourcing còn rỗng, nhưng không ghi đè dữ liệu HR đã xác nhận.
- Thay đổi frontend: form lưu hồ sơ công khai được điền sẵn domain/vị trí đã tồn tại để HR kiểm tra rồi lưu, thay vì nhập lại từ đầu.
- File sửa: `CandidateDiscoverySearchResponse.cs`, `TalentPoolService.cs`, `talentPoolService.ts`, `CandidateSearchDetailPage.tsx`.
- Kiểm thử: backend build output tạm đạt `0 Error(s)` (còn warning nullable cũ); frontend build trước thay đổi backend đã đạt thành công. Chưa E2E sau restart.
- Hạn chế: domain suy luận từ CV là bằng chứng hệ thống, không phải xác nhận HR; HR vẫn có thể chỉnh trước khi lưu.

### 2026-08-21 — UX-TALENTPOOL-WORKSPACE-SPLIT — Tách khu vực hồ sơ và đối sánh

- Trạng thái: `ĐANG LÀM` local; chưa deploy VPS.
- Quyết định: không dồn xem hồ sơ/sourcing và chọn job/gửi lời mời vào cùng một luồng hiển thị; dùng hai khu vực rõ ràng `Hồ sơ & sourcing` và `Đối sánh & mời`.
- Frontend: thêm thanh chuyển khu vực trong chi tiết Talent Pool; phần chỉnh sửa sourcing tiếp tục được thu gọn; nhãn giai đoạn kèm giải thích để phân biệt với trạng thái ứng tuyển.
- File sửa: `ai-recruitment-frontend/src/features/recruiter/pages/TalentPoolDetailPage/TalentPoolDetailPage.tsx`.
- Kiểm thử: `npm.cmd run build` thành công; chưa E2E sau restart.
- Bước tiếp theo: kiểm tra trực tiếp hai khu vực; nếu cần quản lý ghi chú/timeline độc lập, tách tiếp thành tab `Lịch sử` ở trang Talent Pool.

### 2026-08-21 — UX-TALENTPOOL-STAGE-CONTEXT — Tách phần chỉnh sửa sourcing và làm rõ giai đoạn

- Trạng thái: `ĐANG LÀM` local; chưa deploy VPS.
- Nguyên nhân: toàn bộ trường sourcing và danh sách giai đoạn bị dồn vào màn hình chi tiết, gây khó hiểu dù đã dịch nhãn.
- Frontend: phần chính chỉ giữ context/tag/trạng thái tóm tắt; các trường chỉnh sửa được thu gọn trong `Chỉnh sửa phân loại sourcing`; thêm giải thích rằng giai đoạn sourcing là tiến độ HR xử lý, không phải trạng thái ứng tuyển.
- File sửa: `ai-recruitment-frontend/src/features/recruiter/pages/TalentPoolDetailPage/TalentPoolDetailPage.tsx`.
- Kiểm thử: `npm.cmd run build` thành công; chưa E2E sau restart.
- Bước tiếp theo: kiểm tra trực tiếp trang chi tiết và quyết định có tách tiếp thành tab `Tổng quan / Sourcing / Đối sánh / Lịch sử` hay không.

### 2026-08-21 — UX-TALENTPOOL-VI-STAGE — Việt hóa nhãn giai đoạn sourcing

- Trạng thái: `ĐANG LÀM` local; chưa deploy VPS.
- Nguyên nhân: mã nghiệp vụ `Saved`, `ContactPlanned`, `NotSuitable` bị hiển thị trực tiếp trên giao diện, trái quy định tiếng Việt.
- Thay đổi: thêm bộ ánh xạ nhãn sourcing dùng chung; giữ mã tiếng Anh ở API/database nhưng hiển thị `Đã lưu`, `Dự kiến liên hệ`, `Chưa phù hợp`… trong form, tag chi tiết và form lưu ứng viên.
- Đồng thời: API `get-my-jobs` trả thêm `requirements`, `category.parentId`, tên cấp bậc để bộ lọc job phân biệt đúng nhóm ngành/lĩnh vực/cấp bậc; phần đối sánh hiển thị thêm cơ sở, context sourcing và tóm tắt yêu cầu job.
- File sửa: `ai-recruitment-frontend/src/utils/statusLabels.ts`, `TalentPoolDetailPage.tsx`, `CandidateSearchDetailPage.tsx`, `useTalentPoolDetail.ts`, `features/jobs/services/jobService.ts`, `RecruitmentBackend/RecruitmentBackend/Services/JobService.cs`.
- Kiểm thử: frontend build thành công; backend build output tạm đạt `0 Error(s)` (còn warning nullable cũ). Chưa chạy E2E sau restart backend.
- Bước tiếp theo: restart backend/frontend rồi kiểm tra bộ lọc và giai đoạn trên trang Talent Pool.

### 2026-08-21 — UX-ACTIVE-SOURCING-LIST-ACTION — Hiển thị thao tác lưu ngay trong danh sách tìm ứng viên

- Trạng thái: `ĐANG LÀM` local; chưa deploy VPS.
- Nguyên nhân: trước đây nút lưu chỉ có ở trang chi tiết hồ sơ nên HR không thấy chức năng trong danh sách tìm ứng viên.
- Frontend: thêm nút `Lưu Talent Pool` tại từng dòng ứng viên chưa được lưu; mở form nhanh yêu cầu domain hoặc vị trí mục tiêu, gọi API lưu hiện có, cập nhật trạng thái dòng ngay sau thành công. Nút `Xem hồ sơ` vẫn giữ để nhập thêm stage/tag/priority/lương/ngày sẵn sàng.
- File sửa: `ai-recruitment-frontend/src/features/recruiter/pages/CandidateSearchPage/CandidateSearchPage.tsx`.
- API/database: dùng lại `POST /api/TalentPool/discoverable/{candidateId}/save`, không thay đổi schema.
- Kiểm thử: `npm.cmd run build` thành công; chưa chạy E2E với tài khoản HR trên production.
- Bước tiếp theo: restart frontend, vào `Tìm ứng viên`, kiểm tra nút lưu ở dòng chưa có Talent Pool và thử lại danh sách sau khi lưu.

### 2026-08-21 — UX-TALENTPOOL-ICON-NEUTRAL — Đồng bộ biểu tượng với giao diện nghiệp vụ

- Trạng thái: `ĐANG LÀM` local; chưa deploy VPS.
- Quyết định: không dùng biểu tượng robot/màu xanh lá kiểu AI cho toàn bộ khối đối sánh; thay bằng biểu tượng biểu đồ trung tính và token màu giao diện hệ thống. Chỉ gọi là AI ở phần mô tả nguồn dữ liệu khi phù hợp.
- Frontend: thay `RobotOutlined` bằng `BarChartOutlined`, bỏ nền xanh lá bão hòa, dùng surface trắng + viền slate; đổi nhãn `Báo cáo so khớp AI` thành `Kết quả đối sánh`.
- File sửa: `ai-recruitment-frontend/src/features/recruiter/pages/TalentPoolDetailPage/TalentPoolDetailPage.tsx`.
- Kiểm thử: `npm.cmd run build` thành công; cảnh báo còn lại là warning chunk lớn của Vite.
- Hạn chế/bước tiếp theo: cần xem trực tiếp trang sau khi restart frontend để xác nhận các biểu tượng ở các tab khác vẫn đồng nhất; chưa deploy VPS.

### 2026-08-21 — UX-TALENTPOOL-DETAIL-FILTER — Tách context sourcing, đối sánh và bộ lọc job

- Trạng thái: `ĐANG LÀM` local; chưa deploy VPS.
- Mục tiêu: làm rõ dữ liệu HR nhập, kết quả AI/thuật toán và thao tác chọn tin tuyển dụng; sửa lỗi lọc hiển thị danh mục không liên quan.
- Quyết định: `Thông tin sourcing` là context do HR xác nhận; `Phân tích phù hợp` là kết quả kết hợp kỹ năng hồ sơ + yêu cầu job + luật đối sánh; `Chọn tin tuyển dụng khác` chỉ lấy tin Published còn hạn của HR hiện tại.
- Backend: API invite-suggestions trả đầy đủ DomainJson, TargetPositionsJson, TagsJson, JobLevel, Stage, Priority, ExpectedSalary và AvailableFrom; tránh làm mất context khi frontend dùng bản candidate từ API gợi ý.
- Frontend: thêm trạng thái `Chưa có context sourcing`, hiển thị chip context, đổi nhãn/giải thích để không gọi mọi kết quả là AI; danh mục nhóm ngành/lĩnh vực chỉ lấy từ các job đang mở, tìm kiếm thêm trong mô tả/kỹ năng/chi nhánh/cấp bậc, thêm bộ đếm và nút Xóa lọc.
- File sửa: `RecruitmentBackend/RecruitmentBackend/Services/TalentPoolService.cs`, `ai-recruitment-frontend/src/features/recruiter/pages/TalentPoolDetailPage/TalentPoolDetailPage.tsx`, `.../hooks/useTalentPoolDetail.ts`.
- Kiểm thử: `npm.cmd run build` thành công; backend build output tạm đạt `0 Error(s)` (còn warning nullable cũ). Chưa chạy E2E trên VPS.
- Hạn chế/bước tiếp theo: cần mở trang chi tiết bằng tài khoản HR, kiểm tra 3 trường hợp không có context, có context và lọc ra 0 job; nếu dữ liệu production còn job thiếu category thì hiển thị nhóm ngành sẽ để trống đúng thay vì gán sai.

### 2026-08-21 — BUG-TALENTPOOL-JOB-SUGGESTION-NULL — Sửa API job gợi ý

- Trạng thái: `ĐANG LÀM` local; chưa deploy VPS.
- Vị trí lỗi: `GET /api/TalentPool/{talentPoolCandidateId}/invite-suggestions`, không phải API tìm kiếm ứng viên.
- Nguyên nhân phòng ngừa: `JobLevel` nullable trong database nhưng entity cũ bắt buộc; truy vấn job/CV/recruiter/kỹ năng còn materialize chuỗi legacy trực tiếp.
- Thay đổi: `JobLevel` thành nullable; recruiter chỉ lấy ID; projection job/CV/kỹ năng dùng giá trị rỗng khi NULL; sửa interaction recruiter ID.
- Kiểm thử: backend build đạt `0 Error(s)` (còn warning nullable cũ). Chưa gọi E2E endpoint sau restart.
- Bước tiếp theo: restart backend bản mới rồi mở chi tiết Talent Pool; gọi lại “Job gợi ý”.

### 2026-08-21 — P1-01-ACTIVE-SOURCING-SAVE — Lưu hồ sơ tìm kiếm có context cấu trúc

- Trạng thái: `ĐANG LÀM` local; chưa deploy VPS.
- Nghiên cứu nghiệp vụ: LinkedIn Recruiter tách thao tác tìm kiếm khỏi lưu vào project/pipeline; khi lưu có project, stage, tag và ghi chú. Áp dụng tương tự cho Talent Pool.
- Backend: thêm `POST /api/TalentPool/discoverable/{candidateId}/save`; yêu cầu ít nhất một domain hoặc vị trí mục tiêu; lưu `RecruiterSaved`, domain, vị trí, cấp bậc, priority, stage, tag, lương và ngày sẵn sàng; thêm interaction sourcing; trả `queuedForMining=true`.
- Frontend: trang chi tiết hồ sơ công khai có nút `Lưu vào Talent Pool` và form cấu trúc; sau khi lưu ứng viên xuất hiện trong Talent Pool để scheduler 02:00 đưa context vào vòng mining.
- File sửa: `TalentPoolService.cs`, `ITalentPoolService.cs`, `TalentPoolController.cs`, `talentPoolService.ts`, `CandidateSearchDetailPage.tsx`.
- Kiểm thử: backend build output tạm đạt `0 Error(s)`; `npm.cmd run build` đạt thành công (chỉ còn cảnh báo chunk lớn của frontend).
- Hạn chế: chưa kiểm thử E2E với tài khoản HR trên production; migration không cần thêm vì dùng bảng/cột Talent Pool hiện có.

### 2026-08-21 — P1-01-ACTIVE-SOURCING-INPUT — Xác định nguồn dữ liệu chủ động cho mining

- Quyết định nghiệp vụ: thao tác tìm kiếm/chỉ xem hồ sơ không tự động đưa dữ liệu vào Apriori/HUIM vì đó chưa phải tín hiệu HR xác nhận phù hợp.
- Luồng đúng: hồ sơ công khai → HR xem → HR chọn `Lưu vào Talent Pool`/đặt sourcing metadata → hồ sơ, kỹ năng, domain và vị trí mục tiêu trở thành input cho vòng mining lúc 02:00.
- Trạng thái hiện tại: API tìm kiếm chỉ đọc hồ sơ công khai và chi tiết; giao diện chi tiết chưa có nút lưu ứng viên công khai vào Talent Pool. Đây là phần chức năng tiếp theo cần triển khai.
- Bổ sung an toàn: truy vấn tìm kiếm đã đổi sang projection, tránh materialize toàn bộ Recruiter/Candidate/CV legacy có NULL; backend build kiểm tra đạt `0 Error(s)`.
- Hạn chế: chưa thêm endpoint/action lưu từ kết quả tìm kiếm trong task này; không được tính lượt xem là dữ liệu huấn luyện.

### 2026-08-21 — BUG-TALENTPOOL-JOBLEVEL-NULL — Chuẩn hóa JobLevel nullable

- Trạng thái: `ĐANG LÀM` local; database production đã migration xong.
- Nguyên nhân xác định: cột `TalentPoolCandidates.JobLevel` trong SQL là nullable nhưng property C# là chuỗi không nullable; projection vẫn đọc trực tiếp nên SqlDataReader có thể ném `Data is Null`.
- Thay đổi: projection danh sách dùng `JobLevel = poolItem.JobLevel ?? string.Empty`.
- Kiểm thử: build output tạm đạt `0 Error(s)`; build binary chính bị tiến trình backend đang chạy khóa file, nên cần restart để nạp code mới.
- Lưu ý bảo mật: connection string production đã xuất hiện trong hội thoại; không chia sẻ lại và nên đổi password database sau khi hoàn tất kiểm thử.

### 2026-08-21 — BUG-TALENTPOOL-PROJECTION — Projection chống NULL khi đọc danh sách

- Trạng thái: `ĐANG LÀM` local; production migration/data đã hoàn tất.
- Bằng chứng: API lỗi đúng tại bước `đọc Talent Pool Candidates`; truy vấn read-only production không thấy NULL ở các cột đã kiểm tra.
- Thay đổi: thay materialization toàn bộ `TalentPoolCandidate` bằng projection các trường cần dùng, áp dụng `COALESCE` cho chuỗi và ép kiểu nullable cho `HighestAiScore`/`LastUpdatedAt`. Điều này bảo vệ API trước schema legacy không đồng nhất.
- Kiểm thử: dừng binary cũ, rebuild backend đạt `0 Error(s)` (chỉ còn warning nullable cũ).
- Bước tiếp theo: chạy binary mới với environment `Development` và gọi lại Talent Pool; thông báo lỗi hiện vẫn có nhãn bước để truy vết nếu còn vấn đề.

### 2026-08-21 — BUG-TALENTPOOL-DIAGNOSTIC-STEP — Gắn bước lỗi cho API Talent Pool

- Trạng thái: `ĐANG LÀM` local; production schema/data đã kiểm tra không còn NULL ở các bảng liên quan.
- Thay đổi: `TalentPoolService.GetTalentPoolCandidatesAsync` ghi nhận bước hiện tại (recruiter, Talent Pool, CV, hồ sơ hoạt động, AI evaluation) và đưa tên bước vào thông báo lỗi; không trả stack trace.
- Mục tiêu: phân biệt binary cũ/endpoint khác với lỗi truy vấn thực tế ở lần gọi tiếp theo.
- Kiểm thử: build đạt `0 Error(s)`. Chưa gọi HTTP endpoint thành công do backend cần chạy đúng `ASPNETCORE_ENVIRONMENT=Development`.
- Bước tiếp theo: restart backend từ source mới, gọi lại API; nếu còn lỗi, thông báo sẽ chỉ rõ bước gây lỗi để sửa chính xác.

### 2026-08-21 — BUG-TALENTPOOL-NULL-QUERY — Loại NULL khi materialize các truy vấn liên quan

- Trạng thái: `ĐANG LÀM` local; database production đã cập nhật migration.
- Kiểm tra read-only production: các cột không nullable của `TalentPoolCandidates`, `CandidateCVs`, `AIEvaluations` và các trường chính của `Recruiters` đều có `NULL = 0`.
- Nguyên nhân còn khả dĩ: endpoint materialize toàn bộ `Recruiter` dù chỉ cần kiểm tra tồn tại, và projection CV/AI đọc chuỗi có thể NULL theo dữ liệu cũ. Đã đổi truy vấn recruiter chỉ chọn `RecruiterID`; projection CV/AI dùng `COALESCE` về chuỗi rỗng.
- File sửa: `RecruitmentBackend/RecruitmentBackend/Services/TalentPoolService.cs`.
- Kiểm thử: build backend đạt `0 Error(s)`. Chưa gọi được HTTP endpoint trong phiên vì tiến trình chạy không đúng environment hoặc kết nối SQL từ app bị từ chối; cần chạy với `ASPNETCORE_ENVIRONMENT=Development`.
- Bước tiếp theo: dừng binary cũ, chạy đúng lệnh Development, đăng nhập HR và tải Talent Pool. Nếu còn lỗi, lấy stack trace mới sau bản build này.

### 2026-08-21 — PROD-TALENTPOOL-MIGRATION — Cập nhật database production qua EF migration

- Trạng thái: `ĐÃ XONG` phần cập nhật database production; backend local cần khởi động lại.
- Phát hiện: `appsettings.Development.json` đang dùng connection production. EF ban đầu không nhận migration thủ công vì thiếu designer; đã bổ sung designer cho ba migration.
- Đã áp dụng thành công: `20260821113000_AddCandidateCvDomains`, `20260821114000_AddTalentPoolSourcingMetadata`, `20260821150000_RepairTalentPoolNullData`.
- Migration sourcing được viết idempotent vì database đã có sẵn một phần cột; migration sửa NULL không xóa bản ghi, chỉ đặt giá trị mặc định cho các cột entity không nullable.
- File sửa/thêm: ba migration và ba designer trong `RecruitmentBackend/RecruitmentBackend/Migrations/`; `Program.cs` không còn SQL tự sửa dữ liệu; thêm precision `ExpectedSalary` trong `Data/AppDbContext.cs`.
- Kiểm thử thực tế: `dotnet ef database update --no-build` trả `Done`; kiểm tra lại `dotnet ef migrations list` cho thấy cả ba migration đã applied. Build đạt `0 Error(s)`.
- Bước tiếp theo: khởi động lại backend, gọi API Talent Pool và xác nhận UI không còn lỗi `Data is Null`. Chưa kiểm tra endpoint HTTP sau khi restart.

### 2026-08-21 — BUG-TALENTPOOL-NULL-REPAIR-REVISED — Tách sửa dữ liệu khỏi Program.cs

- Trạng thái: `ĐANG LÀM` local; chưa deploy VPS.
- Quyết định: không tự động cập nhật dữ liệu trong lúc backend khởi động. Đã xóa compatibility SQL khỏi `Program.cs` để luồng khởi động rõ ràng và tránh sửa dữ liệu ngoài ý muốn.
- File thêm: `RecruitmentBackend/Database/RepairTalentPoolNulls.sql`. Script có transaction, báo số dòng NULL trước/sau, chỉ điền giá trị mặc định cho bản ghi Talent Pool cũ.
- Kiểm thử: backend build đạt `0 Error(s)` sau khi loại bỏ block SQL khỏi `Program.cs` (còn warning nullable tồn tại từ trước).
- Cách vận hành: chọn đúng database trong SSMS, chạy script một lần, kiểm tra kết quả sau cùng bằng các cột `Null...` đều bằng 0, rồi khởi động lại backend.
- Hạn chế: chưa chạy trực tiếp trên database vì không có thông tin kết nối trong phiên này.

### 2026-08-21 — BUG-TALENTPOOL-NULL-REPAIR — Sửa lỗi Data is Null khi tải Talent Pool

- Trạng thái: `ĐANG LÀM` local; chưa deploy VPS.
- Nguyên nhân: dữ liệu Talent Pool cũ có thể chứa `NULL` ở các cột metadata và các trường value-type (`HighestAiScore`, `LastUpdatedAt`, `IsActive`), trong khi entity C# khai báo không nullable; EF Core vì vậy lỗi khi materialize danh sách.
- Thay đổi: bổ sung SQL compatibility repair idempotent sau `Database.MigrateAsync()` trong `RecruitmentBackend/RecruitmentBackend/Program.cs`. Bước này chỉ điền giá trị mặc định an toàn cho bản ghi cũ, không xóa dữ liệu và không thay thế migration.
- Kiểm thử: `dotnet build RecruitmentBackend/RecruitmentBackend/RecruitmentBackend.csproj --no-restore -p:UseAppHost=false -o .tmp_backend_build_nullrepair` đạt `0 Error(s)` (còn warning nullable cũ).
- Vận hành: cần dừng binary backend đang chạy, build/run lại để repair chạy một lần; sau đó gọi lại API danh sách Talent Pool. Chưa kiểm tra database/API thực tế trong phiên này.
- Hạn chế/bước tiếp theo: nếu vẫn còn lỗi, lấy stack trace đầy đủ để xác định cột cụ thể; kiểm tra trực tiếp các cột nullable bằng truy vấn SQL read-only.

### 2026-08-21 — P1-01-POOL-UNIFY — Gộp tìm kiếm chủ động vào Talent Pool

- Trạng thái: `ĐANG LÀM` local; chưa deploy VPS.
- Nguyên nhân lỗi: code đọc các cột sourcing mới nhưng backend/database đang chạy binary/schema cũ; bổ sung migration attributes để EF nhận đúng migration và yêu cầu restart áp dụng schema.
- UX: Talent Pool hiện có hai tab `Ứng viên đã lưu` và `Tìm ứng viên`; không tách hai luồng thành hai màn hình nghiệp vụ độc lập. Trang tìm kiếm có thể render embedded trong Talent Pool.
- Sourcing metadata: trang chi tiết có form cập nhật domain, vị trí, cấp bậc, ưu tiên, stage, tag, lương kỳ vọng; API `PUT /api/TalentPool/{id}/profile`.
- File sửa: `RecruitmentBackend/RecruitmentBackend/Migrations/20260821113000_AddCandidateCvDomains.cs`, `20260821114000_AddTalentPoolSourcingMetadata.cs`, `AppDbContext.cs`, `TalentPoolCandidate.cs`, `TalentPoolService.cs`, DTO/interface/controller; `ai-recruitment-frontend/src/features/recruiter/pages/TalentPoolPage/TalentPoolPage.tsx`, `CandidateSearchPage.tsx`, `TalentPoolDetailPage.tsx`, `talentPoolService.ts`.
- Kiểm thử: `dotnet build ... -o .tmp_backend_build9` và `npm.cmd run build` đạt.
- Bước vận hành: dừng backend đang chạy, build lại và khởi động để `Database.MigrateAsync()` tạo bảng/cột; nếu database không truy cập được thì migration chưa thể áp dụng.

### 2026-08-21 — P1-01-SOURCING-METADATA — Bổ sung metadata sourcing có cấu trúc

- Trạng thái: `ĐANG LÀM` local; chưa deploy VPS.
- Mục tiêu: Talent Pool trở thành nguồn chủ động có thể lọc, ghi context cho đề xuất job/Gemini và đưa dữ liệu có nguồn vào Apriori/HUIM.
- Thay đổi: `TalentPoolCandidate` thêm DomainJson, TargetPositionsJson, JobLevel, SourcingPriority, SourcingStage, TagsJson, ExpectedSalary, AvailableFrom; thêm API `PUT /api/TalentPool/{id}/profile` với validation stage/priority; domain RecruiterSaved được ưu tiên confidence 0.95 khi suy luận CV.
- Database: migration `20260821114000_AddTalentPoolSourcingMetadata`; snapshot cập nhật. Không thay đổi quyền CV của ứng viên.
- Kiểm thử: `dotnet build ... -o .tmp_backend_build9` đạt.
- Hạn chế/bước tiếp theo: UI Talent Pool chưa có form chỉnh metadata cấu trúc; cần nối form chi tiết, bộ lọc server-side và đưa metadata vào context Gemini/đề xuất job. Không nên dùng note tự do để thay thế các trường cấu trúc.
- Bổ sung trong cùng task: API và form chi tiết Talent Pool đã cho HR lưu domain, vị trí mục tiêu, cấp bậc, ưu tiên, stage, tag và lương kỳ vọng; metadata của pool được dùng làm evidence `RecruiterSaved` khi phân loại CV.
- Kiểm thử bổ sung: `npm.cmd run build` frontend đạt; backend build đạt ở `.tmp_backend_build9`.

### 2026-08-21 — P2-01-AUTO-LOOP — Thu gom skill mới tự động trong scheduler

- Trạng thái: `ĐANG LÀM` local; chưa deploy VPS.
- Mục tiêu: biến pipeline skill thành vòng lặp nền có quan sát, không phụ thuộc HR/Admin bấm nút.
- Thay đổi: scheduler 02:00 tự quét CV, chuẩn hóa và đếm skill mới; loại chuỗi nghi OCR; ghi hàng chờ `candidate_for_review` hoặc `quarantine` vào `App_Data/skill-discovery-queue.json`; sau đó mới suy luận domain và chạy Apriori/HUIM.
- Quyết định an toàn: skill mới không tự động đưa vào taxonomy chỉ vì xuất hiện trong CV; cần đạt tần suất và bước chuẩn hóa/xác nhận riêng. Điều này tránh vòng lặp tự học lỗi OCR.
- File thêm/sửa: `RecruitmentBackend/RecruitmentBackend/Interfaces/ISkillDiscoveryService.cs`, `RecruitmentBackend/RecruitmentBackend/Services/SkillDiscoveryService.cs`, `RecruitmentBackend/RecruitmentBackend/Services/MiningSchedulerService.cs`, `RecruitmentBackend/RecruitmentBackend/Program.cs`.
- Kiểm thử: `dotnet build ... -o .tmp_backend_build8` đạt.
- Hạn chế/bước tiếp theo: chưa có endpoint/dashboard đọc queue và chưa có LLM chuẩn hóa tự động; hiện queue là bằng chứng đầu vào cho bước taxonomy kế tiếp.

### 2026-08-21 — P2-01-CV-DOMAIN — Phân loại domain theo từng CV, không ép Candidate một ngành

- Trạng thái: `ĐANG LÀM` local; chưa deploy VPS.
- Mục tiêu: xử lý CV chưa từng ứng tuyển và ứng viên có nhiều hướng nghề nghiệp mà không yêu cầu họ cập nhật profile.
- Quyết định: domain lưu ở cấp CV, cho phép nhiều domain; domain từ job ứng tuyển có confidence 1.0/source `ApplicationJob`, domain suy luận từ skill có confidence và evidence/source `CVSkills`. Chỉ domain confidence từ 0.6 mới tham gia mining.
- File thêm/sửa: `RecruitmentBackend/RecruitmentBackend/Models/CandidateCvDomain.cs`, `RecruitmentBackend/RecruitmentBackend/Interfaces/ICandidateCvDomainService.cs`, `RecruitmentBackend/RecruitmentBackend/Services/CandidateCvDomainService.cs`, `RecruitmentBackend/RecruitmentBackend/Data/AppDbContext.cs`, `RecruitmentBackend/RecruitmentBackend/Services/MiningSchedulerService.cs`, `RecruitmentBackend/RecruitmentBackend/Services/AprioriService.cs`, `RecruitmentBackend/RecruitmentBackend/Services/HighUtilityService.cs`, migration `20260821113000_AddCandidateCvDomains.cs` và snapshot.
- API/database: thêm bảng `CandidateCvDomains` và index duy nhất `(CVID, Domain)`; không thay đổi API người dùng. Migration sẽ được áp dụng khi backend khởi động.
- Kiểm thử: `dotnet build ... -o .tmp_backend_build7` đạt.
- Hạn chế: bộ domain/skill hiện là taxonomy nền trong code, chưa có màn hình quản trị; nhận diện category ứng tuyển hiện ưu tiên Category trực tiếp, cần bổ sung chuẩn hóa Position/category và test dữ liệu nhiều ngành.

### 2026-08-21 — P2-01-DOMAIN-SCOPE — Không trộn CV ngoài ngành vào dataset CNTT

- Trạng thái: `ĐANG LÀM` local; chưa deploy VPS.
- Mục tiêu: thay việc gắn nhãn toàn bộ CV là IT bằng phạm vi dữ liệu thực tế từ Category/Position của tin tuyển dụng.
- Thay đổi: Apriori chỉ lấy CV có Application vào job thuộc Category “Công nghệ thông tin/Information Technology” hoặc Position thuộc các category đó; HUIM áp dụng cùng phạm vi cho CV và JD/utility.
- File sửa: `RecruitmentBackend/RecruitmentBackend/Services/AprioriService.cs`, `RecruitmentBackend/RecruitmentBackend/Services/HighUtilityService.cs`, `PROJECT_CONTEXT.md`.
- Database/API: không đổi schema; truy vấn dùng quan hệ JobPosting → Category/Position → Application → CandidateCV.
- Kiểm thử: `dotnet build ... -o .tmp_backend_build4` đạt.
- Hạn chế/bước tiếp theo: CV chưa từng ứng tuyển vào job có ngành sẽ chưa tham gia dataset; cần bổ sung domain metadata cho CV/talent pool nếu muốn khai phá cả hồ sơ chưa ứng tuyển. Tên category hiện nhận diện theo chuỗi, nên cần taxonomy ngành chuẩn hóa sau.

### 2026-08-21 — P2-02-UI-SCHEDULED — Gỡ thao tác train skill khỏi Admin

- Trạng thái: `ĐÃ XONG` local; chưa deploy VPS.
- Mục tiêu: giao diện không hiển thị nút/permission huấn luyện Apriori/HUIM; cập nhật ngầm theo scheduler 02:00.
- Thay đổi: gỡ hai section Apriori/HUIM khỏi Admin Dashboard và gỡ quyền `train_ai_models` khỏi trang phân quyền; thông báo API chỉ còn mô tả lịch tự động, không nhắc HR/Admin.
- File sửa: `ai-recruitment-frontend/src/features/admin/pages/AdminDashboardPage/AdminDashboardPage.tsx`, `ai-recruitment-frontend/src/features/admin/pages/RolePermissionPage/RolePermissionPage.tsx`, `RecruitmentBackend/RecruitmentBackend/Controllers/AprioriController.cs`, `RecruitmentBackend/RecruitmentBackend/Controllers/HighUtilityController.cs`.
- Kiểm thử: `npm.cmd run build` frontend đạt; backend build output tạm đạt ở task scheduler trước đó.
- Hạn chế: component cũ vẫn còn trong source nhưng không được import/render; có thể xóa sau khi xác nhận không còn route/tham chiếu ngoài dashboard.

### 2026-08-21 — P2-01/P2-02-ALG-GUARD — Chặn skill chưa chuẩn hóa và công khai cơ sở rarity

- Trạng thái: `ĐANG LÀM` local; chưa deploy VPS.
- Mục tiêu/phạm vi: xử lý phản biện rằng Apriori nhận keyword lạ và HUIM chưa chứng minh được kỹ năng hiếm. Bổ sung lớp chuẩn hóa alias, taxonomy theo ngành, loại token nghi ngờ khỏi giao dịch khai phá, skip khi thiếu domain/taxonomy hoặc dữ liệu tối thiểu.
- Quyết định: “hiếm” chỉ được gọi là hiếm trong dataset đã khai báo, dựa trên `support_rate`; không suy luận “ít được tuyển” từ CV. Utility HUIM phải có nguồn nghiệp vụ được khai báo, không dùng giá trị mặc định để kết luận thị trường.
- File thêm/sửa: `Python/services/skill_mining_guard.py`, `Python/services/apriori_service.py`, `Python/services/huim_service.py`, `Python/controllers/skills_controller.py`, `Python/dtos/request_dtos.py`, `RecruitmentBackend/RecruitmentBackend/Interfaces/IAiService.cs`, `RecruitmentBackend/RecruitmentBackend/Services/AiService.cs`, `RecruitmentBackend/RecruitmentBackend/Services/AprioriService.cs`, `RecruitmentBackend/RecruitmentBackend/Services/HighUtilityService.cs`, `PROJECT_CONTEXT.md`.
- API/database/cấu hình: request `/train-apriori` và `/train-huim` nhận thêm `domain`, `taxonomy_skills`, `dataset_id`, `min_support_count`; response có `metadata`. Không thay đổi database schema.
- Kết quả: Apriori/HUIM lưu metadata sidecar, HUIM lưu `support_rate` và nhãn rarity; thiếu phạm vi hợp lệ trả `status=skipped` và không ghi đè kết quả cũ. Keyword như `keyword la`/chuỗi mojibake bị loại khỏi transaction; alias `nodejs` được chuẩn hóa thành `node.js`. Backend đã bỏ mock data và không còn suy diễn quantity theo độ dài chuỗi; thiếu CV/JD thật thì trả trạng thái chưa đủ dữ liệu.
- Kiểm thử: `Python\\venv\\Scripts\\python.exe -m py_compile ...` đạt; smoke test guard và HUIM đạt trong thư mục tạm; `dotnet build ... -o .tmp_backend_build` đạt. Build trực tiếp bị khóa vì backend đang chạy nên đã dùng thư mục output tạm. Có cảnh báo encoding của logger Windows trong thông báo tiếng Việt hiện hữu, không làm fail thuật toán.
- Git/VPS: worktree còn nhiều thay đổi người dùng chưa commit; chưa commit và chưa kiểm tra VPS.
- Hạn chế/bước tiếp theo: taxonomy hiện có bộ mặc định cho IT; cần nối taxonomy được Admin duyệt và dataset JD để đo “ít được tuyển”, đồng thời thêm test endpoint và kiểm thử dữ liệu đa ngành.

### 2026-08-21 — P2-01/P2-02-SCHEDULE — Đồng bộ và tái khai phá skill lúc 02:00

- Trạng thái: `ĐANG LÀM` local; chưa deploy VPS.
- Mục tiêu/phạm vi: bỏ train ngay khi backend khởi động/lặp 12 giờ; chuyển sang kiểm tra một lần lúc 02:00 theo giờ Việt Nam và chỉ chạy khi fingerprint danh mục skill, CV hoặc JD thay đổi.
- Quyết định: restart chỉ khởi động scheduler; không tự reset/xóa dữ liệu. Trạng thái fingerprint lưu tại `App_Data/skill-mining-state.json`; nếu train không thành công thì không cập nhật fingerprint để lần sau thử lại.
- File sửa: `RecruitmentBackend/RecruitmentBackend/Services/MiningSchedulerService.cs`, `RecruitmentBackend/RecruitmentBackend/Controllers/AprioriController.cs`, `RecruitmentBackend/RecruitmentBackend/Controllers/HighUtilityController.cs`, `RecruitmentBackend/RecruitmentBackend/Controllers/SkillsController.cs`.
- Quyền/API: nút train thủ công Apriori/HUIM trả `409 scheduled_only`; HR/Admin không kích hoạt train. API skill nội bộ bị ẩn khỏi Swagger và chỉ trả skill đã duyệt cho bước đồng bộ.
- Kiểm thử: `dotnet build ... -o .tmp_backend_build3` đạt; không tạo migration vì thay đổi chỉ ở scheduler/API, không đổi schema. Chưa chờ tới 02:00 để smoke test thực tế.
- Git/VPS: worktree còn thay đổi trước đó của người dùng; chưa commit, chưa deploy VPS.
- Hạn chế/bước tiếp theo: `SkillsController/sync` vẫn là endpoint nội bộ phục vụ đồng bộ cũ; cần chuyển hoàn toàn sang SkillCatalog có trạng thái/alias trong DB và thêm test timezone/fingerprint.

### 2026-08-21 — P1-01-DATA-SOURCES2 — Bổ sung CV Builder chưa từng nộp

- Trạng thái: `ĐÃ XONG` local; chưa smoke test sau restart backend.
- Thay đổi: trang hồ sơ chi tiết không chỉ liệt kê `CandidateCV`; còn lấy `CvBuilderDocuments` chưa từng nộp, hiển thị nguồn “CV tạo trực tuyến”. Khi ứng viên cho phép xem CV, frontend dựng bản PDF từ `ContentJson/SettingsJson` để HR xem.
- Bảo mật: nội dung CV Builder chỉ trả về khi `RecruiterCvAllowed = true`; CV chưa được cấp quyền chỉ hiển thị trạng thái ẩn.
- Kiểm thử: backend Release build 0 lỗi; frontend build production thành công.
- Hạn chế: quyền xem hiện vẫn ở cấp hồ sơ, chưa cho ứng viên bật/tắt từng CV riêng lẻ; đây là bước nâng cấp tiếp theo để kiểm soát chi tiết hơn.

### 2026-08-21 — P1-01-DATA-SOURCES — Hiển thị toàn bộ nguồn CV công khai

- Trạng thái: `ĐÃ XONG` local; chưa smoke test sau migration.
- Nguyên nhân: UI/endpoint chi tiết trước đây chỉ chọn CV mới nhất nên không thể hiện CV upload, CV đã lưu, CV Builder và snapshot ứng tuyển.
- Thay đổi: endpoint chi tiết trả `PublicCvs` gồm mã CV, tên tệp, nguồn, thời điểm, cờ snapshot ứng tuyển và URL chỉ khi quyền xem CV được cấp. Trang chi tiết hiển thị từng CV riêng, không gộp thành một bản duy nhất.
- API: `GET /api/TalentPool/discoverable/{candidateId}` trả danh sách CV công khai theo quyền ứng viên.
- Kiểm thử: backend Release build 0 lỗi; frontend build production thành công.
- Hạn chế: quyền hiện đang bật/tắt ở cấp hồ sơ ứng viên nên khi bật xem CV, toàn bộ CV đã lưu được trả về; bước tiếp theo nên cho ứng viên chọn từng CV công khai riêng.

### 2026-08-21 — P1-01-UX4 — Chuyển hồ sơ discoverable sang trang chi tiết

- Trạng thái: `ĐÃ XONG` local; chưa smoke test sau restart backend.
- Thay đổi: bỏ modal chi tiết; “Xem hồ sơ” điều hướng tới `/recruiter/candidate-search/:candidateId`, có URL riêng, nút quay lại, thông tin được cấp quyền, trạng thái liên hệ và nút xem CV khi được phép.
- API: thêm `GET /api/TalentPool/discoverable/{candidateId}`; endpoint kiểm tra recruiter, quyền hiển thị và thời hạn trước khi trả dữ liệu.
- File: `CandidateSearchDetailPage.tsx`, `CandidateSearchPage.tsx`, `talentPoolService.ts`, `TalentPoolController.cs`, `TalentPoolService.cs`, `ITalentPoolService.cs`, `App.tsx`.
- Kiểm thử: backend Release build 0 lỗi; frontend build production thành công.

### 2026-08-21 — P1-01-UX3 — Tải kết quả mặc định và xem hồ sơ/CV theo quyền

- Trạng thái: `ĐÃ XONG` local; chưa deploy.
- Thay đổi: trang Tìm ứng viên tự gọi API khi mở, không còn hiển thị 0 hồ sơ trước khi HR bấm nút; thêm nút “Xem hồ sơ” và modal chi tiết. CV chỉ có nút xem khi `CvAllowed` và URL CV được backend trả về.
- API/model: kết quả discoverable thêm `CvAllowed`, `LatestCvUrl`; Candidate thêm quyền `RecruiterCvAllowed`; migration `20260820181449_AddCandidateRecruiterCvPermission`.
- Kiểm thử: frontend build production đạt; backend Release build 0 lỗi. Chưa smoke test sau khi người dùng restart backend và áp database migration.

### 2026-08-21 — P1-01-DATA-FIX2 — Sửa migration rỗng gây thiếu cột quyền xem CV

- Trạng thái: `ĐANG LÀM`; đã sửa code và migration, chờ restart backend local.
- Nguyên nhân: migration đầu tiên được tạo với `--no-build`, nên EF lấy model binary cũ và sinh migration rỗng. Database đã chạy code mới nhưng không có `Candidates.RecruiterCvAllowed`, gây `Invalid column name` ngay khi tải profile.
- Cách sửa: gỡ migration rỗng `20260820181108_AddCandidateRecruiterCvPermission`, build Release trước, tạo lại migration `20260820181449_AddCandidateRecruiterCvPermission` có `AddColumn` đúng.
- Kiểm thử: xác nhận migration mới chứa `AddColumn<bool>("RecruiterCvAllowed")`; backend build Release 0 lỗi; frontend build thành công.
- Hành động cần làm: dừng tiến trình backend cũ và chạy lại từ thư mục project để `Database.MigrateAsync()` áp migration mới; không xóa dữ liệu nghiệp vụ.

### 2026-08-21 — P1-01-DATA-FIX — Bổ sung quyền xem CV và xác định lỗi schema local

- Trạng thái: `ĐANG LÀM`; code đã build, database local cần restart backend để áp migration.
- Phạm vi: thêm quyền `RecruiterCvAllowed`, trả trạng thái/URL CV chỉ khi ứng viên cho phép, thêm công tắc “Cho phép HR xem CV đầy đủ” trong Cài đặt tài khoản.
- Migration: `AddCandidateRecruiterCvPermission` thêm cột `Candidates.RecruiterCvAllowed`, mặc định `false`.
- Kiểm thử: backend Release build 0 lỗi; frontend Vite build thành công. Log runtime xác nhận database hiện tại chưa có cột `RecruiterCvAllowed` (`Invalid column name`), nên phiên backend cũ chưa áp migration và có thể làm trang hồ sơ/tìm kiếm trả rỗng hoặc lỗi.
- Cách khắc phục: dừng backend đang chạy, chạy lại từ `D:\KhoaLuan\RecruitmentBackend\RecruitmentBackend` để `Database.MigrateAsync()` áp migration, sau đó bật lại quyền tìm kiếm và quyền xem CV ở tài khoản ứng viên.
- Hạn chế: chưa smoke test được sau migration vì backend đang chạy bản cũ; chưa commit/deploy VPS.

### 2026-08-21 — P1-01-UX2 — Tách trang tìm ứng viên và đưa quyền riêng tư vào Cài đặt

- Trạng thái: `ĐÃ XONG` local; chưa commit/push/deploy VPS.
- Thay đổi: tạo route/trang `/recruiter/candidate-search`; Talent Pool chỉ điều hướng tới trang này, không còn modal. Đổi nhãn thành “Tìm ứng viên”, bỏ chú thích lặp trong giao diện. Các quyền “cho phép HR tìm kiếm/cho phép liên hệ” được chuyển vào tab “Cài đặt tài khoản” của ứng viên, cạnh đổi mật khẩu.
- File: `CandidateSearchPage.tsx`, `App.tsx`, `SideNav.tsx`, `MainLayout.tsx`, `TalentPoolPage.tsx`, `CandidateProfilePage.tsx`, `AccountSecurityTab.tsx`.
- Kiểm thử: `npm.cmd run build` đạt TypeScript/Vite production build; chỉ còn cảnh báo chunk lớn và annotation SignalR.
- Hạn chế: điểm AI trên trang tìm kiếm hiện là điểm cao nhất từng lưu từ các lần phân tích trước, chưa phải điểm so khớp lại theo một tin được chọn; đã đổi nhãn để tránh hiểu nhầm.

### 2026-08-21 — P1-01-UX — Giảm cảnh báo lặp trong modal tìm ứng viên

- Trạng thái: `ĐÃ XONG` local.
- Thay đổi: bỏ banner thông báo lớn xuất hiện mỗi lần mở modal; chuyển thành chú thích nhỏ dưới bộ lọc, giữ nguyên nội dung bảo vệ quyền riêng tư.
- File: `ai-recruitment-frontend/src/features/recruiter/pages/TalentPoolPage/TalentPoolPage.tsx`.
- Kiểm thử: `npm.cmd run build` đạt TypeScript/Vite production build; chỉ còn cảnh báo chunk lớn/annotation thư viện.
- Git/VPS: chưa commit, chưa push, chưa deploy.

### 2026-08-21 — P1-01 — HR chủ động tìm ứng viên theo hồ sơ đã cho phép

- Trạng thái: `ĐANG LÀM` local; chưa commit/push/deploy VPS.
- Mục tiêu/phạm vi: cho ứng viên bật/tắt quyền để HR tìm kiếm hồ sơ; tách quyền hiển thị khỏi quyền cho phép liên hệ; cung cấp bộ lọc chủ động trong Talent Pool.
- Quyết định nghiệp vụ/kỹ thuật: mặc định riêng tư; quyền tìm kiếm có thời hạn; kết quả tìm kiếm không trả email, số điện thoại hoặc URL CV; khi chưa cho phép liên hệ chỉ hiển thị tên ẩn danh và địa điểm cấp tỉnh/thành phố. Bộ lọc MVP gồm từ khóa, kỹ năng, số năm kinh nghiệm và điểm AI; `JobId` hiện chỉ kiểm tra quyền sở hữu, chưa chấm lại theo tiêu chí tin.
- File đã thêm/sửa: `Models/Candidate.cs`, `Migrations/20260820174950_AddCandidateRecruiterDiscovery.*`, `DTOs/Requests/CandidateDiscoverySearchRequest.cs`, `DTOs/Responses/CandidateDiscoverySearchResponse.cs`, `Interfaces/IProfileService.cs`, `Interfaces/ITalentPoolService.cs`, `Services/ProfileService.cs`, `Services/TalentPoolService.cs`, `Controllers/ProfileController.cs`, `Controllers/TalentPoolController.cs`, `CandidateProfilePage.tsx`, `talentPoolService.ts`, `TalentPoolPage.tsx`, `PROJECT_CONTEXT.md`.
- API/database/config: thêm `PUT /api/profile/recruiter-discovery`, `GET /api/TalentPool/search`; migration thêm bốn cột quyền/thời hạn trên `Candidates`; backend tự áp migration khi khởi động theo cấu hình hiện tại.
- Kiểm thử: `dotnet build RecruitmentBackend/RecruitmentBackend/RecruitmentBackend.csproj --configuration Release --no-restore` đạt 0 lỗi (416 cảnh báo nullable/legacy); `npm.cmd run build` đạt TypeScript/Vite production build, chỉ còn cảnh báo chunk lớn và annotation SignalR.
- Git/VPS: worktree có nhiều thay đổi từ các task trước và task này; chưa commit, chưa push, chưa kiểm tra VPS.
- Hạn chế/lỗi còn lại: chưa smoke test endpoint bằng tài khoản Candidate/Recruiter trên database đang chạy; chưa có luồng gửi lời mời hai chiều hoặc nút đưa hồ sơ discoverable vào Talent Pool; cần bổ sung contract/integration test.
- Bước tiếp theo: restart backend để áp migration, bật quyền ở tài khoản ứng viên, dùng tài khoản HR mở “Tìm ứng viên chủ động”, sau đó bổ sung luồng mời/liên hệ có audit và kiểm tra quyền.

### 2026-08-21 — TEST-DATA-OFF-001 — Tắt seeder và chuẩn bị dọn dữ liệu giả

- Trạng thái: `ĐANG LÀM`; seeder đã tắt trong `appsettings.Development.json`.
- File thêm: `TestData/cleanup_test_jobs.sql` — chỉ xóa job có marker `[TEST-DATA-IT...]` không có Application; job có hồ sơ được giữ và đóng.
- An toàn: chưa chạy SQL vì cần xác nhận database local, tránh thao tác nhầm database ngoài workspace.
- Bước tiếp theo: chạy script cleanup một lần trên DB local, restart backend để xác nhận seeder không chạy lại.
- Định hướng tiếp theo: nâng cấp Talent Pool thành chức năng HR chủ động tìm kiếm/ghép ứng viên theo kỹ năng, kinh nghiệm, vị trí, cấp bậc, chi nhánh, điểm phù hợp và trạng thái liên hệ.

### 2026-08-21 — BRANCH-NORMALIZE-FIX-001 — Sửa lỗi khóa chính khi gộp chi nhánh

- Trạng thái: `ĐANG LÀM`; đã sửa và build Debug thành công.
- Nguyên nhân: `RecruiterBranch.BranchID` thuộc khóa chính kép, EF không cho cập nhật trực tiếp sang branch chuẩn.
- Cách sửa: xóa các liên kết branch trùng, lưu trước, sau đó tạo lại liên kết với branch chuẩn; tránh chỉnh sửa khóa chính đang được tracking.
- Kiểm thử: `dotnet build ... --configuration Debug --no-restore` — 0 lỗi, 411 cảnh báo cũ.
- Bước tiếp theo: chạy lại backend Development; xác nhận không còn exception tại `BranchCatalogSeeder`, sau đó kiểm tra seeder job và dropdown chi nhánh.

### 2026-08-21 — TEST-DATA-STARTUP-001 — Cô lập bước dọn fixture khỏi startup thường

- Trạng thái: `ĐANG LÀM`; đã chỉnh code, chưa xác định lỗi runtime vì chưa có log terminal.
- Điều chỉnh: `BranchCatalogSeeder` và `TestJobPostingSeeder` chỉ chạy khi `EnableTestJobSeed=true`; startup thông thường không thực hiện gộp/xóa dữ liệu test.
- Kiểm thử: chưa chạy lại backend; cần lấy exception thực tế nếu vẫn không khởi động.
- Cách bypass an toàn tạm thời: đặt `EnableTestJobSeed=false` trong cùng terminal để kiểm tra backend có chạy bình thường không.

### 2026-08-21 — TEST-DATA-CLEANUP-001 — Dọn fixture IT cũ trước khi tạo bộ mới

- Trạng thái: `ĐANG LÀM`; đã build backend, chưa restart để thực hiện thao tác DB.
- Phạm vi xóa: chỉ `JobPostings.JobDescription` bắt đầu bằng `[TEST-DATA-IT`; xóa cả `JobCriteria` của job test chưa có Application. Job test đã có hồ sơ không xóa, chỉ chuyển `Closed`.
- Mục tiêu: loại bản ghi V3/fixture cũ lặp và tạo lại bộ 16 tin IT duy nhất, đầy đủ nội dung/tiêu chí, tập trung TP. Hồ Chí Minh.
- An toàn: job thật không có marker không bị tác động; không xóa ứng viên/hồ sơ.
- Kiểm thử: `dotnet build ... --configuration Release --no-restore` — 0 lỗi, 411 cảnh báo cũ.
- Bước tiếp theo: restart backend Development, kiểm tra log số job dọn/tạo, rồi Admin duyệt các tin Pending.

### 2026-08-21 — JOB-MANAGEMENT-STATUS-001 — Phân biệt trạng thái duyệt và hạn tuyển dụng

- Trạng thái: `ĐANG LÀM`; frontend/backend build đã đạt, chưa smoke test bằng tài khoản HR.
- Frontend: `Trạng thái duyệt` hiển thị rõ `Đã duyệt · Đang hiển thị`, `Đã duyệt · Tạm ẩn`, `Chờ duyệt`, `Bị từ chối`, `Đã lưu trữ`; `Hạn tuyển dụng` hiển thị ngày hạn và trạng thái hoạt động riêng.
- Quy tắc: chỉ tin `Published` trước deadline mới là `Đang tuyển`; Pending là `Chưa mở tuyển`; Closed/Archived/Rejected là `Đã đóng`; deadline quá hạn chỉ tính cho tin đã duyệt.
- Bộ lọc hạn tuyển dụng được sửa để không đưa tin Pending/Rejected vào nhóm đang tuyển.
- Kiểm thử: `npm.cmd run build` — thành công; cảnh báo chunk/Rollup cũ còn nguyên.
- Bước tiếp theo: restart backend để chuẩn hóa branch và dọn fixture test, sau đó kiểm tra lại số tin HR.

### 2026-08-21 — BRANCH-NORMALIZE-001 — Gộp chi nhánh Hồ Chí Minh bị trùng

- Trạng thái: `ĐANG LÀM`; code đã build, chưa restart backend để cập nhật DB.
- Mục tiêu: chỉ còn một bản ghi chi nhánh chuẩn `TP. Hồ Chí Minh` trong dropdown và dữ liệu liên quan.
- File thêm/sửa: `RecruitmentBackend/RecruitmentBackend/Services/BranchCatalogSeeder.cs`, `Program.cs`.
- Xử lý: chọn một bản ghi chuẩn, chuyển `JobPostings.BranchID` và liên kết `RecruiterBranches` từ các bản ghi tên Hồ Chí Minh trùng, loại liên kết HR trùng và xóa bản ghi branch dư. Phạm vi chỉ các tên có chứa Hồ Chí Minh/Ho Chi Minh.
- Kiểm thử: `dotnet build ... --configuration Release --no-restore` — 0 lỗi, 411 cảnh báo cũ.
- Hạn chế: thao tác gộp/xóa branch sẽ chạy khi backend khởi động; cần backup/kiểm tra DB local trước khi restart.

### 2026-08-21 — TEST-DATA-IT-006 — Bộ tin IT không lặp, tập trung TP. Hồ Chí Minh

- Trạng thái: `ĐANG LÀM`; backend build thành công, chưa restart để ghi dữ liệu.
- Quyết định dữ liệu: bộ V3 tạo 16 vị trí IT khác nhau, mỗi vị trí một tin; cấp bậc được phân bổ khác nhau; tất cả tin mới dùng chi nhánh `TP. Hồ Chí Minh` và trạng thái `Pending`.
- Tương thích fixture cũ: các tin marker `[TEST-DATA-IT]` được chuyển `Closed` để không còn là bộ tin đang mở; không xóa bản ghi.
- Nội dung/tiêu chí: mỗi tin có phần mô tả chi tiết và bộ 5 tiêu chí theo nhóm vai trò, tổng trọng số 100%.
- Kiểm thử: `dotnet build ... --configuration Release --no-restore` — 0 lỗi, 411 cảnh báo cũ.
- Bước tiếp theo: restart backend Development; kiểm tra 16 tin V3 tại Admin, sau đó duyệt từng tin cần dùng.

### 2026-08-21 — TEST-DATA-IT-005 — Mở rộng mô tả và đa dạng tiêu chí tin IT

- Trạng thái: `ĐANG LÀM`; backend build thành công, chưa chạy seeder trên DB.
- Mục tiêu: tin kiểm thử có nội dung đủ để kiểm tra phân tích CV, không chỉ phục vụ lọc dashboard.
- Nội dung: bổ sung trách nhiệm chính, yêu cầu chi tiết, quyền lợi, cách làm việc và mức lương; tiêu chí thay đổi theo nhóm Software/DevOps/Cloud/Data/QA/Security/BA/Product/UI-UX.
- Tiêu chí: 5 tiêu chí/job, trọng số 35/20/20/15/10 = 100%, có loại, mức ưu tiên, target và nguồn bằng chứng.
- Tương thích dữ liệu cũ: seeder nâng cấp tin marker `[TEST-DATA-IT]` có mô tả ngắn hoặc dưới 5 tiêu chí, không tạo bản ghi trùng.
- Kiểm thử: `dotnet build ... --configuration Release --no-restore` — 0 lỗi, 411 cảnh báo cũ.
- Bước tiếp theo: restart backend Development; kiểm tra một tin có nội dung đầy đủ và Admin duyệt thử.

### 2026-08-21 — TEST-DATA-IT-004 — Tự bật seeder trong Development

- Trạng thái: `ĐANG LÀM`; đã cấu hình, chưa khởi động backend để ghi dữ liệu.
- Điều chỉnh: thêm `EnableTestJobSeed=true` vào `appsettings.Development.json`; môi trường production không nhận cấu hình này.
- Mục tiêu: người dùng chỉ cần restart backend, không phải sửa code hoặc đặt biến môi trường thủ công.
- Kiểm tra: JSON cấu hình hợp lệ; backend seeder đã build 0 lỗi ở lượt trước.
- Hạn chế: nếu backend không chạy profile `Development`, cần bật profile Development; nếu marker đã tồn tại, seeder sẽ không tạo trùng.

### 2026-08-21 — TEST-DATA-IT-003 — Đưa tin kiểm thử về đúng trạng thái chờ Admin duyệt

- Trạng thái: `ĐANG LÀM`; đã chỉnh code, chưa chạy ghi dữ liệu.
- Quyết định nghiệp vụ: mọi tin do HR active sở hữu, có đủ 3 tiêu chí tổng 100% và khởi tạo `Pending`; không seed sẵn `Published`, `ApprovedBy` hoặc `ApprovedAt`. Admin sẽ tự duyệt bằng giao diện.
- File đã sửa: `RecruitmentBackend/RecruitmentBackend/Services/TestJobPostingSeeder.cs`, `TestData/README.md`.
- Kiểm thử: chưa chạy lại backend sau chỉnh sửa; cần build trước khi bật seeder.
- Bước tiếp theo: build/restart backend với `EnableTestJobSeed=true`, kiểm tra danh sách chờ duyệt bằng Admin rồi duyệt thử một vài tin.

### 2026-08-21 — TEST-DATA-IT-002 — Gán đúng tin kiểm thử cho tài khoản HR/Admin hiện có

- Trạng thái: `ĐANG LÀM`; đã sửa và build backend thành công.
- Điều chỉnh: seeder lấy `RecruiterID` từ các tài khoản có role `Recruiter` và trạng thái `Active`; không nhầm với `AccountID`. Tin `Published` dùng `AccountID` của Admin active/đầu tiên làm `ApprovedBy`.
- Phân quyền: HR chỉ thấy các tin được gán cho recruiter tương ứng; Admin thấy toàn bộ tin theo quyền hiện có. Không tạo tài khoản mới và không sử dụng mật khẩu/token.
- Kiểm thử: `dotnet build ... --configuration Release --no-restore` — 0 lỗi, 411 cảnh báo cũ.
- Hạn chế: chưa bật seeder và chưa ghi dữ liệu vào DB; cần chạy local theo `TestData/README.md`.

### 2026-08-21 — TEST-DATA-IT-001 — Seeder dữ liệu tin tuyển dụng IT cho local

- Trạng thái: `ĐANG LÀM`; code đã build, chưa bật hoặc chạy trên cơ sở dữ liệu hiện tại.
- Mục tiêu/phạm vi: tạo dữ liệu kiểm thử tin tuyển dụng IT đa dạng cho Admin/HR, gồm vị trí, cấp bậc, chi nhánh, mức lương, deadline, trạng thái và tiêu chí có cấu trúc.
- Quyết định kỹ thuật: seeder chỉ chạy khi `EnableTestJobSeed=true`; marker `[TEST-DATA-IT]`; chạy lại idempotent, không tạo trùng; không tự chạy production.
- File thêm/sửa: `RecruitmentBackend/RecruitmentBackend/Services/TestJobPostingSeeder.cs`, `RecruitmentBackend/RecruitmentBackend/Program.cs`, `TestData/README.md`.
- Dữ liệu: 16 nhóm vị trí × các cấp bậc active hiện có, 4 chi nhánh, trạng thái Pending/Published/Closed/Rejected; mỗi tin có 3 tiêu chí tổng trọng số 100%.
- Kiểm thử: `dotnet build ... --configuration Release --no-restore` — 0 lỗi, 411 cảnh báo cũ.
- Git/VPS: chưa commit; chưa chạy seeder, chưa thay đổi dữ liệu DB và chưa deploy VPS.
- Bước tiếp theo: kiểm tra connection string local, bật biến môi trường theo `TestData/README.md`, chạy một lần, rồi kiểm tra bộ lọc Admin/HR và số lượng bản ghi marker.

### 2026-08-21 — DASHBOARD-FILTERS-UX-002 — Lọc liên động vị trí theo lĩnh vực

- Trạng thái: `ĐANG LÀM`; đã build frontend thành công.
- Mục tiêu: khi HR chọn lĩnh vực như Công nghệ thông tin, danh sách vị trí/cấp bậc/chi nhánh chỉ còn các lựa chọn có tin tuyển dụng phù hợp.
- File đã sửa: `ai-recruitment-frontend/src/features/recruiter/pages/RecruiterDashboardPage/RecruiterDashboardPage.tsx`.
- Quyết định kỹ thuật: option vị trí loại theo lĩnh vực + cấp bậc + chi nhánh; option cấp bậc loại theo lĩnh vực + vị trí + chi nhánh; option chi nhánh loại theo lĩnh vực + vị trí + cấp bậc. Tin tuyển dụng tiếp tục lọc theo toàn bộ điều kiện.
- Kiểm thử: `npm.cmd run build` — thành công; chỉ còn cảnh báo chunk/Rollup.
- Hạn chế/bước tiếp theo: reload frontend và kiểm tra với lĩnh vực không có vị trí; nếu backend chưa restart, cần restart để danh sách metadata mới được trả về.

### 2026-08-21 — DASHBOARD-FILTERS-DIAG-001 — Hiển thị nguyên nhân lỗi tải Tổng quan tuyển dụng

- Trạng thái: `ĐANG LÀM`; đã build frontend, cần người dùng tải lại trang sau khi backend chạy đúng bản mới.
- Mục tiêu/phạm vi: không che lỗi API bằng thông báo chung; giữ số liệu hiện tại khi lần đổi bộ lọc thất bại.
- File đã sửa: `ai-recruitment-frontend/src/features/recruiter/pages/RecruiterDashboardPage/hooks/useRecruiterDashboard.ts`.
- Quyết định kỹ thuật: log lỗi có mã HTTP và message backend ở console; toast hiển thị message an toàn từ API; không tự thay dashboard về dữ liệu rỗng.
- Kiểm thử: `npm.cmd run build` — thành công; backend `dotnet build ... --configuration Release --no-restore` — 0 lỗi, 411 cảnh báo tồn tại.
- Git/VPS: chưa commit; chưa kiểm tra/deploy VPS.
- Bước tiếp theo: reload frontend, mở DevTools/terminal backend và gửi lại mã HTTP/message nếu vẫn lỗi; cần restart backend để áp dụng các thay đổi Dashboard.

### 2026-08-21 — DASHBOARD-FILTERS-UX-001 — Liên kết bộ lọc HR và cho phép tra cứu tin đã đóng

- Trạng thái: `ĐANG LÀM`; frontend đã build thành công, cần reload/restart dịch vụ để smoke test trên tài khoản HR.
- Mục tiêu/phạm vi: giúp HR tìm đúng tập dữ liệu bằng bộ lọc lĩnh vực, vị trí, cấp bậc, chi nhánh, tin tuyển dụng và thời gian mà không tạo tổ hợp điều kiện mâu thuẫn.
- Quyết định nghiệp vụ: các bộ lọc dùng AND; khi đổi một chiều làm tin đang chọn không còn phù hợp thì tự bỏ tin đó; khi chọn tin, các chiều được tự đồng bộ theo metadata của tin. Tin đã đóng vẫn hiển thị và chọn được để xem số liệu lịch sử.
- File đã sửa: `ai-recruitment-frontend/src/features/recruiter/pages/RecruiterDashboardPage/RecruiterDashboardPage.tsx`, `.../components/DashboardFilterBar.tsx`.
- API/database/config: không thay đổi contract hoặc schema trong lượt này; dùng các option và metadata đã bổ sung ở `DASHBOARD-FILTERS-001`.
- Kiểm thử: `npm.cmd run build` tại `ai-recruitment-frontend` — thành công; chỉ còn cảnh báo chunk/Rollup đã tồn tại.
- Git/VPS: chưa commit; chưa kiểm tra/deploy VPS.
- Hạn chế/bước tiếp theo: restart backend để nhận seeder/API mới, sau đó kiểm tra HR với 1 tin đang mở, 1 tin đã đóng, từng preset thời gian và trường hợp không có dữ liệu; chi tiết ứng viên/trạng thái tiếp tục kiểm tra ở Quản lý chiến dịch tuyển dụng.

### 2026-08-20 — DASHBOARD-FILTERS-001 — Mở rộng bộ lọc dashboard và danh mục cấp bậc

- Trạng thái: `ĐANG LÀM`; code/build local đạt, cần khởi động lại backend và smoke test bằng tài khoản HR/Admin.
- Mục tiêu/phạm vi: hỗ trợ lọc theo lĩnh vực/ngành, vị trí công việc, cấp bậc, chi nhánh và tin tuyển dụng; HR có thêm preset `Hôm nay`.
- Backend: mở rộng `DashboardController`, `IDashboardService` và `DashboardService` với `categoryId`, `positionId`, `jobLevelId`, `branchId`, `jobId`; trả các danh sách option để frontend không lọc giả trên dữ liệu cục bộ.
- Frontend: thêm các Select lọc vị trí/cấp bậc/chi nhánh cho HR và Admin; truyền filter xuống API; thêm preset `Hôm nay`.
- Danh mục cấp bậc: thêm `JobLevelCatalogSeeder` idempotent, kích hoạt các cấp hiện có và bổ sung nhóm Intern/Trainee/Fresher, Junior/Middle/Senior/Expert, Team Leader/Manager/Senior Manager/CTO.
- File đã sửa/thêm: `DashboardController.cs`, `IDashboardService.cs`, `DashboardService.cs`, `JobLevelCatalogSeeder.cs`, `Program.cs`, hook/UI dashboard HR/Admin và `dashboardService.ts`.
- API/database/migration/config: không đổi schema; seeder cập nhật danh mục khi backend khởi động sau migration, không tạo bản ghi trùng.
- Kiểm thử: backend Release build 0 lỗi; frontend production build thành công, chỉ còn cảnh báo chunk/Rollup cũ.
- Hạn chế/bước tiếp theo: backend đang chạy binary cũ nên phải restart để áp dụng API filter và seeder; sau đó kiểm tra kết hợp filter, trạng thái rỗng và quyền HR/Admin.

### 2026-08-20 — P0-03-SMOKE-001 — Kiểm tra contract dashboard và lịch sử trạng thái

- Trạng thái: `ĐANG LÀM`; kiểm tra hạ tầng/contract local đạt, chưa có phiên HR/Admin để xác nhận số liệu thực tế.
- Kiểm thử thực tế: backend `http://localhost:5286/swagger/v1/swagger.json` trả HTTP 200; `/api/Dashboard/admin-stats` và `/api/Dashboard/hr-stats` trả HTTP 401 khi chưa đăng nhập, đúng phân quyền; Python health trả HTTP 200.
- Kiểm tra code: có `ApplicationStatusHistory`, ghi lịch sử ở các luồng nộp/đổi trạng thái/từ chối/lịch phỏng vấn; DashboardService dùng `VietnamTimeService.GetUtcDayRange()` cho số liệu hôm nay.
- API/database/config: không thay đổi trong lượt kiểm tra; migration lịch sử trạng thái đã có trong workspace.
- Hạn chế/bước tiếp theo: cần đăng nhập HR và Admin để đối chiếu `applicationsToday`, `statusChangesToday`, bộ lọc ngày và mốc qua 00:00 giờ Việt Nam; chưa đánh dấu hoàn tất P0-03.

### 2026-08-20 — OCR-PIPELINE-001 — Bổ sung fallback Gemini Vision cho PDF scan

- Trạng thái: `ĐANG LÀM` local; đã kiểm tra compile/unit, chưa smoke bằng PDF cần gọi Gemini thật.
- Mục tiêu/phạm vi: thống nhất pipeline đọc tài liệu theo thứ tự PDF native (PyPDF2/pdfplumber/layout) → OCR local → Gemini Vision → `insufficient` an toàn.
- Quyết định kỹ thuật: chỉ gọi Gemini khi kết quả local còn `insufficient`; render từng trang PDF thành PNG, yêu cầu chép nguyên văn, không suy đoán; nếu Gemini không có key/lỗi/quota thì giữ trạng thái thiếu dữ liệu.
- File đã sửa: `Python/services/doc_parser_service.py`.
- API/database/config: không đổi contract/schema; dùng lại `generate_vision_content_with_retry` và cache/quality gate hiện có.
- Kiểm thử: compileall thành công; Python unit test `36/36` đạt.
- Git/VPS: local, chưa commit/push/deploy.
- Hạn chế/bước tiếp theo: cần smoke một PDF scan thật trong môi trường có Gemini key, kiểm tra chi phí/timeout và xác nhận đoạn trích Gemini không bị dùng như bằng chứng đã xác minh.

### 2026-08-20 — OCR-VALIDATION-FIX-001 — Không từ chối CV hai cột chỉ vì tiêu đề OCR bị đảo

- Trạng thái: `ĐANG LÀM`; mẫu hai cột đã chạy lại thành công, mẫu PDF scan vẫn cần xử lý OCR.
- Nguyên nhân: `is_document_a_resume` chỉ đếm chuỗi tiêu đề chính xác; OCR có thể đảo/mất dấu tiêu đề dù `segment_cv_sections` đã nhận diện đủ section.
- Quyết định kỹ thuật: chấp nhận CV khi có ít nhất 25 từ và ít nhất 2 section đã được bộ phân đoạn cấu trúc nhận diện; vẫn từ chối văn bản quá ngắn/không có cấu trúc.
- File đã sửa: `Python/services/scoring_service.py`.
- Kiểm thử: Python unit test `36/36`; `11_image_two_columns.png` chạy lại qua `/score-cv` thành công, trả 4 tiêu chí, điểm 55 và 2 mục cần xác minh. `13_pdf_scan_clean.pdf` vẫn trả lỗi trích xuất qua endpoint và chưa được nới ngưỡng mù quáng.
- API/database/config: không đổi schema/API contract.
- Git/VPS: local, chưa commit/push/deploy.
- Bước tiếp theo: kiểm tra sự khác biệt runtime của OCR PDF scan và bổ sung test hồi quy trước khi xem P0-01 hoàn tất.

### 2026-08-20 — P0-01-E2E-001 — Chạy 15 CV qua bộ tiêu chí có cấu trúc

- Trạng thái: `ĐANG LÀM` — đã chạy local, còn 2 mẫu không đủ dữ liệu để chấm.
- Mục tiêu/phạm vi: dùng cùng JD DevOps và bốn tiêu chí có tổng trọng số 100% (Docker 30, Linux 25, CI/CD 25, kinh nghiệm DevOps tối thiểu 24 tháng 20) để kiểm tra contract chấm điểm, kết quả tiêu chí và cờ xác minh.
- File thêm: `Python/tools/run_structured_corpus_score.py`.
- Kiểm thử thực tế: gọi `POST /score-cv` với 15 mẫu, giới hạn 3 request đồng thời; 13/15 trả `status=success`, mỗi kết quả thành công có 4 `criteria_results` và có `needs_verification` từ 3–4 mục; điểm trả về trong khoảng 32–59 theo dữ liệu mẫu.
- Hai mẫu lỗi có nguyên nhân rõ: `11_image_two_columns.png` bị từ chối vì nội dung sau OCR quá ít/thiếu cấu trúc CV; `13_pdf_scan_clean.pdf` không trích xuất được đủ nội dung. Đây là lỗi chất lượng đầu vào/trích xuất, không được diễn giải là ứng viên không phù hợp.
- API/database/config: không thay đổi schema; đã xác nhận endpoint nhận tiêu chí cấu trúc và trả kết quả nested trong `matching_result`.
- Git/VPS: local, chưa commit/push/deploy VPS.
- Hạn chế/bước tiếp theo: chưa có ground truth điểm cho 15 CV nên chưa thể kết luận độ chính xác; cần xem riêng hai mẫu lỗi và đối chiếu từng `evidence_text` trước khi đánh dấu P0-01 hoàn tất.

### 2026-08-20 — P3-01-SMOKE-001 — Chạy corpus 15 CV đa định dạng

- Trạng thái: `ĐÃ XONG` cho smoke test extraction local; chưa phải đánh giá độ chính xác AI end-to-end.
- Mục tiêu/phạm vi: kiểm tra 15 mẫu PDF/DOCX/ảnh, hai cột, scan, tiếng Việt/Anh, bảng và timeline trước khi dùng để nghiệm thu tiêu chí có cấu trúc.
- Kiểm thử thực tế: `tools/audit_cv_layout_corpus.py` xử lý 15/15 mẫu sử dụng được; nhận đúng email 15/15 và số điện thoại 15/15; không có mẫu thất bại theo ngưỡng smoke test. Unit test Python đạt 36/36.
- Kết quả cần lưu ý: `11_image_two_columns.png` ở mức `partial` và không nhận được timeline; thời gian OCR lớn nhất `3086.39 ms` ở `13_pdf_scan_clean.pdf`; các kết quả này là giới hạn trích xuất, không phải kết luận năng lực ứng viên.
- File sinh/cập nhật: `Python/test_data/cv_layout_corpus/audit_results.json`, `Python/test_data/cv_layout_corpus/AUDIT_REPORT.md`.
- API/database/config: không thay đổi; chưa gọi Gemini cho 15 mẫu để tránh biến smoke test thành kết quả AI không kiểm soát quota.
- Git/VPS: thay đổi local, chưa commit/push/deploy VPS.
- Bước tiếp theo: chạy 15 mẫu qua endpoint chấm điểm với một JD/tiêu chí cố định, lưu payload và kiểm tra evidence/needs_verification; mẫu ảnh hai cột cần xem riêng về thứ tự layout.

### 2026-08-20 — AI-RED-FLAG-UI-001 — Hiển thị trạng thái cảnh báo cần làm rõ

- Trạng thái: `ĐÃ XONG` local; chờ người dùng tải lại frontend để nghiệm thu giao diện.
- Mục tiêu/phạm vi: không để mục “Thông tin cần làm rõ khi phỏng vấn” biến mất khi hậu kiểm đã loại cảnh báo AI thiếu đoạn trích CV.
- Quyết định nghiệp vụ/kỹ thuật: chỉ hiển thị cảnh báo có bằng chứng nguyên văn; khi danh sách rỗng, hiển thị thông báo trung tính và hướng dẫn xem mục “Cần làm rõ / Cải thiện”. Không khôi phục red flag không có bằng chứng.
- File đã sửa: `ai-recruitment-frontend/src/components/ai-report/CompetencyTab.tsx`.
- API/database/config: không thay đổi.
- Kiểm thử: `npm.cmd run build` thành công; chỉ còn cảnh báo chunk/Rollup đã tồn tại.
- Git/VPS: thay đổi local, chưa commit/push/deploy VPS.
- Hạn chế/bước tiếp theo: cần mở lại báo cáo CV trên frontend và xác nhận thông báo rỗng hiển thị đúng.

### 2026-08-20 — LOCAL-SMOKE-001 — Kiểm tra dịch vụ local sau khi khởi động

- Trạng thái: `ĐÃ XONG` local.
- Mục tiêu/phạm vi: kiểm tra nhanh frontend, backend và Python AI đang phục vụ đúng sau các bản sửa realtime/concurrency.
- Kiểm thử thực tế: frontend `http://localhost:5173/` trả HTTP 200; Python `http://localhost:8000/health` trả HTTP 200 với trạng thái healthy; backend Swagger và OpenAPI trả HTTP 200; API dashboard khi chưa xác thực trả HTTP 401 đúng yêu cầu phân quyền.
- API/database/config: không thay đổi.
- Git/VPS: không phát sinh commit; chỉ kiểm tra local, chưa kết luận VPS.
- Hạn chế/bước tiếp theo: dữ liệu dashboard theo vai trò cần được kiểm tra trong phiên đăng nhập HR/Admin thực tế.

### 2026-08-20 — REALTIME-VERIFY-001 — Smoke test dashboard cập nhật realtime

- Trạng thái: `ĐÃ XONG` local cho luồng cập nhật dashboard đã kiểm tra.
- Mục tiêu/phạm vi: xác nhận dashboard nhận dữ liệu mới mà không cần tải lại thủ công sau sự kiện tuyển dụng.
- Quyết định kỹ thuật: giữ cơ chế thông báo SignalR và refresh dữ liệu dashboard qua sự kiện trình duyệt hiện có.
- File/API/database: không phát sinh thay đổi mới; nghiệm thu luồng SignalR, `MainLayout` và hook dashboard HR/Admin.
- Kiểm thử thực tế: người dùng xác nhận dashboard đã cập nhật realtime sau khi dịch vụ được khởi động lại.
- Git/VPS: thay đổi vẫn ở local, chưa commit/push/deploy VPS.
- Hạn chế/bước tiếp theo: cần kiểm tra thêm quyền group SignalR bằng tài khoản HR khác, ứng viên và trường hợp chưa đăng nhập; sau đó mới đóng toàn bộ `REALTIME-001`.

### 2026-08-20 — AI-CONCURRENCY-VERIFY-001 — Smoke test xử lý hai hồ sơ đồng thời

- Trạng thái: `ĐÃ XONG` local.
- Mục tiêu/phạm vi: xác nhận bản sửa không còn buộc job thứ hai chờ job thứ nhất hoàn tất khi ứng viên nộp hai vị trí liên tiếp.
- Quyết định nghiệp vụ/kỹ thuật: giữ xử lý từng job độc lập; không dùng kết quả hoặc trạng thái của job trước cho job sau.
- File/API/database: không phát sinh thay đổi mới; nghiệm thu các endpoint `/score-cv`, `/score-cv-text` và `/update-skills` đã chuyển sang thread pool.
- Kiểm thử thực tế: người dùng đã khởi động lại dịch vụ và nộp hai job liên tiếp; cả hai job chạy thành công, không còn hiện tượng job sau bị chặn.
- Git/VPS: thay đổi vẫn ở local, chưa commit/push/deploy VPS.
- Hạn chế/bước tiếp theo: cần smoke test dashboard realtime, SignalR phân quyền và lỗi tải thống kê trước khi đánh dấu các task realtime/dashboard hoàn tất.

### 2026-08-20 — REALTIME-001 — Khóa SignalR và nối cập nhật dashboard

- Trạng thái: `ĐANG LÀM`; đã sửa và build local, chưa smoke test hai trình duyệt/role trên môi trường chạy và chưa deploy VPS.
- Mục tiêu/phạm vi: sửa nguyên nhân SignalR không xác thực token qua query string, ngăn tham gia group hồ sơ/tài khoản trái quyền, cho HR tham gia group AI đúng cách, và làm dashboard phản ứng với sự kiện thông báo tuyển dụng.
- Quyết định kỹ thuật: JWT đọc `access_token` chỉ trên hai đường dẫn Hub; `NotificationHub` chỉ cho tài khoản tham gia group của chính mình; `AIEvaluationHub` kiểm tra ứng viên sở hữu hồ sơ hoặc HR sở hữu tin/chi nhánh trước khi tham gia; không mở quyền `Clients.All` rộng hơn.
- File đã sửa: `Program.cs`, `Hubs/NotificationHub.cs`, `Hubs/AIEvaluationHub.cs`, hook SignalR HR/ứng viên, `MainLayout.tsx`, hook dashboard HR/Admin. Không đổi schema/migration.
- Email: response tạo email bổ sung `source=ai|template`; fallback khi `EnableAiEmailDraft=false` được báo là mẫu chỉnh sửa được, không còn hiển thị như kết quả AI. Cập nhật DTO, controller, hai client frontend và thông báo Email Candidate.
- Kiểm thử: backend Release build đạt 0 lỗi (411 cảnh báo nullable/legacy); frontend TypeScript + Vite production build đạt. Chưa có test tự động cho quyền Hub; cần smoke test kết nối bằng ứng viên, HR khác chủ tin và tài khoản không đăng nhập.
- Git/VPS: thay đổi local, chưa commit/push/deploy; giữ nguyên thay đổi không liên quan.
- Hạn chế còn lại: dashboard đang refresh qua sự kiện trình duyệt phát sinh từ notification, chưa có domain event riêng cho Admin; cần bổ sung event bus/SignalR dashboard nếu muốn cập nhật mọi sự kiện kể cả khi không tạo notification. `CandidateEmailAiService` vẫn còn nhiều trách nhiệm, mới sửa contract fallback; tách class là task refactor riêng.
- Bước tiếp theo: khởi động backend mới, smoke test auth/group/reconnect và xác nhận dashboard HR/Admin cập nhật; sau đó mới đánh dấu hoàn tất.

### 2026-08-20 — AI-CONCURRENCY-001 — Không chặn job AI thứ hai bởi job thứ nhất

- Trạng thái: `ĐÃ XONG` local; chưa deploy VPS.
- Bằng chứng nguyên nhân: log cho thấy `/score-cv` mất khoảng 43 giây, sau đó `/update-skills` mất gần 50 giây; các endpoint FastAPI khai báo `async` nhưng gọi hàm đồng bộ nặng trực tiếp, làm chặn event loop nên request job thứ hai chỉ được xử lý sau job đầu.
- Quyết định kỹ thuật: chạy `score_resume_sync` của `/score-cv` và `/score-cv-text` bằng `run_in_threadpool`; chạy `reload_knowledge_base` của `/update-skills` bằng thread pool. Không chạy hai phép so khớp trong cùng một request và không dùng kết quả job này cho job khác.
- File đã sửa: `Python/controllers/analysis_controller.py`, `Python/controllers/skills_controller.py`.
- Kiểm thử: `venv/Scripts/python.exe -m compileall -q controllers services tests main.py` đạt; Python unittest `36/36` đạt.
- Hạn chế: cần khởi động lại Python service mới để thay đổi có hiệu lực; Gemini API vẫn có giới hạn quota/độ trễ riêng, nên chạy song song không đảm bảo hai kết quả hoàn tất cùng lúc.

### 2026-08-20 — P0-03 — Lịch sử trạng thái và thống kê trong ngày

- Trạng thái: `ĐANG LÀM`; đã hoàn thành nền tảng, build local và áp dụng migration vào database phát triển; chưa nghiệm thu API/UI runtime.
- Mục tiêu/phạm vi: lưu sự kiện chuyển trạng thái hồ sơ và làm cho số liệu “hôm nay” trên dashboard HR/Admin dựa trên sự kiện theo múi giờ Việt Nam, thay vì suy ra từ trạng thái cuối hoặc ngày của máy chủ.
- Quyết định nghiệp vụ/kỹ thuật: sự kiện lưu `ChangedAtUtc`; ranh giới ngày được đổi từ `Asia/Ho_Chi_Minh`/`SE Asia Standard Time` sang UTC; không tính sự kiện tạo hồ sơ là một lần chuyển trạng thái; dữ liệu cũ chỉ backfill sự kiện `Applied` có thể chứng minh từ `AppliedAt`, không bịa lại các lần chuyển trạng thái đã mất.
- File đã thêm/sửa: thêm model `ApplicationStatusHistory`, helper `VietnamTimeService`, migration `20260819200603_AddApplicationStatusHistory`; cập nhật `AppDbContext`, các luồng nộp hồ sơ/đổi trạng thái/từ chối/tạo-hủy lịch phỏng vấn, `DashboardService` và dashboard HR/Admin frontend.
- API/database/migration/config: response `Dashboard/hr-stats` và Admin dashboard bổ sung `quickMetrics.applicationsToday`, `quickMetrics.statusChangesToday`; migration tạo bảng lịch sử cùng hai index phục vụ truy vấn theo hồ sơ/ngày/trạng thái và đã áp dụng thành công vào database phát triển.
- Kiểm thử đã chạy và kết quả: backend Release build đạt 0 lỗi; frontend production build đạt; sinh migration SQL thành công tại file local bị Git ignore. Debug build ban đầu không thể ghi đè executable vì backend local đang chạy, không phải lỗi biên dịch.
- Git/commit: thay đổi local, chưa commit/push; giữ nguyên các thay đổi không liên quan có sẵn.
- VPS/deploy/smoke test: chưa deploy.
- Hạn chế/lỗi còn lại: backend đang chạy là binary cũ nên chưa thể nghiệm thu API mới nếu chưa khởi động lại; chưa chạy testcase runtime để xác nhận sự kiện được ghi đúng trong giao dịch và số liệu qua mốc 00:00 giờ Việt Nam.
- Bước tiếp theo: khởi động lại backend bằng code mới, test đủ bốn luồng trạng thái và dashboard theo quyền HR/Admin, sau đó mới đánh dấu `ĐÃ XONG`.
- Điều chỉnh UX sau phản hồi: dashboard HR không còn xếp tám KPI ngang hàng. Bốn KPI tổng quan dùng lưới 4/2/1 cột tùy màn hình; bốn số hoạt động (CV hôm nay, chuyển trạng thái hôm nay, lượt xem, tỷ lệ ứng tuyển) được gom vào một khối phụ responsive để tránh tràn và giữ thứ bậc thông tin.
- Bộ lọc HR bổ sung khoảng thời gian 7 ngày/30 ngày/3 tháng/12 tháng/toàn bộ, kết hợp với lĩnh vực và tin tuyển dụng; backend dùng thời gian Việt Nam khi tạo mốc lọc. Bộ lọc Admin bổ sung preset Hôm nay/7 ngày/30 ngày bên cạnh tuần/tháng/năm.
- Đính chính chỉ số: bỏ fallback giả `12.5 ngày`; khi chưa có lịch phỏng vấn hiển thị 0 và đổi nhãn chính xác thành `Thời gian đến lịch phỏng vấn TB`, vì phép tính hiện tại chưa phải thời gian tuyển đến trạng thái Hired.
- Kiểm thử sau điều chỉnh UX: frontend production build đạt; backend Release build đạt 0 lỗi. Cảnh báo chunk frontend và nullable backend là cảnh báo đã tồn tại.
- Điều chỉnh bổ sung dashboard Admin: thay hai KPI hôm nay rời rạc bằng một khối `Hoạt động tuyển dụng hôm nay` gồm hai cột responsive; bộ lọc có hàng nút chọn nhanh Hôm nay/7 ngày/30 ngày/Tháng này/Toàn bộ luôn nhìn thấy, không buộc Admin phải mở popup lịch mới thấy preset. Frontend production build sau thay đổi đạt.
- Đính chính UX bộ lọc Admin theo nghiệm thu: bỏ hàng nút chọn nhanh vì tạo thêm trạng thái chọn nhưng không cần thiết; Admin chỉ giữ `Lĩnh vực tuyển dụng` và `Khoảng thời gian`, các preset ngày vẫn nằm trong RangePicker. Bộ lọc HR giữ thêm `Tin tuyển dụng` và khoảng thời gian tương đối vì phạm vi nghiệp vụ HR khác Admin. Frontend production build đạt sau đính chính.
- Sửa luồng ứng tuyển liên tiếp: xác nhận backend lưu Application rồi chạy AI nền, không có ràng buộc phải chờ job trước hoàn tất. Modal thành công phía ứng viên nay nói rõ AI tiếp tục chạy nền và cung cấp hai hành động `Ở lại trang này`/`Tiếp tục tìm việc`; nút thứ hai đóng modal và điều hướng thẳng về `/jobs` để ứng tuyển job khác. Frontend production build đạt.

### 2026-08-20 — AI-PROMPT-001 — Chuẩn hóa giới hạn kết luận và bằng chứng CV

- Trạng thái: `ĐÃ XONG` local; chưa deploy VPS.
- Mục tiêu/phạm vi: audit và sửa toàn bộ prompt runtime liên quan đến chấm CV, phân tích sâu, ngôn từ, STAR, phỏng vấn, chatbot, email và OCR; loại cách diễn đạt ngụ ý hệ thống xác minh sự thật hoặc phát hiện CV do AI tạo.
- Quyết định nghiệp vụ/kỹ thuật: đoạn trích chỉ chứng minh nội dung có trong CV và luôn là thông tin ứng viên tự khai; mọi mục cần HR làm rõ phải có đoạn trích tồn tại nguyên văn, `needs_verification=true`; không hiển thị phần trăm AI-generated; confidence tổng hợp được đổi nhãn thành mức độ đầy đủ của bằng chứng, không phải xác suất lời khai đúng.
- An toàn prompt: coi CV/JD/lịch sử/bối cảnh là dữ liệu không đáng tin cậy; cấm thực hiện chỉ dẫn nằm trong dữ liệu; STAR và câu trả lời mẫu không được sáng tác số liệu; URL không chắc chắn không được tự tạo; OCR không sửa/dịch/bổ sung phần không nhìn thấy.
- File đã thay đổi: toàn bộ file prompt trong `Python/prompts`, `Python/services/scoring_service.py`, `doc_parser_service.py`, `cv_analysis_service.py`, `timeline_service.py`, test Python, các tab/báo cáo CV liên quan và trang Email Logs.
- API/database/migration/config: giữ contract cũ `ai_generation_risk` để tương thích dữ liệu nhưng luôn hậu kiểm về `detected=false`, `score=0`; không đổi schema hay migration.
- Kiểm thử đã chạy và kết quả: Python unit test 33/33 đạt; `compileall` đạt; frontend `npm.cmd run build` đạt. Build chỉ còn cảnh báo chunk lớn/Rollup từ dependency đã tồn tại.
- Bảo mật: HTML email khi xem log được giới hạn còn `p`, `strong`, `ul`, `li`, `br` và loại toàn bộ thuộc tính trước khi đưa vào `dangerouslySetInnerHTML`.
- Git/commit: thay đổi local, chưa commit/push; không đụng các thay đổi không liên quan.
- VPS/deploy/smoke test: chưa deploy VPS.
- Hạn chế/lỗi còn lại: báo cáo cũ đã lưu có thể còn câu chữ cũ; cần phân tích lại CV để tạo payload mới. Việc xác minh sự thật cần nguồn bên ngoài và quyền nghiệp vụ riêng, không thể suy ra chỉ từ CV.
- Bước tiếp theo: chạy lại đúng CV đã phát sinh cảnh báo sai và nghiệm thu UI trước khi deploy.
- Đính chính theo phản hồi người dùng: giữ nguyên tên tính năng `Ngôn từ & Chân thực` trên UI/PDF; chỉ thay đổi giới hạn kết luận bên trong, không đổi tên sản phẩm.
- Sửa phân loại OCR sau nghiệm thu: đoạn ký tự hỏng có tồn tại trong text extraction không phải bằng chứng về lỗi của ứng viên. Mọi cảnh báo font/OCR/mã hóa/quét tệp luôn bị loại khỏi red flag ứng viên; UI hiển thị cảnh báo kỹ thuật riêng và bỏ qua đánh giá ngôn từ khi nguồn là OCR/partial. Test hồi quy với chuỗi OCR lỗi đạt; tổng Python 34/34 và frontend production build đạt.
- Đính chính lần 2 sau kiểm tra runtime: nguyên nhân OCR tiếng Việt local là Tesseract chỉ có `eng, osd`, thiếu `vie`; việc khóa tab cho mọi nguồn OCR là không đúng mục tiêu hệ thống. Đã cài `vie.traineddata` vào `.local/tessdata`, xác nhận runtime chọn `vie+eng`, bỏ fallback ngầm sang `eng`, khôi phục tab Ngôn từ cho OCR high/partial và chỉ hiện cảnh báo extraction khi thực sự partial/có warning. Unit test tăng lên 35/35; smoke ba ảnh corpus chạy bằng `vie+eng` thành công, nhưng bố cục hai cột/ảnh nghiêng vẫn có thể đảo thứ tự từ và tiếp tục cần cải thiện layout OCR.
- Bổ sung nền tảng layout OCR: ước lượng deskew bằng projection profile, không xoay khi lệch dưới 1 độ; phát hiện khoảng chia cột từ bounding box và sắp khối theo từng cột. Test thứ tự hai cột đạt, tổng unit test 36/36. Smoke cho thấy ảnh nghiêng được hiệu chỉnh khoảng -2 độ và tiếng Việt tốt hơn, nhưng Tesseract vẫn có thể phân mảnh dòng trên ảnh hai cột; bước tiếp theo bắt buộc là OCR theo vùng/crop từng cột thay vì chỉ sắp lại block toàn trang.

### 2026-08-20 — P0-02-FIX — Hậu kiểm cảnh báo mốc thời gian và lỗi OCR

- Trạng thái: `ĐÃ XONG` local; chưa deploy VPS.
- Mục tiêu/phạm vi: sửa cảnh báo sai khi CV có mốc năm 2026 trong lúc ngày phân tích là 20/08/2026; không để AI tự kết luận mốc tương lai hoặc lỗi font/OCR nghiêm trọng khi thiếu bằng chứng.
- Quyết định nghiệp vụ/kỹ thuật: prompt nhận ngày hiện tại; chỉ tháng/năm cụ thể sau ngày phân tích mới là tương lai; mốc chỉ ghi năm hiện tại được quy đổi đến tháng hiện tại và gắn `needs_verification`; red flag AI được hậu kiểm bằng nội dung CV và `extraction_quality`.
- File đã thay đổi: `Python/prompts/scoring_prompts.py`, `Python/services/timeline_service.py`, `Python/services/scoring_service.py`, `Python/services/cv_analysis_service.py`, hai file test, `PROJECT_CONTEXT.md`, `WORK_LOG.md`.
- API/database/migration/config: không đổi URL API, DTO hay schema; không có migration.
- Kiểm thử đã chạy và kết quả: `Python/venv/Scripts/python.exe -m unittest discover -s tests -v` đạt 31/31; có thêm test mốc `2022 - 2026` tại ngày 20/08/2026, cảnh báo kết hợp tương lai/OCR không bằng chứng và mốc tháng 10/2026 thực sự ở tương lai.
- Git/commit: thay đổi local, chưa commit/push; giữ nguyên các thay đổi không liên quan đang có.
- VPS/deploy/smoke test: chưa deploy VPS.
- Hạn chế/lỗi còn lại: kết quả phân tích cũ đã lưu/cache không tự thay đổi; cần chạy phân tích lại CV để nhận báo cáo đã hậu kiểm.
- Bước tiếp theo: nghiệm thu lại đúng CV phát sinh lỗi; sau đó deploy và smoke test nếu kết quả local đạt yêu cầu.

### 2026-08-20 — P0-02 — Phân tích CV đa bố cục và chuẩn hóa timeline (giai đoạn nền tảng)

- Trạng thái: `ĐÃ XONG` cho pipeline nền tảng local; chưa deploy VPS.
- Mục tiêu: bỏ cách đọc phụ thuộc template; hỗ trợ PDF/DOCX/ảnh scan/CV Builder bằng nhiều chiến lược, giữ khối bố cục, đánh giá chất lượng và chuẩn hóa kinh nghiệm theo tháng.
- Pipeline tài liệu: chạy PyPDF2, pdfplumber plain/layout/word blocks; DOCX đọc cả paragraph và table row; ảnh/PDF scan thử Tesseract PSM 4/6/11 có bounding box; chọn kết quả theo quality score và giữ phương án thay thế/cảnh báo.
- CV Builder: tiếp tục dùng text có cấu trúc từ JSON với chất lượng 100%, không OCR ngược snapshot PDF.
- Chuẩn hóa nội dung: nhận diện section Việt/Anh và tiêu đề nghề nghiệp custom; mục lạ được giữ dưới `other`, không bỏ dữ liệu.
- Timeline: hỗ trợ tháng/năm, chỉ năm, tên tháng tiếng Anh, `nay/present`; loại khoảng chồng lặp; tính tổng tháng và tháng theo kỹ năng; gap từ 3 tháng chỉ là thông tin cần làm rõ.
- Tiêu chí: `TOTAL_EXPERIENCE` và `SKILL_EXPERIENCE` lấy số tháng từ timeline cục bộ thay vì để LLM tự cộng; trả evidence, confidence, extracted value và tính lại điểm tổng.
- UI: tab Năng lực hiển thị tổng kinh nghiệm không cộng trùng, thời lượng theo kỹ năng và gap với cảnh báo trung tính.
- Phiên bản báo cáo nâng lên `analysis_version=4` để kết quả cũ được phép hoàn tất lại bằng pipeline mới.
- File mới: `Python/services/document_layout_service.py`, `timeline_service.py`, `section_segmentation_service.py`, `benchmark_layout_extraction.py` và test tương ứng.
- Kiểm thử: Python 25/25 test đạt; frontend production build đạt; backend build ra thư mục kiểm chứng đạt 0 lỗi.
- Benchmark smoke: 15/15 PDF mock đọc được chất lượng cao và giữ 49–51 block/tệp; 6/6 DOCX demo đọc được chất lượng cao và giữ 22–33 logical block/tệp.
- Hạn chế: benchmark hiện chứng minh extraction trên dữ liệu có sẵn, chưa phải độ chính xác có nhãn cho mọi CV infographic/scan xấu; cần xây corpus 20–50 CV biến thể đã ẩn danh và chấm ground truth theo từng trường.
- Bước tiếp theo: nghiệm thu local bằng CV Quốc Bảo và một CV custom/scan; sau đó bổ sung dashboard kiểm thử extraction theo corpus và mở rộng quan hệ block cho infographic phức tạp.

### 2026-08-20 — P0-01 — Tiêu chí đánh giá có cấu trúc (đang nghiệm thu giao diện)

- Trạng thái: `ĐANG LÀM`.
- Bổ sung nhóm tiêu chí động: bảng `CriterionGroups`, dữ liệu mặc định, API Admin thêm/sửa/ẩn và tab `Nhóm tiêu chí` trong `Danh mục tuyển dụng`.
- Form tạo/sửa tin lấy nhóm tiêu chí từ database; danh mục được đồng bộ qua sự kiện SignalR `MetadataChanged` và tải lại khi cửa sổ được focus. Việc tải danh mục nền không gọi lại API chi tiết tin nên không ghi đè form.
- Form tự lưu bản nháp vào `localStorage` sau 350 ms, phục hồi ngày tháng và toàn bộ danh sách tiêu chí sau F5, xóa bản nháp sau khi gửi tin thành công.
- Khôi phục bản nháp chạy im lặng, không hiện toast làm gián đoạn HR. `JobCriterion.CriterionGroupId` lưu đúng nhóm Admin đã tạo thay vì chỉ lưu loại kỹ thuật chung.
- Các CRUD lĩnh vực, vị trí, cấp bậc, chi nhánh và nhóm tiêu chí đều phát sự kiện thay đổi metadata.
- Migration `20260819171808_AddCriterionGroups` đã được áp dụng vào database phát triển; script kiểm tra chỉ tạo bảng nhóm tiêu chí, không lặp lại các cột tiêu chí có cấu trúc.
- Migration `20260819172253_AddCriterionGroupReference` đã được áp dụng vào database phát triển.
- Kiểm tra: frontend production build thành công; backend Release build thành công; migration database thành công.
- Tạo bộ nghiệm thu tin DevOps gồm hai CV DOCX hợp lệ: một hồ sơ DevOps trên 3 năm có Docker/CI-CD/Linux/AWS/Kubernetes và một hồ sơ thiết kế đồ họa không phù hợp. Kèm tài liệu hai tài khoản demo tại `TAI_LIEU_DEMO_PHAN_BIEN/05_TAI_KHOAN_VA_CV_DEMO_DEVOPS.txt`.
- Phạm vi đã triển khai: entity/request/migration JobCriterion; form HR cơ bản và thiết lập nâng cao; contract backend → Python; kết quả tiêu chí có mức đáp ứng, confidence, bằng chứng và cờ HR xác minh.
- Migration: `20260819164437_AddStructuredJobCriteria`; tiêu chí cũ được backfill `CUSTOM/PREFERRED/EXISTS`, nguồn bằng chứng mặc định, `IsActive=true`, `TargetValue=Name`.
- Kiểm soát AI: prompt cấm sáng tác bằng chứng; Python chỉ giữ đoạn trích nếu tồn tại trong text CV, nếu không sẽ xóa bằng chứng và bật `needs_verification`.
- Kiểm thử: .NET build 0 lỗi; React production build thành công; Python 10/10 test đạt trước lần bổ sung validation cấu trúc cuối, cần chạy lại toàn bộ sau khi người dùng nghiệm thu UI.
- Môi trường đang chạy: frontend `http://localhost:5173`, backend `http://localhost:5286`, Python `http://127.0.0.1:8000`.
- Lưu ý database: cấu hình Development trỏ tới SQL Server từ xa `db43261.public.databaseasp.net`, không phải LocalDB; backend startup đã xác nhận database này có migration mới. Chưa deploy container/VPS.
- Bước tiếp theo: người dùng xem `/recruiter/jobs/create`; chỉnh UX theo phản hồi, chạy lại build/test và test create/edit API trước khi đánh dấu hoàn thành.
- Phản hồi UI lần 1: đã xóa đoạn giải thích dài phía trên danh sách; đổi “Thiết lập đánh giá nâng cao” thành “Cấu hình cách chấm tiêu chí”; đổi nhãn `Giá trị yêu cầu` thành nhãn động theo loại (`Kỹ năng cần tìm`, `Chứng chỉ cần có`, `Nội dung AI cần tìm`...); bổ sung tooltip rằng có thể bỏ trống để dùng tên tiêu chí. React production build sau thay đổi thành công.
- Phản hồi UI lần 2: nhận thấy các trường cấu hình AI vẫn quá kỹ thuật. Đã đổi `Loại tiêu chí` thành `Nhóm đánh giá`, `Điều kiện` thành `Yêu cầu đạt`; loại khỏi UI `Nội dung AI cần tìm` và `Tìm bằng chứng trong` vì hệ thống có thể suy ra từ tên/nhóm; đổi hướng dẫn thành `Mô tả tiêu chí (không bắt buộc)`. React production build tiếp tục thành công.

### 2026-08-19 — P0-00 — Tổ chức module Python giai đoạn 1

- Trạng thái: `ĐÃ XONG`.
- Mục tiêu: giúp truy vết code khi vấn đáp và tạo nền an toàn trước khi mở rộng tiêu chí ở `P0-01`.
- Khảo sát: xác định toàn bộ FastAPI router, hàm/service, import nội bộ và 11 nhóm endpoint mà ASP.NET Core đang gọi; xác nhận `cv_analysis_service` và `scoring_service` đang gộp nhiều trách nhiệm.
- Quyết định: chưa di chuyển hàng loạt code runtime; giữ nguyên URL API, tách phần validation lặp trước và lập tài liệu tra cứu đầy đủ.
- File thay đổi: `Python/README.md`, `Python/controllers/analysis_controller.py`, `Python/services/cv_analysis_service.py`.
- File thêm: `Python/services/criterion_validation_service.py`, `Python/tests/__init__.py`, `Python/tests/test_criterion_validation_service.py`.
- Thay đổi hành vi: `/score-cv` và `/score-cv-text` dùng chung một validation; vẫn nhận tiêu chí cũ `name/weight`, đồng thời bảo toàn các trường cấu trúc mở rộng cho task tiếp theo.
- Dọn code: loại import `pdf_extractor` không sử dụng; chưa xóa file cũ vì cần một task dọn legacy riêng sau contract test.
- Kiểm thử: `python -m unittest discover -s tests -v` đạt 8/8; `python -m compileall -q controllers services tests main.py` thành công; import `main.app` thành công và đăng ký 25 route.
- API/database/migration: không đổi URL, không đổi schema, không có migration.
- Git/VPS: chưa commit, chưa push, chưa deploy.
- Hạn chế: chưa có contract test cho response chấm CV/preview; chưa tách các service lớn; chưa chuẩn hóa vị trí JSON runtime. Khi import có cảnh báo model `en_core_web_sm 3.8.0` đang chạy với spaCy `3.7.4`, cần đồng bộ phiên bản trong task dependency riêng để tránh suy giảm NLP.
- Bước tiếp theo: audit entity/DTO/form hiện tại và triển khai `P0-01` theo chiều database → backend → frontend → Python.

### 2026-08-19 — CLEAN-001 — Dọn artefact và chuẩn hóa thư mục gốc

- Trạng thái: `ĐÃ XONG`.
- Mục tiêu: loại file tạm có thể tái tạo khỏi root nhưng bảo toàn source code, tài liệu khóa luận, UML, dữ liệu kiểm thử và các thay đổi chưa commit của người dùng.
- Quyết định: giữ nguyên `SO_DO_UML_THAM_KHAO`, `TAI_LIEU_DEMO_PHAN_BIEN`, `TaiLieuBaoCao`, `TaiLieuThamKhao` và `tools` vì các script đang tham chiếu đường dẫn tương đối; không di chuyển tùy tiện.
- Đã xóa: năm thư mục giải nén/audit Word, ba output build tạm ở root, output build lặp trong backend, sáu log local, log/kết quả JMeter lặp ở root và file `resume` rỗng.
- Dung lượng artefact đã loại bỏ: xấp xỉ 187 MB, chưa tính log nhỏ.
- File thay đổi: `.gitignore`, `WORK_LOG.md`; chuyển public deploy key vào `.local/ssh/`; script tạo CV demo được tổ chức lại vào `tools/`.
- Bảo mật: `.local/` và `.codex_vps_deploy_*` đã được Git ignore. Private deploy key ở root bị ACL Windows từ chối di chuyển ngay cả với quyền nâng cao; không đổi ACL hoặc xóa cưỡng bức để tránh mất quyền triển khai.
- API/database/config: không thay đổi runtime; `.gitignore` chỉ bổ sung mẫu artefact local.
- Kiểm thử: xác nhận toàn bộ target xóa không còn tồn tại; kiểm tra lại root và Git status; các thay đổi source có sẵn không bị sửa.
- Git/VPS: chưa commit, chưa push, chưa deploy.
- Bước tiếp theo: khi không còn cần khóa deploy cũ, xóa hoặc chuyển nó bằng tài khoản Windows sở hữu file; tiếp tục `P0-01` sau khi người dùng yêu cầu.

### 2026-08-19 — DOC-001 — Khởi tạo bộ nhớ dự án

- Trạng thái: `ĐÃ XONG`.
- Mục tiêu: tạo ngữ cảnh bền vững và quy tắc ghi nhận công việc giữa nhiều phiên chat.
- Quyết định: dùng ba lớp tài liệu: `AGENTS.md` cho quy tắc, `PROJECT_CONTEXT.md` cho kiến trúc/backlog/quyết định, `WORK_LOG.md` cho bằng chứng thực thi.
- File thêm: `AGENTS.md`, `PROJECT_CONTEXT.md`, `WORK_LOG.md`.
- API/database/config: không thay đổi.
- Kiểm thử: kiểm tra project trước đó chưa có ba file cùng tên; cần đọc lại nội dung và kiểm tra Git diff sau khi tạo.
- Git/VPS: chưa commit, chưa push, chưa deploy.
- Bảo mật: không sao chép credential đã xuất hiện trong lịch sử trò chuyện; mọi dữ liệu nhạy cảm phải được che.
- Bước tiếp theo: khảo sát code/schema hiện tại cho `P0-01` và chốt migration tương thích ngược trước khi triển khai tiêu chí có cấu trúc.

## Mẫu mục nhật ký mới

### YYYY-MM-DD HH:mm — TASK-ID — Tên công việc

- Trạng thái: `CHƯA LÀM | ĐANG LÀM | ĐÃ XONG | BỊ CHẶN | TẠM HOÃN`.
- Mục tiêu/phạm vi:
- Quyết định nghiệp vụ/kỹ thuật:
- File đã thay đổi:
- API/database/migration/config:
- Kiểm thử đã chạy và kết quả:
- Git/commit:
- VPS/deploy/smoke test:
- Hạn chế/lỗi còn lại:
- Bước tiếp theo:
### 2026-08-20 — CV Builder — Mở rộng thư viện mẫu CV

- Trạng thái: `ĐÃ XONG` local; chưa deploy VPS.
- Nâng số mẫu CV trực tuyến từ 3 lên 12: Tiêu chuẩn, Hiện đại, Thanh lịch, Tối giản, Doanh nghiệp, Công nghệ, Quản lý, Học thuật, Sinh viên, Gọn một trang, Dòng thời gian và Sáng tạo.
- Bộ chọn mẫu đổi thành thư viện thẻ có hình mô phỏng bố cục và mô tả mục đích sử dụng.
- Các nhóm bố cục được triển khai riêng: một cột, thanh bên, hai cột, timeline, quản lý và học thuật; vẫn hỗ trợ đổi màu, font, cỡ chữ, thứ tự mục và khung.
- Việc lưu tài khoản không cần migration vì mã mẫu nằm trong JSON `Settings`. Luồng tải PDF và tạo snapshot ứng tuyển dùng cùng component xem trước nên giữ đúng mẫu đã chọn.
- Kiểm tra: `npm.cmd run build` thành công (TypeScript và Vite production build).
- Điều chỉnh sau nghiệm thu: thư viện mẫu được chuyển vào modal `Đổi mẫu`, trang chính chỉ hiển thị mẫu đang dùng.
- Bổ sung mẫu `Tự thiết kế`: chọn một cột/hai cột/thanh bên, chỉnh tỷ lệ cột và chọn các mục đặt ở cột phụ. Cấu hình vẫn được lưu trong JSON Settings.
- Các mục kinh nghiệm/dự án/học vấn được đặt quy tắc tránh ngắt giữa một mục khi PDF tự phân trang; nội dung dài có thể tạo nhiều trang A4.
- Bổ sung tùy chỉnh trình bày: ảnh đại diện được kiểm tra định dạng/kích thước và nén tối đa 512 px, chỉnh kích thước/kiểu/vị trí ảnh, bật tắt icon liên hệ, ẩn hiện mục và kéo thả thứ tự mục.
- Ảnh được giữ trong JSON nội dung CV để dựng và xuất PDF snapshot; chưa dùng Cloudinary cho ảnh CV Builder. SQL dùng `nvarchar(max)` và controller giới hạn tổng nội dung 500.000 ký tự.
- Bảo vệ pipeline AI: frontend chỉ dựng structured text từ trường nghiệp vụ; backend `ApplicationService.BuildCvBuilderText` bỏ qua `avatarDataUrl`/`imageDataUrl`, không gửi base64 hoặc dữ liệu trình bày sang Python.
- Kiểm tra sau thay đổi: frontend production build thành công; backend build thành công với 0 lỗi (các cảnh báo nullable/migration đã tồn tại từ trước).
### 2026-08-20 — P0-02 — Kiểm thử corpus CV đa bố cục

- Trạng thái: `ĐÃ XONG` local; chưa deploy VPS.
- Tạo corpus có ground truth gồm 15 mẫu tại `Python/test_data/cv_layout_corpus`: PDF một/hai cột, nhiều trang, Việt/Anh/song ngữ, timeline chồng lắp, heading custom, DOCX một/nhiều bảng, ảnh rõ/hai cột/nghiêng-nhiễu, PDF scan và PDF dày nội dung.
- Kết quả corpus: 15/15 trích xuất sử dụng được; email đúng 14/15; số điện thoại đúng 15/15; trung vị 66,01 ms; lớn nhất 1.923,59 ms (PDF scan OCR). Ảnh nghiêng/nhiễu được giữ mức `partial`, không tự đoán sửa email.
- Kiểm thử tải riêng 1.000 PDF synthetic: 1.000/1.000 usable/high; p50 55,29 ms; p95 81,21 ms; max 182,75 ms; tổng 57,88 giây. Đây chỉ là trích xuất cục bộ, không gồm Gemini.
- Bug đã sửa trong quá trình kiểm thử:
  - Tesseract tự phát hiện language pack và fallback `eng` khi máy thiếu `vie`, thay vì ép `vie+eng` rồi lỗi toàn bộ ảnh.
  - PDF scan fallback sang `pypdfium2` khi máy thiếu Poppler/pdftoppm.
  - Log Unicode không còn làm chết request trên console Windows cp1258.
  - Section parser hiểu dòng bảng DOCX dạng `TIÊU ĐỀ | nội dung`.
  - Timeline nhận cặp `MM/YYYY MM/YYYY` nghiêm ngặt khi OCR làm mất dấu phân cách.
- Regression: 28/28 unit test Python đạt; compileall đạt.
- Báo cáo chi tiết: `Python/test_data/cv_layout_corpus/AUDIT_REPORT.md`; dữ liệu máy đọc: `audit_results.json`.
