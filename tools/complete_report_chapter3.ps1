param(
    [string]$Source = "D:\KhoaLuan\BAOCAOKHOALUAN_CAP_NHAT_TRUOC_PHAN_BIEN.docx",
    [string]$Output = "D:\KhoaLuan\BAOCAOKHOALUAN_HOAN_CHINH_DOI_CHIEU.docx"
)

$ErrorActionPreference = 'Stop'
$workspace = [System.IO.Path]::GetFullPath('D:\KhoaLuan')
$sourcePath = [System.IO.Path]::GetFullPath($Source)
$outputPath = [System.IO.Path]::GetFullPath($Output)
$buildPath = [System.IO.Path]::GetFullPath('D:\KhoaLuan\.report_complete_build')
foreach ($path in @($sourcePath, $outputPath, $buildPath)) {
    if (-not $path.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Đường dẫn không hợp lệ.' }
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path -LiteralPath $buildPath) { Remove-Item -LiteralPath $buildPath -Recurse -Force }
New-Item -ItemType Directory -Path $buildPath | Out-Null
[System.IO.Compression.ZipFile]::ExtractToDirectory($sourcePath, $buildPath)

$documentPath = Join-Path $buildPath 'word\document.xml'
[xml]$document = Get-Content -LiteralPath $documentPath -Raw -Encoding UTF8
$wNs = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
$ns = New-Object System.Xml.XmlNamespaceManager($document.NameTable)
$ns.AddNamespace('w', $wNs)
$body = $document.SelectSingleNode('//w:body', $ns)

function Get-Text($node) {
    return (($node.SelectNodes('.//w:t', $ns) | ForEach-Object { $_.InnerText }) -join '').Trim()
}

function Find-Paragraph([string]$text) {
    return $document.SelectNodes('//w:body/w:p', $ns) | Where-Object { (Get-Text $_) -eq $text } | Select-Object -First 1
}

function New-Paragraph([string]$text, [string]$style = 'Normal', [bool]$bold = $false, [bool]$italic = $false) {
    $p = $document.CreateElement('w', 'p', $wNs)
    $pPr = $document.CreateElement('w', 'pPr', $wNs)
    if ($style) {
        $pStyle = $document.CreateElement('w', 'pStyle', $wNs)
        [void]$pStyle.SetAttribute('val', $wNs, $style)
        [void]$pPr.AppendChild($pStyle)
    }
    [void]$p.AppendChild($pPr)
    $r = $document.CreateElement('w', 'r', $wNs)
    if ($bold -or $italic) {
        $rPr = $document.CreateElement('w', 'rPr', $wNs)
        if ($bold) { [void]$rPr.AppendChild($document.CreateElement('w', 'b', $wNs)) }
        if ($italic) { [void]$rPr.AppendChild($document.CreateElement('w', 'i', $wNs)) }
        [void]$r.AppendChild($rPr)
    }
    $t = $document.CreateElement('w', 't', $wNs)
    $t.InnerText = $text
    [void]$r.AppendChild($t)
    [void]$p.AppendChild($r)
    return $p
}

function Insert-BlocksBefore([string]$targetText, [object[]]$blocks) {
    $target = Find-Paragraph $targetText
    if (-not $target) { throw "Không tìm thấy heading: $targetText" }
    foreach ($block in $blocks) {
        $node = New-Paragraph ([string]$block.Text) ([string]$block.Style) ([bool]$block.Bold) ([bool]$block.Italic)
        [void]$body.InsertBefore($node, $target)
    }
}

function H4([string]$text) { return @{ Text = $text; Style = 'Heading4'; Bold = $false; Italic = $false } }
function P([string]$text) { return @{ Text = $text; Style = 'Normal'; Bold = $false; Italic = $false } }
function Figure([string]$text) { return @{ Text = $text; Style = 'Normal'; Bold = $true; Italic = $false } }
function SourceLine() { return @{ Text = 'Nguồn: Tác giả tự xây dựng.'; Style = 'Normal'; Bold = $false; Italic = $true } }

$consistencyBlocks = @(
    (H4 'Ma trận truy vết giữa đặc tả Use Case, Activity Diagram và Sequence Diagram'),
    (P 'UC-01 “Tạo tin tuyển dụng và thiết lập tiêu chí đánh giá” được đối chiếu với Activity Diagram tạo, duyệt và công khai tin tuyển dụng và Sequence Diagram tạo, phê duyệt tin tuyển dụng. UC-02 “Nộp hồ sơ ứng tuyển” được đối chiếu với Activity Diagram nộp hồ sơ và đánh giá CV bằng AI và Sequence Diagram nộp hồ sơ, đánh giá CV bằng AI.'),
    (P 'UC-03 “Xếp hạng và so sánh ứng viên” được đối chiếu với Activity Diagram xếp hạng, so sánh ứng viên và Sequence Diagram cùng tên. UC-04 “Từ chối hồ sơ và cập nhật Talent Pool” được đối chiếu với Activity Diagram từ chối hồ sơ, cập nhật Talent Pool và Sequence Diagram cùng tên. Mỗi bộ ba sử dụng thống nhất tác nhân, tiền điều kiện, luồng chính, ngoại lệ và hậu điều kiện.')
)
Insert-BlocksBefore 'Activity Diagram' $consistencyBlocks

$activityBlocks = @(
    (H4 'Activity Diagram tạo, duyệt và công khai tin tuyển dụng'),
    (P 'Quy trình bắt đầu khi nhà tuyển dụng tạo bản nháp, chọn lĩnh vực, vị trí, cấp bậc, chi nhánh và thiết lập bộ tiêu chí ASK có trọng số. Backend kiểm tra dữ liệu bắt buộc, thời hạn và tổng trọng số trước khi chuyển tin sang trạng thái chờ phê duyệt. Quản trị viên xem nội dung, tiêu chí đánh giá và quyết định phê duyệt hoặc từ chối kèm lý do. Tin được phê duyệt mới xuất hiện trên cổng việc làm; tin bị từ chối được trả về cho nhà tuyển dụng chỉnh sửa.'),
    (Figure '[VỊ TRÍ CHÈN HÌNH] Activity Diagram tạo, duyệt và công khai tin tuyển dụng'),
    (SourceLine),
    (P 'Sơ đồ cần chia bốn swimlane gồm Nhà tuyển dụng, Backend, Quản trị viên và Hệ thống thông báo. Hai nhánh phê duyệt và từ chối phải cập nhật trạng thái thống nhất, ghi nhật ký và gửi thông báo cho nhà tuyển dụng.'),
    (H4 'Activity Diagram từ chối hồ sơ và cập nhật Talent Pool'),
    (P 'Quy trình bắt đầu khi nhà tuyển dụng chọn một hồ sơ thuộc tin mình phụ trách và nhập lý do từ chối. Backend kiểm tra quyền xử lý và trạng thái hiện tại của đơn. Nếu hợp lệ, hệ thống cập nhật Application thành Rejected, tạo mới hoặc cập nhật TalentPoolCandidate, ghi TalentPoolInteraction và lưu nhật ký. Sau khi giao dịch dữ liệu thành công, hệ thống gửi thông báo hoặc email cho ứng viên và cập nhật giao diện theo thời gian thực.'),
    (Figure '[VỊ TRÍ CHÈN HÌNH] Activity Diagram từ chối hồ sơ và cập nhật Talent Pool'),
    (SourceLine),
    (P 'Các nhánh ngoại lệ phải khớp UC-04: hồ sơ không tồn tại, nhà tuyển dụng không có quyền, đơn đã ở trạng thái kết thúc hoặc việc gửi thông báo thất bại. Lỗi thông báo không được hoàn tác kết quả từ chối đã lưu thành công.'),
    (H4 'Activity Diagram tạo, lưu và sử dụng CV trực tuyến'),
    (P 'Ứng viên có thể tạo CV mới từ nội dung trống hoặc dữ liệu mẫu, chỉnh sửa năm nhóm thông tin, thay đổi mẫu, màu sắc, phông chữ, thứ tự mục và theo dõi bản xem trước A4. Bản nháp được lưu cục bộ; khi đăng nhập, ứng viên có thể lưu nhiều CV vào tài khoản, đổi tên, đặt mặc định, xóa hoặc xuất PDF. Tại trang chi tiết việc làm, ứng viên chọn CV mặc định, một CV đã tải lên hệ thống hoặc tải tệp mới để ứng tuyển.'),
    (Figure '[VỊ TRÍ CHÈN HÌNH] Activity Diagram tạo, lưu và sử dụng CV trực tuyến'),
    (SourceLine),
    (P 'CV Builder hỗ trợ chuẩn bị hồ sơ nhưng không tự tạo kết luận tuyển dụng. Việc đánh giá chính thức chỉ được kích hoạt khi ứng viên nộp CV cho một tin tuyển dụng cụ thể có bộ tiêu chí đã được phê duyệt.')
)
Insert-BlocksBefore 'Sequence Diagram' $activityBlocks

$sequenceBlocks = @(
    (H4 'Sequence Diagram nộp hồ sơ và đánh giá CV bằng AI'),
    (P 'CandidatePage gửi yêu cầu nộp hồ sơ đến RecruitmentController. ApplicationService xác thực ứng viên, tin tuyển dụng và phương thức chọn CV; sau đó kiểm tra loại tệp, chữ ký tệp và khả năng trích xuất nội dung. Hồ sơ hợp lệ được lưu trước với trạng thái xử lý. Backend gọi AI Service để trích xuất, chuẩn hóa, đối chiếu tiêu chí và tính FitScore; kết quả được lưu trong AIEvaluations và phát thông báo cập nhật cho giao diện.'),
    (P 'Khung alt của sơ đồ gồm ba trường hợp. Với Success, hệ thống lưu điểm và giải thích. Với dữ liệu OCR không đủ, hệ thống trả trạng thái “Chưa thể đánh giá” thay vì kết luận “Không phù hợp”. Với AI_ERROR, hồ sơ vẫn được giữ, trạng thái lỗi có thể theo dõi và HR không được dùng điểm 0 để loại ứng viên.'),
    (Figure '[VỊ TRÍ CHÈN HÌNH] Sequence Diagram nộp hồ sơ và đánh giá CV bằng AI'),
    (SourceLine),
    (H4 'Sequence Diagram tạo và phê duyệt tin tuyển dụng'),
    (P 'RecruiterPage gửi dữ liệu tin và danh sách JobCriterion đến Backend. JobService kiểm tra quyền chi nhánh, dữ liệu danh mục, trọng số và trạng thái trước khi ghi JobPostings và JobCriteria. AdminPage truy vấn tin chờ duyệt, xem toàn bộ JD cùng tiêu chí, rồi gửi quyết định phê duyệt hoặc từ chối. NotificationService thông báo kết quả đến nhà tuyển dụng và AuditLog lưu dấu vết thao tác.'),
    (Figure '[VỊ TRÍ CHÈN HÌNH] Sequence Diagram tạo và phê duyệt tin tuyển dụng'),
    (SourceLine),
    (H4 'Sequence Diagram xếp hạng và so sánh ứng viên'),
    (P 'RankingPage yêu cầu danh sách hồ sơ thuộc một tin tuyển dụng. Backend chỉ trả dữ liệu trong phạm vi nhà tuyển dụng được phân quyền, cho phép lọc trạng thái, kỹ năng, kinh nghiệm và khoảng điểm. CandidateComparisonService nhận tối thiểu hai hồ sơ, tải kết quả tiêu chí cùng bằng chứng, chuẩn hóa dữ liệu và trả ma trận so sánh. HR sử dụng kết quả như thông tin hỗ trợ và vẫn là chủ thể đưa ra quyết định.'),
    (Figure '[VỊ TRÍ CHÈN HÌNH] Sequence Diagram xếp hạng và so sánh ứng viên'),
    (SourceLine),
    (H4 'Sequence Diagram từ chối hồ sơ và cập nhật Talent Pool'),
    (P 'RecruiterPage gửi ApplicationId, lý do và ghi chú đến RecruitmentController. ApplicationService xác thực quyền sở hữu tin, kiểm tra trạng thái đơn và bắt đầu giao dịch dữ liệu. Service cập nhật Application, upsert TalentPoolCandidate, thêm TalentPoolInteraction và AuditLog rồi hoàn tất giao dịch. NotificationService và EmailService được gọi sau khi dữ liệu chính đã lưu; NotificationHub phát trạng thái mới cho giao diện.'),
    (Figure '[VỊ TRÍ CHÈN HÌNH] Sequence Diagram từ chối hồ sơ và cập nhật Talent Pool'),
    (SourceLine),
    (H4 'Luồng tương tác kỹ thuật của CV Builder'),
    (P 'CvBuilderPage duy trì dữ liệu của toàn bộ năm bước trong một form thống nhất và tự lưu bản nháp trên thiết bị. Khi người dùng chọn lưu tài khoản, CvBuilderService gửi ContentJson và SettingsJson đến CvBuilderDocumentsController. Controller xác thực quyền sở hữu rồi ghi CvBuilderDocuments. Người dùng có thể tải lại, cập nhật, đặt mặc định hoặc xóa tài liệu; thao tác xuất PDF kết xuất trực tiếp bản xem trước A4.'),
    (P 'Khi ứng tuyển, trang chi tiết việc làm tải danh sách CV thuộc ứng viên. CandidateCvsController chỉ cho phép đọc tệp của chính tài khoản hiện tại. RecruitmentController nhận SavedCvId, CV mặc định hoặc tệp mới; ApplicationService tiếp tục đưa tệp đã chọn vào cùng một pipeline kiểm tra và đánh giá.'),
    (P 'Luồng này là mô tả kỹ thuật bổ sung cho chức năng CV Builder, không thuộc bốn Sequence Diagram đối chiếu trực tiếp với UC-01 đến UC-04.')
)
Insert-BlocksBefore 'Class Diagram' $sequenceBlocks

$classBlocks = @(
    (H4 'Class Diagram miền tuyển dụng'),
    (P 'Mô hình miền tuyển dụng gồm Account và Role quản lý danh tính; Candidate và Recruiter lưu hồ sơ theo vai trò; Branch, Category, Position, JobLevel và Skill cung cấp danh mục dùng chung. JobPosting thuộc nhà tuyển dụng và liên kết nhiều JobCriterion. Candidate nộp nhiều CandidateCV và Application; mỗi Application có tối đa một AIEvaluation hiện hành và có thể liên kết InterviewSchedule. SavedJob thể hiện quan hệ lưu tin của ứng viên.'),
    (Figure '[VỊ TRÍ CHÈN HÌNH] Class Diagram miền tuyển dụng'),
    (SourceLine),
    (H4 'Class Diagram xử lý đánh giá AI'),
    (P 'ApplicationController tiếp nhận yêu cầu HTTP và phụ thuộc ApplicationService. Service điều phối FileService, AiService, AppDbContext và dịch vụ thông báo. AI Service phía Backend đóng vai trò adapter khi trao đổi với FastAPI. Phân hệ Python thực hiện kiểm tra tài liệu, trích xuất trực tiếp hoặc OCR dự phòng, chuẩn hóa văn bản, bóc tách thực thể, so khớp tiêu chí và sinh kết quả giải thích. Kết quả được ánh xạ về AIEvaluation thay vì lưu trạng thái rời rạc trên giao diện.'),
    (Figure '[VỊ TRÍ CHÈN HÌNH] Class Diagram xử lý đánh giá AI'),
    (SourceLine),
    (H4 'Class Diagram CV Builder'),
    (P 'CvBuilderPage quản lý trạng thái biên tập và gọi CvBuilderService. Service giao tiếp với CvBuilderDocumentsController qua REST API. CvBuilderDocument gồm Id, CandidateId, Name, ContentJson, SettingsJson, IsDefault, CreatedAt và UpdatedAt. Candidate có quan hệ một–nhiều với CvBuilderDocument. CandidateCvsController là lớp đọc tệp CV đã tải lên để tái sử dụng khi phân tích hoặc ứng tuyển, nhưng không cho phép truy cập chéo giữa các ứng viên.'),
    (Figure '[VỊ TRÍ CHÈN HÌNH] Class Diagram CV Builder'),
    (SourceLine)
)
Insert-BlocksBefore 'Thiết kế cơ sở dữ liệu' $classBlocks

$erdBlocks = @(
    (H4 'ERD tổng quan theo nhóm dữ liệu'),
    (P 'Cơ sở dữ liệu hiện gồm 23 DbSet, được chia thành bốn nhóm: tài khoản và người dùng; danh mục tổ chức; tuyển dụng và đánh giá AI; tương tác và truy vết. Sơ đồ tổng quan chỉ thể hiện tên bảng và quan hệ chính để giữ khả năng đọc, trong khi các sơ đồ con trình bày khóa ngoại quan trọng.'),
    (Figure '[VỊ TRÍ CHÈN HÌNH] ERD tổng quan theo nhóm dữ liệu'),
    (SourceLine),
    (H4 'ERD tài khoản và cơ cấu tổ chức'),
    (P 'Nhóm này gồm Roles, Accounts, Candidates, Recruiters, RecruiterBranches, Branches, Categories, Positions, JobLevels và Skills. Account liên kết hồ sơ theo vai trò; RecruiterBranches biểu diễn quan hệ nhiều–nhiều giữa nhà tuyển dụng và chi nhánh; Position thuộc Category, còn JobLevel và Skill là danh mục phục vụ tạo tin và tiêu chí.'),
    (Figure '[VỊ TRÍ CHÈN HÌNH] ERD tài khoản và cơ cấu tổ chức'),
    (SourceLine),
    (H4 'ERD tuyển dụng và đánh giá AI'),
    (P 'Nhóm nghiệp vụ cốt lõi gồm JobPostings, JobCriteria, CandidateCVs, CvBuilderDocuments, Applications, AIEvaluations, InterviewSchedules và SavedJobs. JobPosting có nhiều tiêu chí và hồ sơ ứng tuyển. Application liên kết ứng viên, tin, CV được dùng và kết quả AIEvaluation. CvBuilderDocuments lưu riêng tài liệu thiết kế trực tuyến, sau đó có thể được xuất hoặc chọn khi ứng tuyển.'),
    (Figure '[VỊ TRÍ CHÈN HÌNH] ERD tuyển dụng và đánh giá AI'),
    (SourceLine),
    (H4 'ERD tương tác và truy vết'),
    (P 'Nhóm hỗ trợ gồm TalentPoolCandidates, TalentPoolInteractions, Notifications, EmailLogs, ChatMessages và AuditLogs. Talent Pool lưu ứng viên tiềm năng cùng lịch sử tương tác; Notifications và EmailLogs phản ánh các thông báo đã phát; ChatMessages lưu hội thoại hỗ trợ; AuditLogs ghi thao tác quản trị và thay đổi nghiệp vụ cần truy vết.'),
    (Figure '[VỊ TRÍ CHÈN HÌNH] ERD tương tác và truy vết'),
    (SourceLine)
)
Insert-BlocksBefore 'Phân nhóm và mô tả các bảng' $erdBlocks

$cvBuilderDictionary = @(
    (H4 'Bảng CvBuilderDocuments'),
    (P 'Bảng CvBuilderDocuments lưu các CV được tạo trực tuyến theo từng ứng viên. CandidateId là khóa ngoại đến Candidates; Name là tên do người dùng đặt; ContentJson lưu nội dung có cấu trúc gồm thông tin cá nhân, kinh nghiệm, học vấn, dự án, kỹ năng và chứng chỉ; SettingsJson lưu mẫu, màu nhấn, phông chữ, cỡ chữ, kiểu khung và thứ tự các mục. IsDefault xác định CV mặc định. CreatedAt và UpdatedAt hỗ trợ truy vết thời điểm tạo và cập nhật.'),
    (P 'Ràng buộc nghiệp vụ yêu cầu người dùng chỉ được đọc, sửa, đặt mặc định hoặc xóa tài liệu thuộc CandidateId của mình. Khi đặt một CV làm mặc định, hệ thống bỏ cờ mặc định của các CV còn lại trong cùng tài khoản. Nội dung JSON được giới hạn kích thước và phải là đối tượng hợp lệ trước khi lưu.')
)
Insert-BlocksBefore 'Bảng Applications' $cvBuilderDictionary

$uiBlocks = @(
    (H4 'Wireframe màn hình tạo CV trực tuyến'),
    (P 'Màn hình chia hai vùng: biểu mẫu năm bước ở bên trái và bản xem trước A4 ở bên phải. Thanh công cụ phía trên cho phép quản lý nhiều CV, chọn mẫu, màu sắc, phông chữ, cỡ chữ, thứ tự mục, lưu tài khoản, đặt mặc định và tải PDF. Trên màn hình nhỏ, hai vùng được xếp dọc để giữ khả năng thao tác.'),
    (Figure '[VỊ TRÍ CHÈN HÌNH] Wireframe CV Builder và bản xem trước A4'),
    (SourceLine),
    (H4 'Wireframe báo cáo phân tích dành cho ứng viên'),
    (P 'Báo cáo ưu tiên ngôn ngữ dễ hiểu: mức độ phù hợp tổng quan, kỹ năng đáp ứng, kỹ năng còn thiếu, bằng chứng tìm thấy, cảnh báo chất lượng dữ liệu, tối ưu STAR, ngôn từ và chủ đề ôn tập. Thành phần Whitebox/Blackbox chỉ được giải thích dưới dạng nguồn cấu thành điểm để tăng tính minh bạch, không dùng thuật ngữ kỹ thuật đơn độc.'),
    (Figure '[VỊ TRÍ CHÈN HÌNH] Wireframe báo cáo phân tích dành cho ứng viên'),
    (SourceLine),
    (H4 'Wireframe xếp hạng và so sánh ứng viên dành cho HR'),
    (P 'Danh sách HR hiển thị thứ hạng, trạng thái, FitScore và cảnh báo dữ liệu; hỗ trợ lọc theo kỹ năng, kinh nghiệm và điểm. Giao diện so sánh đặt các ứng viên theo cột và tiêu chí theo hàng, kèm trọng số, điểm và giải thích. Thiết kế giúp HR kiểm tra bằng chứng thay vì chỉ dựa vào một con số tổng.'),
    (Figure '[VỊ TRÍ CHÈN HÌNH] Wireframe xếp hạng và so sánh ứng viên dành cho HR'),
    (SourceLine),
    (H4 'Wireframe tạo tin và thiết lập tiêu chí'),
    (P 'Biểu mẫu tạo tin tách thông tin công việc, mô tả, yêu cầu, quyền lợi và bộ tiêu chí đánh giá. Mỗi tiêu chí có nhóm ASK, mô tả, trọng số và mức bắt buộc. Giao diện hiển thị tổng trọng số và ngăn gửi duyệt khi dữ liệu chưa hợp lệ.'),
    (Figure '[VỊ TRÍ CHÈN HÌNH] Wireframe tạo tin và thiết lập tiêu chí'),
    (SourceLine),
    (H4 'Wireframe duyệt tin và quản lý cơ cấu dành cho Admin'),
    (P 'Trang chi tiết duyệt tin hiển thị đầy đủ JD, chi nhánh, danh mục, tiêu chí và lịch sử trạng thái trên một trang thay vì popup nhỏ. Phần cơ cấu tổ chức trình bày quan hệ Lĩnh vực → Vị trí và Chi nhánh → Nhà tuyển dụng; cấp bậc là danh mục độc lập dùng khi tạo tin. Cách đặt tên này thay cho thuật ngữ “Danh mục cha” khó hiểu.'),
    (Figure '[VỊ TRÍ CHÈN HÌNH] Wireframe duyệt tin và quản lý cơ cấu dành cho Admin'),
    (SourceLine)
)
Insert-BlocksBefore 'TRIỂN KHAI, THỰC THI VÀ KẾT QUẢ ĐẠT ĐƯỢC' $uiBlocks

# Chỉ giữ các sơ đồ mới thật sự cần cho phản biện. Các nội dung còn lại được
# trình bày bằng văn bản, tái sử dụng hình hiện có hoặc thay bằng ảnh chụp giao diện.
$optionalFigurePlaceholders = @(
    '[VỊ TRÍ CHÈN HÌNH] Activity Diagram tạo, lưu và sử dụng CV trực tuyến',
    '[VỊ TRÍ CHÈN HÌNH] Class Diagram CV Builder',
    '[VỊ TRÍ CHÈN HÌNH] ERD tổng quan theo nhóm dữ liệu',
    '[VỊ TRÍ CHÈN HÌNH] ERD tài khoản và cơ cấu tổ chức',
    '[VỊ TRÍ CHÈN HÌNH] ERD tương tác và truy vết',
    '[VỊ TRÍ CHÈN HÌNH] Wireframe CV Builder và bản xem trước A4',
    '[VỊ TRÍ CHÈN HÌNH] Wireframe báo cáo phân tích dành cho ứng viên',
    '[VỊ TRÍ CHÈN HÌNH] Wireframe xếp hạng và so sánh ứng viên dành cho HR',
    '[VỊ TRÍ CHÈN HÌNH] Wireframe tạo tin và thiết lập tiêu chí',
    '[VỊ TRÍ CHÈN HÌNH] Wireframe duyệt tin và quản lý cơ cấu dành cho Admin'
)
foreach ($paragraph in @($document.SelectNodes('//w:body/w:p', $ns))) {
    if ($optionalFigurePlaceholders -contains (Get-Text $paragraph)) {
        $next = $paragraph.NextSibling
        [void]$paragraph.ParentNode.RemoveChild($paragraph)
        if ($next -and (Get-Text $next) -eq 'Nguồn: Tác giả tự xây dựng.') {
            [void]$next.ParentNode.RemoveChild($next)
        }
    }
}

# Cập nhật các mô tả đã lỗi thời hoặc không còn đúng với sản phẩm.
foreach ($paragraph in @($document.SelectNodes('//w:p', $ns))) {
    $text = Get-Text $paragraph
    if ($text -like '*gợi ý câu hỏi phỏng vấn*') {
        $nodes = @($paragraph.SelectNodes('.//w:t', $ns))
        if ($nodes.Count -gt 0) {
            $replacement = $text -replace 'gợi ý câu hỏi phỏng vấn', 'đề xuất chủ đề ôn tập và tài liệu tự học'
            $nodes[0].InnerText = $replacement
            for ($i = 1; $i -lt $nodes.Count; $i++) { $nodes[$i].InnerText = '' }
        }
    }
}

$settingsPath = Join-Path $buildPath 'word\settings.xml'
[xml]$settings = Get-Content -LiteralPath $settingsPath -Raw -Encoding UTF8
$settingsNs = New-Object System.Xml.XmlNamespaceManager($settings.NameTable)
$settingsNs.AddNamespace('w', $wNs)
$root = $settings.SelectSingleNode('/w:settings', $settingsNs)
$update = $settings.SelectSingleNode('/w:settings/w:updateFields', $settingsNs)
if (-not $update) { $update = $settings.CreateElement('w', 'updateFields', $wNs); [void]$root.AppendChild($update) }
[void]$update.SetAttribute('val', $wNs, 'true')

$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($documentPath, $document.OuterXml, $utf8)
[System.IO.File]::WriteAllText($settingsPath, $settings.OuterXml, $utf8)
if (Test-Path -LiteralPath $outputPath) { Remove-Item -LiteralPath $outputPath -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($buildPath, $outputPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)
Remove-Item -LiteralPath $buildPath -Recurse -Force
Write-Output "Created: $outputPath"
