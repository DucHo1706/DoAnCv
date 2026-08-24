param(
    [string]$Source = "D:\KhoaLuan\BAOCAOKHOALUAN_TINH_GON_CHUONG_2.docx",
    [string]$Output = "D:\KhoaLuan\BAOCAOKHOALUAN_TINH_GON_CHUONG_2_4_5.docx"
)

$ErrorActionPreference = 'Stop'
$workspace = [System.IO.Path]::GetFullPath('D:\KhoaLuan')
$sourcePath = [System.IO.Path]::GetFullPath($Source)
$outputPath = [System.IO.Path]::GetFullPath($Output)
$buildPath = [System.IO.Path]::GetFullPath('D:\KhoaLuan\.report_build_ch4_5')

foreach ($path in @($sourcePath, $outputPath, $buildPath)) {
    if (-not $path.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw 'Mọi đường dẫn phải nằm trong workspace.'
    }
}
if (-not (Test-Path -LiteralPath $sourcePath)) { throw "Không tìm thấy file nguồn: $sourcePath" }

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

function Get-Style($paragraph) {
    $node = $paragraph.SelectSingleNode('./w:pPr/w:pStyle', $ns)
    if ($null -eq $node) { return '' }
    return $node.GetAttribute('val', $wNs)
}

function Get-Text($paragraph) {
    return (($paragraph.SelectNodes('.//w:t', $ns) | ForEach-Object { $_.InnerText }) -join '').Trim()
}

function Set-Text($paragraph, [string]$value) {
    $textNodes = @($paragraph.SelectNodes('.//w:t', $ns))
    if ($textNodes.Count -eq 0) {
        $run = $document.CreateElement('w', 'r', $wNs)
        $text = $document.CreateElement('w', 't', $wNs)
        $text.InnerText = $value
        [void]$run.AppendChild($text)
        [void]$paragraph.AppendChild($run)
        return
    }
    $textNodes[0].InnerText = $value
    for ($i = 1; $i -lt $textNodes.Count; $i++) { $textNodes[$i].InnerText = '' }
}

function New-StyledParagraph([string]$styleName, [string]$textValue, $template) {
    $paragraph = $template.CloneNode($true)
    foreach ($child in @($paragraph.ChildNodes)) {
        if ($child.LocalName -ne 'pPr') { [void]$paragraph.RemoveChild($child) }
    }
    $pPr = $paragraph.SelectSingleNode('./w:pPr', $ns)
    if ($null -eq $pPr) {
        $pPr = $document.CreateElement('w', 'pPr', $wNs)
        [void]$paragraph.PrependChild($pPr)
    }
    $pStyle = $pPr.SelectSingleNode('./w:pStyle', $ns)
    if ($null -eq $pStyle) {
        $pStyle = $document.CreateElement('w', 'pStyle', $wNs)
        [void]$pPr.PrependChild($pStyle)
    }
    [void]$pStyle.SetAttribute('val', $wNs, $styleName)
    $run = $document.CreateElement('w', 'r', $wNs)
    $text = $document.CreateElement('w', 't', $wNs)
    $text.InnerText = $textValue
    [void]$run.AppendChild($text)
    [void]$paragraph.AppendChild($run)
    return $paragraph
}

function Remove-Nodes($nodes) {
    foreach ($node in @($nodes)) {
        if ($null -ne $node.ParentNode) { [void]$node.ParentNode.RemoveChild($node) }
    }
}

# 1. Loại các ảnh giao diện lặp, chỉ giữ màn hình đại diện cho luồng chính và đóng góp AI.
$removeUiTitles = @(
    'Giao diện đăng nhập',
    'Giao diện đăng ký',
    'Giao diện chi tiết tin tuyển dụng',
    'Giao diện Trợ lý ảo AI Chatbot hỗ trợ ứng viên',
    'Giao diện Quản lý Hồ sơ ứng viên và Kho kỹ năng',
    'Giao diện Quản lý tin tuyển dụng',
    'Giao diện quản lý tin tuyển dụng',
    'Giao diện Quản lý Kho tài năng',
    'Giao diện Gửi Email cho ứng viên'
)

$nodes = @($body.ChildNodes)
$remove = New-Object System.Collections.Generic.List[System.Xml.XmlNode]
for ($i = 0; $i -lt $nodes.Count; $i++) {
    $node = $nodes[$i]
    if ($node.LocalName -ne 'p') { continue }
    $style = Get-Style $node
    $text = Get-Text $node
    if ($style -eq 'Heading4' -and $removeUiTitles -contains $text) {
        $remove.Add($node)
        for ($j = $i + 1; $j -lt $nodes.Count; $j++) {
            $next = $nodes[$j]
            if ($next.LocalName -eq 'p') {
                $nextStyle = Get-Style $next
                if ($nextStyle -match '^Heading[1-4]$') { break }
            }
            $remove.Add($next)
        }
    }
}
Remove-Nodes $remove

# 2. Bỏ mục định hướng ở cuối Chương 4 vì nội dung này được trình bày ngắn gọn tại Chương 5.
$nodes = @($body.ChildNodes)
$remove = New-Object System.Collections.Generic.List[System.Xml.XmlNode]
$deleting = $false
foreach ($node in $nodes) {
    if ($node.LocalName -eq 'p') {
        $style = Get-Style $node
        $text = Get-Text $node
        if ($style -eq 'Heading2' -and $text -eq 'Định hướng cải thiện và phát triển') { $deleting = $true }
        elseif ($deleting -and $style -eq 'Heading1') { $deleting = $false }
    }
    if ($deleting) { $remove.Add($node) }
}
Remove-Nodes $remove

# 3. Bỏ phần đánh giá diễn giải trùng với bảng đối chiếu và có các khẳng định chưa đủ minh chứng.
$nodes = @($body.ChildNodes)
$remove = New-Object System.Collections.Generic.List[System.Xml.XmlNode]
$deleting = $false
foreach ($node in $nodes) {
    if ($node.LocalName -eq 'p') {
        $style = Get-Style $node
        $text = Get-Text $node
        if ($style -eq 'Heading3' -and $text -eq 'Đánh giá Mô hình Lý thuyết, Giải thuật và Công nghệ Áp dụng') { $deleting = $true }
        elseif ($deleting -and ($style -eq 'Heading3' -or $style -match '^Heading[1-2]$')) { $deleting = $false }
    }
    if ($deleting) { $remove.Add($node) }
}
Remove-Nodes $remove

# 4. Tinh gọn mô tả công nghệ và thuật toán: giữ tối đa hai đoạn chính trong mỗi mục cấp 4.
$nodes = @($body.ChildNodes)
$insideChapter4 = $false
$h2 = ''
$h4 = ''
$bodyIndex = 0
$remove = New-Object System.Collections.Generic.List[System.Xml.XmlNode]
foreach ($node in $nodes) {
    if ($node.LocalName -ne 'p') { continue }
    $style = Get-Style $node
    $text = Get-Text $node
    if ($style -eq 'Heading1' -and $text -eq 'TRIỂN KHAI, THỰC THI VÀ KẾT QUẢ ĐẠT ĐƯỢC') { $insideChapter4 = $true; continue }
    if ($insideChapter4 -and $style -eq 'Heading1') { $insideChapter4 = $false; continue }
    if (-not $insideChapter4) { continue }
    if ($style -eq 'Heading2') { $h2 = $text; $h4 = ''; $bodyIndex = 0; continue }
    if ($style -eq 'Heading4') { $h4 = $text; $bodyIndex = 0; continue }
    if ($style -match '^Heading[1-3]$' -or -not $text) { continue }
    if ($node.SelectNodes('.//w:drawing|.//w:oMath|.//w:oMathPara', $ns).Count -gt 0 -or $style -match 'Caption|Ngun|Source') { continue }

    if ($h2 -eq 'Công nghệ thực hiện' -and $h4) {
        $bodyIndex++
        $max = 2
        if ($h4 -in @('So khớp văn bản bằng TF-IDF và độ tương đồng Cosine','Phát hiện văn bản ẩn trong hồ sơ PDF','Che giấu thông tin cá nhân','Cơ chế quản lý khóa và chuyển sang cấu hình dự phòng')) { $max = 2 }
        if ($bodyIndex -gt $max) { $remove.Add($node) }
    }
}
Remove-Nodes $remove

# 5. Bổ sung mô tả triển khai thực tế bằng Docker/VPS vào đúng Chương 4.
$nodes = @($body.ChildNodes)
$insertBefore = $null
$headingTemplate = $null
$bodyTemplate = $null
$foundPythonHeading = $false
foreach ($node in $nodes) {
    if ($node.LocalName -ne 'p') { continue }
    $style = Get-Style $node
    $text = Get-Text $node
    if ($style -eq 'Heading4' -and $text -eq 'Thiết lập môi trường python') {
        $foundPythonHeading = $true
        $headingTemplate = $node
        continue
    }
    if ($foundPythonHeading -and -not $bodyTemplate -and $style -notmatch '^Heading') { $bodyTemplate = $node }
    if ($foundPythonHeading -and $style -eq 'Heading3') { $insertBefore = $node; break }
}
if ($insertBefore -and $headingTemplate -and $bodyTemplate) {
    $newHeading = New-StyledParagraph 'Heading4' 'Đóng gói và triển khai trên VPS' $headingTemplate
    $newBody1 = New-StyledParagraph 'Normal' 'Hệ thống được đóng gói bằng Docker và điều phối bằng Docker Compose. Frontend, Backend ASP.NET Core và dịch vụ Python FastAPI được tổ chức thành các container độc lập, giao tiếp qua mạng nội bộ. Cách triển khai này giúp thống nhất môi trường chạy và cho phép xây dựng lại từng dịch vụ khi cập nhật mã nguồn.' $bodyTemplate
    $newBody2 = New-StyledParagraph 'Normal' 'Phiên bản thực nghiệm được triển khai trên VPS Ubuntu. Nginx tiếp nhận kết nối HTTPS và chuyển tiếp yêu cầu đến dịch vụ phù hợp; cơ sở dữ liệu và các dịch vụ nội bộ không được công khai trực tiếp. Chuỗi kết nối, khóa API và thông tin thư điện tử được cung cấp qua biến môi trường, không trình bày trong báo cáo hoặc lưu trực tiếp vào mã nguồn.' $bodyTemplate
    [void]$body.InsertBefore($newHeading, $insertBefore)
    [void]$body.InsertBefore($newBody1, $insertBefore)
    [void]$body.InsertBefore($newBody2, $insertBefore)
}

# 6. Đồng bộ nghiệp vụ hiện tại: AI gợi ý ôn tập, không tạo câu hỏi phỏng vấn cho HR.
foreach ($paragraph in $document.SelectNodes('//w:body/w:p', $ns)) {
    $text = Get-Text $paragraph
    if ($text -like 'Trên cơ sở đó, mô hình đề xuất các chủ đề ôn tập, câu hỏi tham khảo*') {
        Set-Text $paragraph 'Trên cơ sở đó, mô hình đề xuất tối đa ba chủ đề cần ưu tiên ôn tập và tài liệu tự học phù hợp. Câu lệnh yêu cầu đầu ra có cấu trúc, không tự tạo thành tích và không thay nhà tuyển dụng xây dựng câu hỏi phỏng vấn [18]. Các đường dẫn do mô hình đề xuất phải được kiểm tra trước khi hiển thị.'
    }
    elseif ($text -eq 'Phân hệ Trợ lý Phỏng vấn AI dừng ở mức Gợi ý Câu hỏi Định dạng Văn bản') {
        Set-Text $paragraph 'Chức năng hỗ trợ ôn tập còn giới hạn'
    }
    elseif ($text -like 'Chức năng trợ lý hiện hỗ trợ tạo câu hỏi phỏng vấn*') {
        Set-Text $paragraph 'Chức năng hiện chỉ đề xuất chủ đề ôn tập và tài liệu tự học dựa trên khoảng cách giữa CV với yêu cầu công việc. Hệ thống chưa đánh giá chất lượng học tập, chưa tổ chức phỏng vấn trực tuyến và không tạo câu hỏi thay cho nhà tuyển dụng.'
    }
    elseif ($text -eq 'Các câu hỏi do AI tạo vẫn cần nhà tuyển dụng kiểm tra và điều chỉnh trước khi sử dụng.') {
        $paragraph.ParentNode.RemoveChild($paragraph) | Out-Null
    }
    elseif ($text -like 'Hệ thống đã được kiểm thử chức năng trên các nghiệp vụ chính*') {
        Set-Text $paragraph 'Hệ thống đã được kiểm thử trên các nghiệp vụ chính của ứng viên, nhà tuyển dụng và quản trị viên, bao gồm tiếp nhận hồ sơ, lưu tiêu chí ASK, tạo FitScore, phát hiện dấu hiệu cần xem xét, thực hiện Apriori và HUIM, đề xuất chủ đề ôn tập và kiểm soát quyền truy cập.'
    }
    elseif ($text -like 'Cuối cùng, trợ lý phỏng vấn mới hỗ trợ dưới dạng văn bản*') {
        Set-Text $paragraph 'Cuối cùng, chức năng hỗ trợ ứng viên mới dừng ở việc đề xuất chủ đề ôn tập và tài liệu tự học; chưa theo dõi tiến độ học tập hoặc kiểm chứng chất lượng tài liệu một cách tự động.'
    }
}

# 7. Tinh gọn Chương 5: giữ kết luận theo đóng góp, một đoạn hạn chế và mỗi hướng phát triển một đoạn.
$nodes = @($body.ChildNodes)
$insideChapter5 = $false
$h2 = ''
$h3 = ''
$bodyIndex = 0
$remove = New-Object System.Collections.Generic.List[System.Xml.XmlNode]
foreach ($node in $nodes) {
    if ($node.LocalName -ne 'p') { continue }
    $style = Get-Style $node
    $text = Get-Text $node
    if ($style -eq 'Heading1' -and $text -eq 'TỔNG KẾT VÀ KIẾN NGHỊ') { $insideChapter5 = $true; continue }
    if ($insideChapter5 -and $style -eq 'Heading1') { $insideChapter5 = $false; continue }
    if (-not $insideChapter5) { continue }
    if ($style -eq 'Heading2') { $h2 = $text; $h3 = ''; $bodyIndex = 0; continue }
    if ($style -eq 'Heading3') { $h3 = $text; $bodyIndex = 0; continue }
    if ($style -match '^Heading') { continue }
    if (-not $text) { continue }
    $bodyIndex++

    if ($h2 -eq 'Tóm tắt kết quả nghiên cứu và thực hiện') {
        if (-not $h3) {
            if ($bodyIndex -gt 2) { $remove.Add($node) }
        }
        elseif ($h3 -eq 'Kết quả về sản phẩm phần mềm') {
            if ($bodyIndex -gt 1) { $remove.Add($node) }
        }
        elseif ($bodyIndex -gt 1) { $remove.Add($node) }
    }
    elseif ($h2 -eq 'Những hạn chế còn tồn tại') {
        if ($bodyIndex -gt 1) { $remove.Add($node) }
    }
    elseif ($h2 -eq 'Kiến nghị và định hướng phát triển') {
        if ($bodyIndex -gt 1) { $remove.Add($node) }
    }
}
Remove-Nodes $remove

# Thay các đoạn Chương 5 còn lại bằng nội dung cô đọng, tránh danh sách rời rạc và lặp Chương 4.
$insideChapter5 = $false
$h2 = ''
$h3 = ''
foreach ($paragraph in @($document.SelectNodes('//w:body/w:p', $ns))) {
    $style = Get-Style $paragraph
    $text = Get-Text $paragraph
    if ($style -eq 'Heading1' -and $text -eq 'TỔNG KẾT VÀ KIẾN NGHỊ') { $insideChapter5 = $true; continue }
    if ($insideChapter5 -and $style -eq 'Heading1') { $insideChapter5 = $false }
    if (-not $insideChapter5) { continue }
    if ($style -eq 'Heading2') { $h2 = $text; $h3 = ''; continue }
    if ($style -eq 'Heading3') { $h3 = $text; continue }
    if (-not $text) { continue }

    if ($h2 -eq 'Tóm tắt kết quả nghiên cứu và thực hiện' -and $h3 -eq 'Kết quả về mô hình và phương pháp đánh giá') {
        Set-Text $paragraph 'Hệ thống tổ chức tiêu chí tuyển dụng theo ASK, sử dụng STAR để hỗ trợ ứng viên trình bày kinh nghiệm, đồng thời cung cấp các cảnh báo cần xác minh và cơ chế che giấu một số dữ liệu cá nhân. Các kết quả này hỗ trợ giải thích quá trình đánh giá nhưng không thay thế quyết định của nhà tuyển dụng.'
    }
    elseif ($h2 -eq 'Tóm tắt kết quả nghiên cứu và thực hiện' -and $h3 -eq 'Kết quả về xử lý hồ sơ và trí tuệ nhân tạo') {
        Set-Text $paragraph 'Hệ thống hiện thực quy trình trích xuất ba lớp cho PDF, DOCX và hình ảnh; chuẩn hóa kỹ năng; kết hợp TF-IDF, độ tương đồng Cosine và Gemini để tạo điểm tham chiếu cùng nhận xét có cấu trúc. Kết quả cho thấy tính khả thi của giải pháp, nhưng chưa đủ dữ liệu chuyên gia gán nhãn để khẳng định một tỷ lệ chính xác cố định.'
    }
    elseif ($h2 -eq 'Tóm tắt kết quả nghiên cứu và thực hiện' -and $h3 -eq 'Kết quả về khai phá dữ liệu') {
        Set-Text $paragraph 'Apriori được dùng để tìm quan hệ đồng xuất hiện giữa kỹ năng, trong khi Two-Phase HUIM khai thác các tập kỹ năng theo hàm độ hữu ích của đề tài. Hai kết quả hỗ trợ đề xuất và phân tích dữ liệu tuyển dụng, nhưng chỉ có ý nghĩa trong phạm vi tập dữ liệu, trọng số và ngưỡng đã cấu hình.'
    }
    elseif ($h2 -eq 'Tóm tắt kết quả nghiên cứu và thực hiện' -and $h3 -eq 'Kết quả về sản phẩm phần mềm') {
        Set-Text $paragraph 'Sản phẩm gồm ba phân hệ cho ứng viên, nhà tuyển dụng và quản trị viên; được xây dựng bằng ReactJS, ASP.NET Core và Python FastAPI, đóng gói bằng Docker và triển khai trên VPS để kiểm tra quy trình thực tế. Hệ thống hỗ trợ đầy đủ luồng từ tạo tin, nộp hồ sơ, phân tích CV đến quản lý trạng thái tuyển dụng.'
    }
    elseif ($h2 -eq 'Tóm tắt kết quả nghiên cứu và thực hiện' -and $h3 -eq 'Kết quả kiểm thử') {
        Set-Text $paragraph 'Kiểm thử chức năng cho thấy các luồng nghiệp vụ chính hoạt động theo kịch bản đề ra. Kết quả JMeter cung cấp số liệu tham khảo trong môi trường thử nghiệm; chưa đủ cơ sở để khẳng định hệ thống duy trì ổn định 1.000 người dùng đồng thời hoặc đạt hiệu năng tương tự trong mọi môi trường.'
    }
    elseif ($h2 -eq 'Những hạn chế còn tồn tại') {
        Set-Text $paragraph 'Hệ thống còn phụ thuộc vào hạn mức và trạng thái của Gemini; chất lượng OCR phụ thuộc tài liệu đầu vào; dữ liệu kiểm thử chủ yếu là giả lập và chưa có tập CV được chuyên gia gán nhãn đủ lớn. Kết quả FitScore, cảnh báo, Apriori và HUIM vì vậy chỉ mang tính hỗ trợ trong phạm vi thử nghiệm. Chức năng ôn tập cũng chưa tự động kiểm chứng chất lượng tài liệu được đề xuất.'
    }
}

# Cập nhật trường Word khi mở file.
$settingsPath = Join-Path $buildPath 'word\settings.xml'
[xml]$settings = Get-Content -LiteralPath $settingsPath -Raw -Encoding UTF8
$settingsNs = New-Object System.Xml.XmlNamespaceManager($settings.NameTable)
$settingsNs.AddNamespace('w', $wNs)
$settingsRoot = $settings.SelectSingleNode('/w:settings', $settingsNs)
$updateFields = $settings.SelectSingleNode('/w:settings/w:updateFields', $settingsNs)
if ($null -eq $updateFields) {
    $updateFields = $settings.CreateElement('w', 'updateFields', $wNs)
    [void]$settingsRoot.AppendChild($updateFields)
}
[void]$updateFields.SetAttribute('val', $wNs, 'true')

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($documentPath, $document.OuterXml, $utf8NoBom)
[System.IO.File]::WriteAllText($settingsPath, $settings.OuterXml, $utf8NoBom)
if (Test-Path -LiteralPath $outputPath) { Remove-Item -LiteralPath $outputPath -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($buildPath, $outputPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)
Remove-Item -LiteralPath $buildPath -Recurse -Force
Write-Output "Created: $outputPath"
