param(
    [string]$Source = "D:\KhoaLuan\BAOCAOKHOALUAN.docx",
    [string]$Output = "D:\KhoaLuan\BAOCAOKHOALUAN_TINH_GON_CHUONG_2.docx"
)

$ErrorActionPreference = 'Stop'
$workspace = [System.IO.Path]::GetFullPath('D:\KhoaLuan')
$sourcePath = [System.IO.Path]::GetFullPath($Source)
$outputPath = [System.IO.Path]::GetFullPath($Output)
$buildPath = [System.IO.Path]::GetFullPath('D:\KhoaLuan\.report_build_ch2')

if (-not $sourcePath.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'File nguồn phải nằm trong workspace.'
}
if (-not $outputPath.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'File kết quả phải nằm trong workspace.'
}
if (-not $buildPath.StartsWith($workspace + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Thư mục tạm không hợp lệ.'
}
if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "Không tìm thấy file nguồn: $sourcePath"
}

Add-Type -AssemblyName System.IO.Compression.FileSystem

if (Test-Path -LiteralPath $buildPath) {
    Remove-Item -LiteralPath $buildPath -Recurse -Force
}
New-Item -ItemType Directory -Path $buildPath | Out-Null
[System.IO.Compression.ZipFile]::ExtractToDirectory($sourcePath, $buildPath)

$documentPath = Join-Path $buildPath 'word\document.xml'
[xml]$document = Get-Content -LiteralPath $documentPath -Raw -Encoding UTF8
$ns = New-Object System.Xml.XmlNamespaceManager($document.NameTable)
$wNs = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
$ns.AddNamespace('w', $wNs)

function Get-ParagraphStyle($paragraph) {
    $styleNode = $paragraph.SelectSingleNode('./w:pPr/w:pStyle', $ns)
    if ($null -eq $styleNode) { return '' }
    return $styleNode.GetAttribute('val', $wNs)
}

function Get-ParagraphText($paragraph) {
    return (($paragraph.SelectNodes('.//w:t', $ns) | ForEach-Object { $_.InnerText }) -join '').Trim()
}

function Test-StructuralParagraph($paragraph, [string]$style, [string]$text) {
    if ($style -match '^Heading[1-4]$') { return $true }
    if ($style -match 'Caption|Ngun|Source') { return $true }
    if ($paragraph.SelectNodes('.//w:drawing|.//w:pict|.//w:object|.//w:oMath|.//w:oMathPara', $ns).Count -gt 0) { return $true }
    if ($text -match '^(Hình|Bảng|Bảng|Nguồn:)\s*2[\.-]') { return $true }
    return $false
}

$body = $document.SelectSingleNode('//w:body', $ns)
$insideChapter = $false
$currentH3 = ''
$currentH4 = ''
$bodyIndex = 0
$nodesToRemove = New-Object System.Collections.Generic.List[System.Xml.XmlNode]

foreach ($node in @($body.ChildNodes)) {
    if ($node.LocalName -ne 'p') {
        continue
    }

    $style = Get-ParagraphStyle $node
    $text = Get-ParagraphText $node

    if ($style -eq 'Heading1' -and $text -eq 'CƠ SỞ LÝ THUYẾT VÀ NGHIÊN CỨU') {
        $insideChapter = $true
        $currentH3 = ''
        $currentH4 = ''
        $bodyIndex = 0
        continue
    }
    if ($insideChapter -and $style -eq 'Heading1') {
        $insideChapter = $false
        continue
    }
    if (-not $insideChapter) {
        continue
    }

    if ($style -eq 'Heading2') {
        $currentH3 = ''
        $currentH4 = ''
        $bodyIndex = 0
        continue
    }
    if ($style -eq 'Heading3') {
        $currentH3 = $text
        $currentH4 = ''
        $bodyIndex = 0
        continue
    }
    if ($style -eq 'Heading4') {
        $currentH4 = $text
        $bodyIndex = 0
        continue
    }
    if (-not $text) {
        continue
    }
    if (Test-StructuralParagraph $node $style $text) {
        continue
    }

    $bodyIndex++
    $keep = $false

    # Giữ đoạn dẫn nhập ngắn của mỗi mục.
    if ($bodyIndex -le 2) { $keep = $true }

    # Giữ các bước triển khai vì đây là cầu nối giữa lý thuyết và sản phẩm.
    if ($text -match '^Bước\s+\d+' -or $text -match '^Bước\s+\d+\s*[-–:]') { $keep = $true }
    if ($text -match '^(Lớp|Pha|Giai đoạn)\s+\d+') { $keep = $true }

    # Giữ định nghĩa ngắn, ký hiệu và các thành phần của mô hình.
    if ($text -match '^(Situation|Task|Action|Result|Support|Confidence|Lift|Transaction Utility|Transaction-Weighted Utility|Perplexity|Burstiness|TF-IDF|Cosine)\b') { $keep = $true }
    if ($text -match '^[A-Z]{2,8}\s*[=:]' -or $text -match '^Trong đó[:：]') { $keep = $true }

    # Mỗi tiểu mục vẫn phải nêu rõ ít nhất ưu điểm, giới hạn và cách kiểm soát.
    if ($text -match '^(Ưu điểm|Giới hạn|Hạn chế|Tuy nhiên|Vì vậy|Do đó)[:：]') { $keep = $true }

    # Giữ câu kết luận gắn trực tiếp lý thuyết với phạm vi của đề tài.
    if ($text -match '^Trong (hệ thống|phạm vi đề tài|phạm vi triển khai)' -and $bodyIndex -le 5) { $keep = $true }

    # Không tách nhận định học thuật khỏi nguồn: giữ mọi đoạn có trích dẫn IEEE.
    if ($text -match '\[[0-9]+\](,\s*\[[0-9]+\])*') { $keep = $true }

    if (-not $keep) {
        $nodesToRemove.Add($node)
    }
}

foreach ($node in $nodesToRemove) {
    [void]$body.RemoveChild($node)
}

# Sửa lỗi khoảng trắng nhỏ có sẵn trong câu mở đầu quy trình ba lớp.
foreach ($paragraph in $document.SelectNodes('//w:p', $ns)) {
    $paragraphText = Get-ParagraphText $paragraph
    if ($paragraphText -like 'Lớp 1 -Trích xuất*') {
        $correctedText = $paragraphText.Replace('Lớp 1 -Trích xuất', 'Lớp 1 - Trích xuất')
        $textNodes = @($paragraph.SelectNodes('.//w:t', $ns))
        if ($textNodes.Count -gt 0) {
            $textNodes[0].InnerText = $correctedText
            for ($i = 1; $i -lt $textNodes.Count; $i++) {
                $textNodes[$i].InnerText = ''
            }
        }
    }
}

# Yêu cầu Word cập nhật mục lục và các trường tham chiếu khi mở tài liệu.
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
$updateFields.SetAttribute('val', $wNs, 'true')

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($documentPath, $document.OuterXml, $utf8NoBom)
[System.IO.File]::WriteAllText($settingsPath, $settings.OuterXml, $utf8NoBom)

if (Test-Path -LiteralPath $outputPath) {
    Remove-Item -LiteralPath $outputPath -Force
}
[System.IO.Compression.ZipFile]::CreateFromDirectory($buildPath, $outputPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)

$removed = $nodesToRemove.Count
Remove-Item -LiteralPath $buildPath -Recurse -Force
Write-Output "Created: $outputPath"
Write-Output "Removed chapter 2 paragraphs: $removed"
