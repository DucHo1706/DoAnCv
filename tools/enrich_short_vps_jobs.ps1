param(
    [Parameter(Mandatory = $true)][string]$RecruiterEmail,
    [Parameter(Mandatory = $true)][string]$RecruiterPassword,
    [Parameter(Mandatory = $true)][string]$AdminEmail,
    [Parameter(Mandatory = $true)][string]$AdminPassword,
    [string]$BaseUrl = 'https://recruitinsightai.com'
)

$ErrorActionPreference = 'Stop'

function Get-Token([string]$email, [string]$password) {
    $body = @{ email = $email; password = $password } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/Auth/login" -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 60
    $token = if ($response.token) { $response.token } else { $response.accessToken }
    if (-not $token) { throw "Không lấy được token cho $email" }
    return $token
}

function Get-Template([string]$categoryId, [string]$title) {
    switch -Regex ($categoryId) {
        'realestate' {
            return @{
                Description = @(
                    'Tìm hiểu nhu cầu, ngân sách và mục tiêu sử dụng của khách hàng để tư vấn sản phẩm bất động sản phù hợp.',
                    'Cung cấp thông tin minh bạch về pháp lý, tiến độ, chính sách bán hàng và phương án tài chính của từng dự án.',
                    'Hướng dẫn khách hàng chuẩn bị hồ sơ đặt cọc, hợp đồng và thủ tục vay vốn; phối hợp với ngân hàng và bộ phận pháp lý.',
                    'Cập nhật dữ liệu khách hàng, theo dõi quá trình tư vấn và chăm sóc sau giao dịch trên hệ thống quản lý.'
                )
                Requirements = @(
                    'Có kiến thức cơ bản về thị trường bất động sản, quy trình giao dịch và hồ sơ vay mua nhà là lợi thế.',
                    'Giao tiếp, tư vấn, đàm phán và xử lý tình huống tốt; tôn trọng tính chính xác của thông tin cung cấp cho khách hàng.',
                    'Chủ động tìm kiếm khách hàng, theo sát mục tiêu công việc và có khả năng làm việc độc lập.',
                    'Sử dụng được công cụ văn phòng và có khả năng cập nhật dữ liệu khách hàng đầy đủ.'
                )
            }
        }
        'logistics' {
            return @{
                Description = @(
                    'Lập kế hoạch vận chuyển, phân bổ phương tiện và theo dõi tiến độ giao nhận theo từng đơn hàng.',
                    'Phối hợp với kho, nhà cung cấp, đơn vị vận tải và khách hàng để xử lý thay đổi hoặc sự cố phát sinh.',
                    'Kiểm soát chứng từ giao nhận, chi phí vận tải, tỷ lệ giao đúng hạn và tình trạng hàng hóa.',
                    'Tổng hợp số liệu vận hành, phân tích nguyên nhân chậm trễ và đề xuất cải tiến chuỗi cung ứng.'
                )
                Requirements = @(
                    'Có kiến thức về logistics, vận tải, quản lý kho hoặc chuỗi cung ứng.',
                    'Có khả năng lập kế hoạch, điều phối nhiều đầu việc và xử lý sự cố trong thời gian ngắn.',
                    'Sử dụng tốt Excel hoặc phần mềm quản lý vận tải/kho; làm việc cẩn thận với chứng từ và số liệu.',
                    'Giao tiếp và phối hợp tốt với đối tác, tài xế, kho vận và các phòng ban liên quan.'
                )
            }
        }
        'medical' {
            return @{
                Description = @(
                    'Tiếp nhận, thăm khám hoặc tư vấn người bệnh theo đúng phạm vi chuyên môn và quy trình của đơn vị.',
                    'Kiểm tra thông tin, hồ sơ chuyên môn và hướng dẫn sử dụng thuốc hoặc kế hoạch chăm sóc an toàn.',
                    'Phối hợp với bác sĩ, dược sĩ, điều dưỡng và các bộ phận liên quan khi cần hội chẩn hoặc xử lý bất thường.',
                    'Cập nhật hồ sơ đầy đủ, bảo mật thông tin người bệnh và tuân thủ quy định chuyên môn hiện hành.'
                )
                Requirements = @(
                    'Tốt nghiệp đúng chuyên ngành và có chứng chỉ hành nghề phù hợp nếu vị trí pháp luật yêu cầu.',
                    'Nắm vững kiến thức chuyên môn, quy trình an toàn và nguyên tắc bảo mật thông tin người bệnh.',
                    'Cẩn thận, có trách nhiệm, giao tiếp rõ ràng và biết xử lý tình huống trong phạm vi chuyên môn.',
                    'Ưu tiên ứng viên có kinh nghiệm tại bệnh viện, phòng khám hoặc nhà thuốc đạt chuẩn.'
                )
            }
        }
        'edu' {
            return @{
                Description = @(
                    'Xây dựng kế hoạch giảng dạy theo mục tiêu, trình độ đầu vào và tiến độ học tập của từng học viên.',
                    'Chuẩn bị giáo án, bài tập, học liệu và tổ chức hoạt động giúp học viên vận dụng kiến thức.',
                    'Theo dõi kết quả, nhận xét điểm mạnh và nội dung cần cải thiện; trao đổi định kỳ với học viên hoặc phụ huynh.',
                    'Tham gia cập nhật học liệu, chuẩn hóa chất lượng lớp học và các hoạt động chuyên môn của đơn vị.'
                )
                Requirements = @(
                    'Có nền tảng chuyên môn phù hợp với môn giảng dạy; ưu tiên ứng viên có chứng chỉ nghiệp vụ hoặc chứng chỉ quốc tế liên quan.',
                    'Trình bày rõ ràng, kiên nhẫn và có khả năng điều chỉnh phương pháp theo năng lực người học.',
                    'Có kỹ năng soạn giáo án, đánh giá kết quả và sử dụng công cụ dạy học trực tuyến.',
                    'Có trách nhiệm với tiến độ lớp học và phối hợp tốt với học viên, phụ huynh và bộ phận đào tạo.'
                )
            }
        }
        'finance' {
            return @{
                Description = @(
                    'Thu thập, kiểm tra và tổng hợp số liệu tài chính, kế toán hoặc kiểm soát theo phạm vi phụ trách.',
                    'Lập báo cáo định kỳ, đối chiếu chứng từ và phân tích các chênh lệch hoặc rủi ro cần xử lý.',
                    'Phối hợp với các phòng ban, ngân hàng, kiểm toán hoặc cơ quan liên quan để hoàn thiện hồ sơ đúng hạn.',
                    'Đề xuất biện pháp cải thiện quy trình, tăng tính chính xác và tuân thủ trong quản lý tài chính.'
                )
                Requirements = @(
                    'Tốt nghiệp Tài chính, Kế toán, Kiểm toán hoặc chuyên ngành liên quan.',
                    'Nắm được nguyên tắc kế toán, phân tích tài chính, kiểm soát nội bộ hoặc quy định thuế phù hợp với vị trí.',
                    'Sử dụng tốt Excel và phần mềm nghiệp vụ; tư duy số liệu chính xác, có khả năng kiểm tra chéo.',
                    'Trung thực, bảo mật thông tin và chịu được áp lực thời hạn báo cáo.'
                )
            }
        }
        'hr' {
            return @{
                Description = @(
                    'Tiếp nhận nhu cầu nhân sự, phối hợp với quản lý để xác định yêu cầu và kế hoạch triển khai.',
                    'Thực hiện các nghiệp vụ tuyển dụng, phát triển nhân sự hoặc quan hệ lao động theo phạm vi vị trí.',
                    'Theo dõi dữ liệu nhân sự, lập báo cáo và đề xuất giải pháp cải thiện hiệu quả nguồn nhân lực.',
                    'Bảo đảm quy trình tuân thủ chính sách nội bộ, pháp luật lao động và nguyên tắc bảo mật thông tin.'
                )
                Requirements = @(
                    'Tốt nghiệp Quản trị nhân lực, Luật, Kinh tế hoặc chuyên ngành liên quan.',
                    'Hiểu quy trình nhân sự và các quy định lao động cơ bản; có khả năng làm việc với nhiều phòng ban.',
                    'Giao tiếp, phỏng vấn, tư vấn và xử lý tình huống tốt.',
                    'Sử dụng được Excel hoặc phần mềm HRM; làm việc có hệ thống và bảo mật dữ liệu.'
                )
            }
        }
        'mkt' {
            return @{
                Description = @(
                    'Lập kế hoạch nội dung hoặc chiến dịch theo mục tiêu thương hiệu, khách hàng và ngân sách được giao.',
                    'Triển khai hoạt động trên các kênh phù hợp; phối hợp với thiết kế, kinh doanh và đối tác truyền thông.',
                    'Theo dõi các chỉ số tiếp cận, tương tác, chuyển đổi và chi phí để đánh giá hiệu quả.',
                    'Thực hiện thử nghiệm, phân tích dữ liệu và đề xuất tối ưu thông điệp, nội dung hoặc kênh triển khai.'
                )
                Requirements = @(
                    'Có kiến thức về marketing số, hành vi khách hàng, nội dung hoặc quản trị kênh phù hợp với vị trí.',
                    'Biết sử dụng công cụ đo lường và đọc các chỉ số hiệu quả chiến dịch.',
                    'Có khả năng viết, trình bày ý tưởng, phối hợp sáng tạo và quản lý thời hạn.',
                    'Ưu tiên ứng viên có portfolio hoặc kết quả chiến dịch được mô tả bằng số liệu.'
                )
            }
        }
        'sales' {
            return @{
                Description = @(
                    'Tìm kiếm, tiếp cận và xác định nhu cầu của khách hàng phù hợp với sản phẩm hoặc dịch vụ.',
                    'Tư vấn giải pháp, chuẩn bị báo giá, đàm phán và theo dõi quá trình ký kết hợp đồng.',
                    'Quản lý dữ liệu và lịch sử tương tác khách hàng; phối hợp với bộ phận triển khai và chăm sóc sau bán.',
                    'Theo dõi chỉ tiêu doanh số, tỷ lệ chuyển đổi và lập kế hoạch phát triển khách hàng theo từng giai đoạn.'
                )
                Requirements = @(
                    'Có kỹ năng giao tiếp, tư vấn, thuyết trình và đàm phán.',
                    'Chủ động tìm kiếm cơ hội, quản lý pipeline và kiên trì theo đuổi mục tiêu.',
                    'Có khả năng tìm hiểu sản phẩm, phân tích nhu cầu và đề xuất giải pháp phù hợp.',
                    'Biết sử dụng công cụ văn phòng hoặc CRM; ưu tiên kinh nghiệm bán hàng trong lĩnh vực liên quan.'
                )
            }
        }
        'it' {
            return @{
                Description = @(
                    "Phân tích yêu cầu và phát triển các chức năng phù hợp với vai trò $title trong dự án.",
                    'Phối hợp với các thành viên liên quan để thiết kế giải pháp, tích hợp và kiểm thử sản phẩm.',
                    'Quản lý mã nguồn bằng Git, xử lý lỗi và viết tài liệu kỹ thuật cho phần việc phụ trách.',
                    'Theo dõi hiệu năng, chất lượng và đề xuất cải tiến kiến trúc hoặc quy trình phát triển.'
                )
                Requirements = @(
                    "Có kiến thức nền tảng và kinh nghiệm dự án phù hợp với vị trí $title.",
                    'Hiểu quy trình phát triển phần mềm, REST API, cơ sở dữ liệu và quản lý mã nguồn ở mức phù hợp.',
                    'Có tư duy phân tích, khả năng debug, tự học công nghệ và đọc tài liệu kỹ thuật tiếng Anh.',
                    'Giao tiếp, làm việc nhóm tốt; mô tả rõ vai trò và kết quả trong các dự án đã tham gia.'
                )
            }
        }
        'cs' {
            return @{
                Description = @(
                    'Tiếp nhận yêu cầu qua điện thoại, email hoặc kênh trực tuyến và xác định đúng nhu cầu khách hàng.',
                    'Hướng dẫn sử dụng dịch vụ, xử lý phản ánh trong phạm vi thẩm quyền và chuyển cấp khi cần.',
                    'Ghi nhận đầy đủ nội dung trao đổi, kết quả xử lý và lịch hẹn chăm sóc tiếp theo.',
                    'Tổng hợp vấn đề thường gặp, theo dõi mức độ hài lòng và đề xuất cải thiện trải nghiệm khách hàng.'
                )
                Requirements = @(
                    'Giao tiếp rõ ràng, biết lắng nghe, bình tĩnh và có khả năng xử lý tình huống.',
                    'Sử dụng tốt máy tính, công cụ văn phòng hoặc phần mềm chăm sóc khách hàng.',
                    'Có tinh thần phục vụ, trách nhiệm và tuân thủ quy trình bảo mật thông tin.',
                    'Ưu tiên ứng viên có kinh nghiệm chăm sóc khách hàng, tổng đài hoặc dịch vụ.'
                )
            }
        }
        default {
            return @{
                Description = @(
                    "Thực hiện các nhiệm vụ chuyên môn của vị trí $title theo kế hoạch và quy trình của đơn vị.",
                    'Phối hợp với các phòng ban liên quan để xử lý công việc và bảo đảm tiến độ.',
                    'Theo dõi kết quả, cập nhật dữ liệu và lập báo cáo định kỳ cho quản lý trực tiếp.',
                    'Đề xuất cải tiến giúp nâng cao chất lượng, hiệu quả và trải nghiệm của khách hàng.'
                )
                Requirements = @(
                    "Có kiến thức hoặc kinh nghiệm phù hợp với vị trí $title.",
                    'Có tư duy giải quyết vấn đề, khả năng sắp xếp công việc và tuân thủ thời hạn.',
                    'Giao tiếp và phối hợp nhóm tốt; chủ động học hỏi và tiếp nhận phản hồi.',
                    'Sử dụng được các công cụ văn phòng và phần mềm nghiệp vụ liên quan.'
                )
            }
        }
    }
}

function Format-Bullets([string]$original, [object[]]$additional) {
    $items = @($original.Trim().TrimStart('-', '•', ' ')) + $additional
    return ($items | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | ForEach-Object { "- $($_.Trim())" }) -join "`n"
}

function Normalize-Salary([string]$salaryRange) {
    $matches = [regex]::Matches($salaryRange, '\d+(?:[\.,]\d+)?')
    if ($matches.Count -ge 2) {
        $min = [decimal]::Parse($matches[0].Value.Replace(',', '.'), [Globalization.CultureInfo]::InvariantCulture)
        $max = [decimal]::Parse($matches[1].Value.Replace(',', '.'), [Globalization.CultureInfo]::InvariantCulture)
        return "$([int][math]::Round($min)) - $([int][math]::Round($max)) triệu"
    }
    return $salaryRange
}

$recruiterToken = Get-Token $RecruiterEmail $RecruiterPassword
$adminToken = Get-Token $AdminEmail $AdminPassword
$recruiterHeaders = @{ Authorization = "Bearer $recruiterToken" }
$adminHeaders = @{ Authorization = "Bearer $adminToken" }

$published = Invoke-RestMethod -Uri "$BaseUrl/api/Jobs/published?page=1&pageSize=100" -TimeoutSec 60
$applications = Invoke-RestMethod -Uri "$BaseUrl/api/Recruitment/hr/applications" -Headers $recruiterHeaders -TimeoutSec 60
$applicationCounts = @{}
$applications | Group-Object jobId | ForEach-Object { $applicationCounts[$_.Name] = $_.Count }

$targets = @($published.items | Where-Object {
    $_.id -like 'job-seed-*' -and $_.description.Length -lt 180 -and -not $applicationCounts.ContainsKey($_.id)
})

$updated = [System.Collections.Generic.List[string]]::new()
$failed = [System.Collections.Generic.List[string]]::new()

foreach ($target in $targets) {
    try {
        $review = Invoke-RestMethod -Uri "$BaseUrl/api/Jobs/$($target.id)/review" -Headers $recruiterHeaders -TimeoutSec 60
        $job = $review.jobInfo
        if ($review.stats.applicationsCount -gt 0) {
            $failed.Add("$($target.id): bỏ qua vì đã có hồ sơ")
            continue
        }

        $template = Get-Template $job.category.id $job.position.name
        $request = @{
            positionId = $job.position.id
            branchId = $job.branch.id
            categoryId = $job.category.id
            jobLevelId = if ($job.jobLevel) { $job.jobLevel.id } else { $null }
            description = Format-Bullets $job.description $template.Description
            requirements = Format-Bullets $job.requirements $template.Requirements
            salaryRange = Normalize-Salary $job.salaryRange
            criteria = @($job.criteria | ForEach-Object { @{ name = $_.name; weight = [int]$_.weight } })
            startDate = $job.startDate
            deadline = $job.deadline
            maxCandidates = $job.maxCandidates
        }

        $json = $request | ConvertTo-Json -Depth 8
        Invoke-RestMethod -Uri "$BaseUrl/api/Jobs/$($target.id)" -Method Put -Headers $recruiterHeaders -ContentType 'application/json; charset=utf-8' -Body $json -TimeoutSec 60 | Out-Null
        Invoke-RestMethod -Uri "$BaseUrl/api/Jobs/$($target.id)/approve" -Method Post -Headers $adminHeaders -TimeoutSec 60 | Out-Null
        $updated.Add("$($target.id): $($job.position.name)")
        Start-Sleep -Milliseconds 250
    }
    catch {
        $failed.Add("$($target.id): $($_.Exception.Message)")
    }
}

"UPDATED=$($updated.Count)"
$updated
"FAILED=$($failed.Count)"
$failed
