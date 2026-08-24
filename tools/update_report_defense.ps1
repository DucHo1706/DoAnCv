param(
    [string]$Source = "D:\KhoaLuan\BAOCAOKHOALUAN_TINH_GON_CHUONG_2_4_5.docx",
    [string]$Output = "D:\KhoaLuan\BAOCAOKHOALUAN_CAP_NHAT_TRUOC_PHAN_BIEN.docx"
)

$ErrorActionPreference = 'Stop'
$workspace = [System.IO.Path]::GetFullPath('D:\KhoaLuan')
$sourcePath = [System.IO.Path]::GetFullPath($Source)
$outputPath = [System.IO.Path]::GetFullPath($Output)
$buildPath = [System.IO.Path]::GetFullPath('D:\KhoaLuan\.report_build_defense')
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

function Get-Text($node) {
    return (($node.SelectNodes('.//w:t', $ns) | ForEach-Object { $_.InnerText }) -join '').Trim()
}

function Set-NodeText($node, [string]$value) {
    $textNodes = @($node.SelectNodes('.//w:t', $ns))
    if ($textNodes.Count -eq 0) { return }
    $textNodes[0].InnerText = $value
    for ($i = 1; $i -lt $textNodes.Count; $i++) { $textNodes[$i].InnerText = '' }
}

function Set-TableData($table, [object[]]$rows) {
    $existingRows = @($table.SelectNodes('./w:tr', $ns))
    if ($existingRows.Count -eq 0) { throw 'Bảng không có hàng mẫu.' }
    $rowTemplate = $existingRows[0]
    foreach ($row in $existingRows) { [void]$table.RemoveChild($row) }

    foreach ($values in $rows) {
        $newRow = $rowTemplate.CloneNode($true)
        $cells = @($newRow.SelectNodes('./w:tc', $ns))
        while ($cells.Count -gt $values.Count) {
            [void]$newRow.RemoveChild($cells[-1])
            $cells = @($newRow.SelectNodes('./w:tc', $ns))
        }
        while ($cells.Count -lt $values.Count) {
            [void]$newRow.AppendChild($cells[-1].CloneNode($true))
            $cells = @($newRow.SelectNodes('./w:tc', $ns))
        }
        for ($index = 0; $index -lt $values.Count; $index++) {
            Set-NodeText $cells[$index] ([string]$values[$index])
        }
        [void]$table.AppendChild($newRow)
    }
}

# Cập nhật mô tả chức năng theo đúng phạm vi đã hiện thực.
foreach ($paragraph in @($document.SelectNodes('//w:p', $ns))) {
    $text = Get-Text $paragraph
    if ($text -like 'Phần này trình bày các chức năng chính đã được triển khai*') { continue }
    if ($text -eq 'Minh chứng Kiểm thử Chịu tải và Hiệu năng bằng Apache Jmeter') {
        Set-NodeText $paragraph 'Kiểm thử trích xuất 1.000 CV và tải API'
    }
    elseif ($text -like 'Apache JMeter 5.6 được sử dụng để gửi các yêu cầu đến những API trích xuất CV*') {
        Set-NodeText $paragraph 'Kiểm thử được tách thành hai phạm vi. Pipeline cục bộ được chạy tuần tự trên 1.000 tệp cv_mock_1.pdf đến cv_mock_1000.pdf để đo khả năng trích xuất văn bản. Kịch bản JMeter mới chỉ đo tải các API đọc dữ liệu công khai; luồng nộp CV và Gemini được kiểm tra riêng với một hồ sơ để tránh tạo dữ liệu trùng và vượt hạn mức dịch vụ.'
    }
    elseif ($text -like 'Trước khi trình bày kết quả, báo cáo cần xác định rõ cấu hình máy chủ*') {
        Set-NodeText $paragraph 'Trên tập PDF giả lập dạng văn bản, cả 1.000 tệp đều trích xuất được ít nhất 35 từ. Tổng thời gian là 6,268 giây; trung bình 6,103 ms/tệp, trung vị 6,012 ms và P95 là 7,362 ms. Kết quả này chỉ phản ánh bước đọc văn bản cục bộ trong môi trường thử nghiệm, không bao gồm OCR ảnh, truyền mạng hoặc phân tích Gemini.'
    }
    elseif ($text -like 'Trong điều kiện kiểm thử đã mô tả, thời gian phản hồi trung bình của tác vụ trích xuất CV*') {
        Set-NodeText $paragraph 'Kết quả cho thấy pipeline có thể lần lượt tiếp nhận và trích xuất tập 1.000 PDF giả lập. Đây là minh chứng về quy mô dữ liệu thử nghiệm, không đồng nghĩa hệ thống đã phục vụ 1.000 người dùng đồng thời.'
    }
    elseif ($text -like 'Giá trị phân vị 95 của ba nhóm tác vụ lần lượt*' -or
            $text -like 'Thông lượng ghi nhận lần lượt là 145*' -or
            $text -like 'Mức sử dụng CPU và RAM không vượt quá giới hạn*') {
        [void]$paragraph.ParentNode.RemoveChild($paragraph)
    }
    elseif ($text -like 'Hệ thống đã được kiểm thử chức năng trên các nghiệp vụ chính*') {
        Set-NodeText $paragraph 'Hệ thống đã được kiểm thử trên các nghiệp vụ chính của ứng viên, nhà tuyển dụng và quản trị viên, gồm tiếp nhận CV, lưu tiêu chí ASK, tạo FitScore, xếp hạng, lọc theo kỹ năng và điểm AI, thực hiện Apriori/HUIM, đề xuất chủ đề ôn tập và kiểm soát quyền truy cập.'
    }
}

# Cập nhật bảng 4.2 bằng số đo có thể tái lập.
$performanceTable = $document.SelectNodes('//w:tbl', $ns) | Where-Object { (Get-Text $_) -like '*Băng thông xử lý*145 req/sec*' } | Select-Object -First 1
if ($performanceTable) {
    $rows = @(
        @('Chỉ số', 'Kết quả', 'Phạm vi', 'Đánh giá'),
        @('Số lượng tệp', '1.000 PDF giả lập', 'cv_mock_1.pdf đến cv_mock_1000.pdf', 'Đủ quy mô tập thử nghiệm'),
        @('Trích xuất đạt tối thiểu 35 từ', '1.000/1.000 (100%)', 'PDF có lớp văn bản', 'Đạt trong tập dữ liệu này'),
        @('Tổng thời gian', '6,268 giây', 'Chạy tuần tự trên máy cục bộ', 'Số đo tham khảo'),
        @('Trung bình / Trung vị', '6,103 ms / 6,012 ms', 'Chỉ bước trích xuất văn bản', 'Không bao gồm Gemini'),
        @('P95 / Lớn nhất', '7,362 ms / 14,597 ms', 'Không bao gồm OCR ảnh và mạng', 'Không suy diễn độ chính xác AI')
    )
    Set-TableData $performanceTable $rows
}

# Cập nhật caption của bảng hiệu năng.
foreach ($paragraph in $document.SelectNodes('//w:p', $ns)) {
    $text = Get-Text $paragraph
    if ($text -like 'Bảng 4.2 Kết quả kiểm thử hiệu năng bằng Apache JMeter*' -or $text -like 'Bảng 4.2 Kết quả kiểm thử hiệu năng bằng Apache JMeter*') {
        Set-NodeText $paragraph 'Bảng 4.2 Kết quả kiểm thử trích xuất 1.000 CV giả lập'
    }
    elseif ($text -like 'Nguồn: Kết quả đo bằng Apache JMeter 5.6*') {
        Set-NodeText $paragraph 'Nguồn: Kết quả chạy benchmark_cv_extraction.py của nhóm tác giả.'
    }
}

# Thay bảng đối chiếu mục tiêu, loại các tỷ lệ và mức hoàn thành không có bằng chứng.
$goalTable = $document.SelectNodes('//w:tbl', $ns) | Where-Object { (Get-Text $_) -like '*Đạt 1.000 concurrent users trên JMeter*' } | Select-Object -First 1
if ($goalTable) {
    $rows = @(
        @('TT', 'Mục tiêu', 'Kết quả hiện thực', 'Minh chứng và giới hạn', 'Đánh giá'),
        @('1', 'Số hóa và trích xuất CV', 'Triển khai pipeline PyPDF2, pdfplumber và Tesseract cho PDF, DOCX và ảnh.', '1.000/1.000 PDF giả lập có lớp văn bản đạt ngưỡng 35 từ; chưa đại diện ảnh scan xấu.', 'Đạt trong phạm vi thử nghiệm'),
        @('2', 'Chấm điểm và giải thích FitScore', 'Kết hợp tiêu chí, TF-IDF/Cosine và Gemini; trả điểm cùng giải thích.', 'Chưa có tập CV–JD được chuyên gia gán nhãn đủ lớn để kết luận độ chính xác ≥70%.', 'Đã hiện thực; cần đánh giá thêm'),
        @('3', 'Hỗ trợ ứng viên tạo và cải thiện CV', 'CV Builder cho phép chọn mẫu, tùy chỉnh trình bày, xem trước, lưu nháp và xuất PDF; báo cáo AI phân tích STAR, ngôn từ, khoảng trống kỹ năng và đề xuất chủ đề ôn tập.', 'Không thay HR ra quyết định tuyển dụng hoặc xây dựng câu hỏi phỏng vấn.', 'Đạt'),
        @('4', 'Khai phá dữ liệu kỹ năng', 'Đã hiện thực Apriori và Two-Phase HUIM.', 'Kết quả phụ thuộc dữ liệu, trọng số và ngưỡng cấu hình.', 'Đạt về chức năng'),
        @('5', 'Ứng dụng Web và khả năng mở rộng', 'Ba phân hệ được đóng gói Docker và triển khai trên VPS.', 'Có tập 1.000 CV để kiểm thử; chưa có cơ sở khẳng định 1.000 người dùng đồng thời.', 'Đạt triển khai; chưa đạt minh chứng đồng thời')
    )
    Set-TableData $goalTable $rows
}

# Sửa các yêu cầu chức năng còn dùng mô tả cũ.
foreach ($cell in $document.SelectNodes('//w:tc', $ns)) {
    $text = Get-Text $cell
    if ($text -like 'Nhà tuyển dụng có thể tìm kiếm ứng viên theo tên hoặc email và lọc dữ liệu*') {
        Set-NodeText $cell 'Nhà tuyển dụng có thể tìm theo tên, email, số điện thoại, vị trí hoặc kỹ năng; đồng thời lọc theo trạng thái, phân loại, điểm AI và số năm kinh nghiệm trong phạm vi tin tuyển dụng.'
    }
    elseif ($text -like 'AI Service hỗ trợ tạo nội dung phân tích STAR, đánh giá ngôn ngữ, gợi ý câu hỏi phỏng vấn*') {
        Set-NodeText $cell 'AI Service hỗ trợ phân tích STAR, đánh giá ngôn ngữ, đề xuất chủ đề ôn tập và soạn thảo nội dung email dựa trên dữ liệu đầu vào.'
    }
    elseif ($text -like 'Cả 10 CV được trả về FitScore*thời gian trung bình là 2,3 giây*') {
        Set-NodeText $cell 'Các CV hợp lệ được trả về FitScore trong khoảng 0–100 và dữ liệu JSON có các trường yêu cầu. Thời gian xử lý được đo riêng theo từng loại tài liệu và trạng thái dịch vụ AI.'
    }
}

# Cập nhật tự động mục lục và trường tham chiếu khi mở Word.
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
