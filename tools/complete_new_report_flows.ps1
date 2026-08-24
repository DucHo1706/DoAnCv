param(
    [string]$Source = "D:\KhoaLuan\BAOCAOKHOALUAN.docx",
    [string]$Output = "D:\KhoaLuan\BAOCAOKHOALUAN_BO_SUNG_DAC_TA_VA_FLOW.docx"
)

$ErrorActionPreference = 'Stop'
$build = 'D:\KhoaLuan\.report_new_flows_build'
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path $build) { Remove-Item $build -Recurse -Force }
[IO.Compression.ZipFile]::ExtractToDirectory($Source, $build)
$documentPath = Join-Path $build 'word\document.xml'
$document = New-Object Xml.XmlDocument
$document.PreserveWhitespace = $true
$document.Load($documentPath)
$w = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
$ns = New-Object Xml.XmlNamespaceManager($document.NameTable)
$ns.AddNamespace('w', $w)
$body = $document.SelectSingleNode('//w:body', $ns)

function Text($node) { (($node.SelectNodes('.//w:t', $ns) | ForEach-Object { $_.InnerText }) -join '').Trim() }
function FindP([string]$value) { $document.SelectNodes('//w:body/w:p', $ns) | Where-Object { (Text $_) -eq $value } | Select-Object -First 1 }
function Paragraph([string]$value, [string]$style = 'Normal', [bool]$bold = $false, [bool]$italic = $false) {
    $p = $document.CreateElement('w', 'p', $w)
    $pPr = $document.CreateElement('w', 'pPr', $w)
    if ($style) { $s = $document.CreateElement('w', 'pStyle', $w); [void]$s.SetAttribute('val', $w, $style); [void]$pPr.AppendChild($s) }
    [void]$p.AppendChild($pPr)
    $r = $document.CreateElement('w', 'r', $w)
    if ($bold -or $italic) { $rp = $document.CreateElement('w', 'rPr', $w); if ($bold) {[void]$rp.AppendChild($document.CreateElement('w','b',$w))}; if ($italic) {[void]$rp.AppendChild($document.CreateElement('w','i',$w))}; [void]$r.AppendChild($rp) }
    $t = $document.CreateElement('w', 't', $w); $t.InnerText = $value; [void]$r.AppendChild($t); [void]$p.AppendChild($r)
    $p
}
function Cell([string]$value, [bool]$bold = $false) {
    $tc = $document.CreateElement('w', 'tc', $w)
    $tcPr = $document.CreateElement('w', 'tcPr', $w)
    $tcW = $document.CreateElement('w', 'tcW', $w); [void]$tcW.SetAttribute('w', $w, '0'); [void]$tcW.SetAttribute('type', $w, 'auto'); [void]$tcPr.AppendChild($tcW); [void]$tc.AppendChild($tcPr)
    [void]$tc.AppendChild((Paragraph $value 'Normal' $bold $false)); $tc
}
function SpecTable([object[]]$rows) {
    $tbl = $document.CreateElement('w', 'tbl', $w)
    $pr = $document.CreateElement('w', 'tblPr', $w)
    $style = $document.CreateElement('w', 'tblStyle', $w); [void]$style.SetAttribute('val', $w, 'TableGrid'); [void]$pr.AppendChild($style)
    $width = $document.CreateElement('w', 'tblW', $w); [void]$width.SetAttribute('w', $w, '0'); [void]$width.SetAttribute('type', $w, 'auto'); [void]$pr.AppendChild($width); [void]$tbl.AppendChild($pr)
    foreach ($row in $rows) { $tr = $document.CreateElement('w', 'tr', $w); [void]$tr.AppendChild((Cell ([string]$row[0]) $true)); [void]$tr.AppendChild((Cell ([string]$row[1]) $false)); [void]$tbl.AppendChild($tr) }
    $tbl
}
function InsertBefore([string]$target, [object[]]$nodes) { $p = FindP $target; if(-not $p){throw "Không tìm thấy $target"}; foreach($n in $nodes){[void]$body.InsertBefore($n,$p)} }
function H3($v){Paragraph $v 'Heading3'}; function H4($v){Paragraph $v 'Heading4'}; function P($v){Paragraph $v}; function Fig($v){Paragraph "[VỊ TRÍ CHÈN HÌNH] $v" 'Normal' $true}; function Src(){Paragraph 'Nguồn: Tác giả tự xây dựng.' 'Normal' $false $true}

$specs = @(
    @{ Code='UC-01'; Name='Tạo tin tuyển dụng và thiết lập tiêu chí đánh giá'; Goal='Cho phép nhà tuyển dụng tạo JD, cấu hình tiêu chí ASK có trọng số và gửi quản trị viên kiểm duyệt trước khi công khai.'; Actor='Tác nhân chính: Nhà tuyển dụng. Tác nhân liên quan: Quản trị viên. Tác nhân hỗ trợ: NotificationService và AuditLog.'; Pre='1) Nhà tuyển dụng đã đăng nhập bằng tài khoản Active. 2) Hồ sơ Recruiter tồn tại. 3) Recruiter được phân công ít nhất một chi nhánh. 4) Category, Position, JobLevel và Branch đã được Admin cấu hình và đang hoạt động.'; Trigger='Nhà tuyển dụng chọn chức năng Tạo tin tuyển dụng từ trang quản lý tin.'; Main='1) Hệ thống tải danh mục và các chi nhánh thuộc quyền Recruiter. 2) Recruiter nhập tiêu đề, mô tả, yêu cầu, quyền lợi, số lượng, lương và hạn nộp. 3) Recruiter chọn lĩnh vực, vị trí, cấp bậc, chi nhánh. 4) Recruiter tạo các tiêu chí ASK, khai báo mô tả, trọng số và mức bắt buộc. 5) Frontend kiểm tra trường bắt buộc và hiển thị tổng trọng số. 6) Backend xác thực lại tài khoản, quyền chi nhánh, thời hạn, khoảng lương và bộ tiêu chí. 7) Backend bắt đầu giao dịch, lưu JobPosting ở trạng thái Pending và lưu toàn bộ JobCriteria. 8) Backend commit, ghi AuditLog và gửi thông báo cho Admin. 9) Admin mở trang chi tiết để xem đầy đủ JD và tiêu chí. 10) Admin phê duyệt hoặc từ chối kèm lý do. 11) Backend cập nhật Published/Rejected, người duyệt, thời điểm và lý do. 12) Hệ thống ghi AuditLog, thông báo Recruiter; tin Published được đưa vào danh sách công khai.'; Alt='A1) Thiếu dữ liệu hoặc hạn nộp không hợp lệ: frontend yêu cầu sửa. A2) Tổng trọng số hoặc tiêu chí không hợp lệ: backend từ chối lưu. A3) Chọn chi nhánh ngoài quyền: trả 403. A4) Lỗi khi lưu tiêu chí: rollback cả JobPosting và JobCriteria. A5) Admin từ chối: bắt buộc nhập lý do, tin chuyển Rejected và không công khai. A6) Gửi thông báo lỗi: giữ kết quả nghiệp vụ đã commit và ghi log để xử lý lại.'; Post='Thành công tạo: JobPosting và JobCriteria được lưu nhất quán ở Pending. Phê duyệt: tin chuyển Published và công khai. Từ chối: tin chuyển Rejected, lưu lý do và có thể được Recruiter chỉnh sửa/gửi lại. Mọi quyết định đều có AuditLog.' },
    @{ Code='UC-02'; Name='Nộp hồ sơ ứng tuyển và đánh giá CV bằng AI'; Goal='Tiếp nhận CV cho một tin tuyển dụng và khởi tạo đánh giá mức độ phù hợp.'; Actor='Ứng viên; AI Service và dịch vụ lưu trữ là tác nhân hỗ trợ.'; Pre='Ứng viên đã đăng nhập; tin đang hoạt động; chưa nộp trùng.'; Trigger='Ứng viên chọn Ứng tuyển tại trang chi tiết việc làm.'; Main='1) Chọn CV mặc định, CV đã lưu hoặc tệp mới; 2) kiểm tra loại và nội dung tệp; 3) lưu CandidateCV và Application; 4) trả trạng thái tiếp nhận; 5) xử lý trích xuất/OCR; 6) chấm điểm và giải thích; 7) lưu AIEvaluation; 8) thông báo kết quả.'; Alt='Tệp giả mạo/không phải CV, nộp trùng, OCR không đủ dữ liệu hoặc AI_ERROR.'; Post='Hồ sơ được lưu; trạng thái đánh giá phản ánh đúng thành công, không đủ dữ liệu hoặc lỗi AI.' },
    @{ Code='UC-03'; Name='Xếp hạng và so sánh ứng viên'; Goal='Hỗ trợ HR lọc, xếp hạng và đối chiếu hồ sơ theo FitScore và tiêu chí.'; Actor='Nhà tuyển dụng.'; Pre='HR có quyền với tin; tin có hồ sơ; kết quả AI đã sẵn sàng đối với hồ sơ cần so sánh.'; Trigger='HR chọn một chiến dịch tuyển dụng.'; Main='1) Tải danh sách; 2) lọc trạng thái, kỹ năng, kinh nghiệm và điểm; 3) sắp xếp; 4) chọn từ hai ứng viên; 5) tải điểm và bằng chứng từng tiêu chí; 6) trả ma trận so sánh; 7) HR đưa ra quyết định.'; Alt='Không có hồ sơ, AI chưa hoàn tất, chọn dưới hai ứng viên hoặc hồ sơ ngoài phạm vi.'; Post='Bảng xếp hạng và ma trận so sánh được hiển thị; hệ thống không tự thay HR quyết định.' },
    @{ Code='UC-04'; Name='Từ chối hồ sơ và cập nhật Talent Pool'; Goal='Từ chối hồ sơ có lý do, lưu dấu vết và duy trì ứng viên tiềm năng cho vị trí khác.'; Actor='Nhà tuyển dụng; Ứng viên nhận thông báo.'; Pre='HR có quyền xử lý đơn; đơn và CV tồn tại; trạng thái cho phép thay đổi.'; Trigger='HR chọn Từ chối hồ sơ.'; Main='1) Nhập lý do; 2) kiểm tra quyền; 3) cập nhật Application = Rejected; 4) tạo/cập nhật TalentPoolCandidate; 5) thêm TalentPoolInteraction và AuditLog; 6) commit; 7) gửi email/thông báo; 8) phát cập nhật thời gian thực.'; Alt='Không có quyền, đơn không tồn tại, trạng thái kết thúc hoặc gửi email thất bại.'; Post='Đơn bị từ chối; Talent Pool và lịch sử tương tác được cập nhật; lỗi email không hoàn tác dữ liệu chính.' },
    @{ Code='UC-05'; Name='Tạo và quản lý CV trực tuyến'; Goal='Cho phép ứng viên tạo và quản lý nhiều CV có cấu trúc, tùy chỉnh trình bày, lưu vào tài khoản, đặt mặc định, xuất PDF và tái sử dụng khi ứng tuyển.'; Actor='Tác nhân chính: Ứng viên. Thành phần hỗ trợ: CvBuilderPage, CvBuilderDocumentsController, CandidateCvsController và trình kết xuất PDF phía trình duyệt.'; Pre='1) Người dùng truy cập được trang CV Builder. 2) Trình duyệt hỗ trợ localStorage để giữ bản nháp. 3) Người dùng phải đăng nhập bằng tài khoản Candidate đang hoạt động khi lưu vào tài khoản, quản lý CV hoặc sử dụng CV đã lưu để ứng tuyển.'; Trigger='Ứng viên chọn “Tạo CV” trên thanh điều hướng hoặc mở một CV đã lưu từ danh sách tài liệu.'; Main='1) Hệ thống tải bản nháp cục bộ và danh sách CV thuộc tài khoản nếu đã đăng nhập. 2) Ứng viên chọn tạo CV trống, dùng dữ liệu mẫu hoặc mở CV đã lưu. 3) Ứng viên nhập năm nhóm: cá nhân; kinh nghiệm; học vấn; dự án; chứng chỉ; đồng thời khai báo kỹ năng và mục tiêu nghề nghiệp. 4) Form giữ toàn bộ trường của năm bước, kể cả bước chưa hiển thị. 5) Ứng viên chọn mẫu, màu nhấn, phông chữ, cỡ chữ, khung, mức thu phóng và thứ tự mục. 6) CvBuilderPage cập nhật bản xem trước A4 và tự lưu Content/Settings vào localStorage. 7) Khi chọn Lưu CV, frontend kiểm tra trường bắt buộc và tên CV. 8) Backend xác thực CandidateId, quyền sở hữu và giới hạn JSON. 9) Backend tạo mới hoặc cập nhật CvBuilderDocument gồm Name, ContentJson, SettingsJson, IsDefault và thời gian. 10) Ứng viên có thể mở, đổi tên, sửa, xóa hoặc đặt mặc định; thao tác đặt mặc định bỏ cờ của các CV khác cùng Candidate trong một giao dịch. 11) Khi xuất PDF, frontend sao chép vùng xem trước, chuẩn hóa A4, bỏ zoom/khung màn hình và tải PDF trực tiếp. 12) Tại trang việc làm, hệ thống tải danh sách CV của đúng ứng viên. 13) Ứng viên chọn CV mặc định, CV đã lưu/tải trước đó hoặc tệp mới. 14) Backend kiểm tra quyền sở hữu tệp rồi chuyển CV đã chọn sang UC-02 để ứng tuyển và đánh giá AI.'; Alt='A1) Không có bản nháp: khởi tạo CV trống và đề nghị dùng nội dung mẫu. A2) Chưa đăng nhập khi lưu: giữ bản nháp cục bộ và chuyển đến đăng nhập khi cần. A3) Thiếu họ tên hoặc tên CV: không gửi yêu cầu lưu. A4) API lưu lỗi: giữ nguyên localStorage và thông báo không mất bản nháp. A5) Mở dữ liệu cũ có mảng null: chuẩn hóa thành danh sách rỗng, không làm hỏng form. A6) Người dùng truy cập CV không thuộc tài khoản: trả 401/403/404. A7) Đặt mặc định hoặc xóa lỗi: giữ trạng thái cũ. A8) Kết xuất PDF lỗi: dọn vùng render tạm và thông báo thử lại. A9) CV đã lưu không còn tệp vật lý khi ứng tuyển: yêu cầu chọn CV khác hoặc tải tệp mới.'; Post='Bản nháp cục bộ phản ánh nội dung mới nhất. Khi lưu thành công, CvBuilderDocument chứa đầy đủ toàn bộ năm bước và cấu hình; tài liệu chỉ thuộc Candidate hiện tại. Tối đa một CV được đánh dấu mặc định. PDF được tải về đúng nội dung xem trước. CV hợp lệ có thể được chọn trong UC-02 mà không truy cập chéo tài khoản.' }
)

$specNodes = @((H3 'Đặc tả các Use Case chính'))
foreach($s in $specs){
    $specNodes += H4 "Đặc tả $($s.Code): $($s.Name)"
    $specNodes += SpecTable @(
        @('Mã Use Case',$s.Code),@('Tên Use Case',$s.Name),@('Mục tiêu',$s.Goal),@('Tác nhân',$s.Actor),@('Tiền điều kiện',$s.Pre),@('Kích hoạt',$s.Trigger),@('Luồng chính',$s.Main),@('Luồng ngoại lệ',$s.Alt),@('Hậu điều kiện',$s.Post)
    )
}
$specNodes += H4 'Ma trận truy vết nghiệp vụ'
$specNodes += P 'UC-01 ↔ Activity tạo/duyệt tin ↔ Sequence tạo/phê duyệt tin. UC-02 ↔ Activity nộp hồ sơ/AI ↔ Sequence nộp hồ sơ/AI. UC-03 ↔ Activity xếp hạng/so sánh ↔ Sequence xếp hạng/so sánh. UC-04 ↔ Activity từ chối/Talent Pool ↔ Sequence từ chối/Talent Pool. UC-05 ↔ Activity tạo/quản lý CV ↔ Sequence tạo/lưu/sử dụng CV.'
InsertBefore 'Activity Diagram' $specNodes

$activityNodes = @(
    (H4 'Activity Diagram Tạo, duyệt và công khai tin tuyển dụng'),
    (P 'Sơ đồ hiện thực UC-01 với bốn swimlane: Nhà tuyển dụng, Backend, Quản trị viên và Hệ thống thông báo. Luồng gồm nhập JD và tiêu chí, kiểm tra trọng số, lưu Pending, kiểm duyệt, cập nhật Published/Rejected và gửi thông báo.'),
    (Fig 'Activity Diagram UC-01 – Tạo, duyệt và công khai tin tuyển dụng'),(Src),
    (H4 'Activity Diagram Tạo và quản lý CV trực tuyến'),
    (P 'Sơ đồ hiện thực UC-05, bắt đầu từ CV trống hoặc dữ liệu mẫu; ứng viên nhập năm nhóm nội dung, tùy chỉnh giao diện, xem trước, tự lưu cục bộ, lưu tài khoản, đặt mặc định, xuất PDF và chọn CV khi ứng tuyển.'),
    (Fig 'Activity Diagram UC-05 – Tạo và quản lý CV trực tuyến'),(Src)
)
InsertBefore 'Sequence Diagram' $activityNodes

$sequenceNodes = @(
    (H4 'Sequence Diagram Tạo và phê duyệt tin tuyển dụng'),(P 'Sơ đồ đối chiếu UC-01 và Activity UC-01; lifeline gồm RecruiterPage, JobController, JobService, SQL Server, AdminPage và NotificationService.'),(Fig 'Sequence Diagram UC-01 – Tạo và phê duyệt tin tuyển dụng'),(Src),
    (H4 'Sequence Diagram Xếp hạng và so sánh ứng viên'),(P 'Sơ đồ đối chiếu UC-03 và Activity UC-03; lifeline gồm RankingPage, CandidateComparisonController, CandidateComparisonService và SQL Server.'),(Fig 'Sequence Diagram UC-03 – Xếp hạng và so sánh ứng viên'),(Src),
    (H4 'Sequence Diagram Từ chối hồ sơ và cập nhật Talent Pool'),(P 'Sơ đồ đối chiếu UC-04 và Activity UC-04; lifeline gồm RecruiterPage, RecruitmentController, ApplicationService, SQL Server, Notification/Email và SignalR.'),(Fig 'Sequence Diagram UC-04 – Từ chối hồ sơ và cập nhật Talent Pool'),(Src),
    (H4 'Sequence Diagram Tạo, lưu và sử dụng CV trực tuyến'),(P 'Sơ đồ đối chiếu UC-05 và Activity UC-05; lifeline gồm CvBuilderPage, CvBuilderService, CvBuilderDocumentsController, AppDbContext, SQL Server và JobDetail/Apply.'),(Fig 'Sequence Diagram UC-05 – Tạo, lưu và sử dụng CV trực tuyến'),(Src)
)
InsertBefore 'Class Diagram' $sequenceNodes

$classNodes = @(
    (H4 'Class Diagram miền tuyển dụng'),(P 'Sơ đồ gồm Account, Role, Candidate, Recruiter, Branch, JobPosting, JobCriterion, CandidateCV, CvBuilderDocument, Application, AIEvaluation, InterviewSchedule và SavedJob; thể hiện khóa và bội số quan hệ.'),(Fig 'Class Diagram miền tuyển dụng'),(Src),
    (H4 'Class Diagram xử lý đánh giá AI'),(P 'Sơ đồ gồm ApplicationController, ApplicationService, FileService, AiService, FastAPI adapter, DocumentParser, OCR, ScoringService, AppDbContext và AIEvaluation.'),(Fig 'Class Diagram xử lý đánh giá AI'),(Src)
)
InsertBefore 'Thiết kế cơ sở dữ liệu' $classNodes

$erdNodes = @(
    (H4 'ERD tuyển dụng và đánh giá AI sau cập nhật'),
    (P 'ERD cốt lõi cần bổ sung CvBuilderDocuments và thể hiện JobPostings, JobCriteria, CandidateCVs, CvBuilderDocuments, Applications, AIEvaluations, InterviewSchedules và SavedJobs. Candidate có nhiều CandidateCV và CvBuilderDocument; Application liên kết một JobPosting với CandidateCV; AIEvaluation liên kết một–một với Application.'),
    (Fig 'ERD tuyển dụng và đánh giá AI có CvBuilderDocuments'),(Src)
)
InsertBefore 'Thiết kế giao diện' $erdNodes

$wireframeNodes = @(
    (H4 'Wireframe màn hình tạo và quản lý CV trực tuyến'),
    (P 'Màn hình gồm biểu mẫu năm bước bên trái, bản xem trước A4 bên phải và thanh công cụ quản lý nhiều CV, mẫu, màu, phông chữ, thứ tự mục, lưu tài khoản, đặt mặc định và xuất PDF.'),
    (Fig 'Wireframe CV Builder và bản xem trước A4'),(Src)
)
InsertBefore 'Giao diện người dùng' $wireframeNodes

$settingsPath = Join-Path $build 'word\settings.xml'
$settings = New-Object Xml.XmlDocument; $settings.Load($settingsPath)
$sns = New-Object Xml.XmlNamespaceManager($settings.NameTable); $sns.AddNamespace('w',$w)
$root=$settings.SelectSingleNode('/w:settings',$sns);$update=$settings.SelectSingleNode('/w:settings/w:updateFields',$sns)
if(-not $update){$update=$settings.CreateElement('w','updateFields',$w);[void]$root.AppendChild($update)};[void]$update.SetAttribute('val',$w,'true')
$utf8=New-Object Text.UTF8Encoding($false);[IO.File]::WriteAllText($documentPath,$document.OuterXml,$utf8);[IO.File]::WriteAllText($settingsPath,$settings.OuterXml,$utf8)
if(Test-Path $Output){Remove-Item $Output -Force};[IO.Compression.ZipFile]::CreateFromDirectory($build,$Output,[IO.Compression.CompressionLevel]::Optimal,$false);Remove-Item $build -Recurse -Force
Write-Output "Created: $Output"
