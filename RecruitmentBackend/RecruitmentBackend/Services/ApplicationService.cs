using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecruitmentBackend.Controllers;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Utilities;
using RecruitmentBackend.Models;
using RecruitmentBackend.Constants;
using RecruitmentBackend.DTOs.Requests;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Threading.Tasks;
using System.Net.Http;
using Microsoft.AspNetCore.SignalR;
using RecruitmentBackend.Hubs;

namespace RecruitmentBackend.Services
{
    public class ApplicationService : IApplicationService
    {
        private readonly AppDbContext _context;
        private readonly IFileService _fileService;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly IHubContext<AIEvaluationHub> _hubContext;
        private readonly INotificationService _notificationService;
        private readonly IAiService _aiService;
        private readonly IHttpClientFactory _httpClientFactory;

        public ApplicationService(
            AppDbContext context,
            IFileService fileService,
            IServiceScopeFactory serviceScopeFactory,
            IHubContext<AIEvaluationHub> hubContext,
            INotificationService notificationService,
            IAiService aiService,
            IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _fileService = fileService;
            _serviceScopeFactory = serviceScopeFactory;
            _hubContext = hubContext;
            _notificationService = notificationService;
            _aiService = aiService;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<(bool IsSuccess, string Message, object Data)> RetryAiEvaluationAsync(
            string applicationId,
            ClaimsPrincipal user)
        {
            var accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(accountId))
                return (false, "Không xác định được tài khoản đang đăng nhập.", null);

            var applicationData = await (
                from application in _context.Applications
                join cv in _context.CandidateCVs on application.CVID equals cv.CVID
                join candidate in _context.Candidates on cv.CandidateID equals candidate.CandidateID
                where application.ApplicationID == applicationId && candidate.AccountID == accountId
                select new { application, cv }
            ).FirstOrDefaultAsync();

            if (applicationData == null)
                return (false, "Không tìm thấy hồ sơ ứng tuyển hoặc bạn không có quyền thao tác.", null);

            var evaluation = await _context.AIEvaluations
                .FirstOrDefaultAsync(item => item.ApplicationID == applicationId);
            if (evaluation != null
                && !string.Equals(evaluation.Classification, "AI_ERROR", StringComparison.OrdinalIgnoreCase)
                && HasCompleteDetailedAnalysis(evaluation.Reason))
                return (false, "Hồ sơ đã có kết quả AI và không cần phân tích lại.", null);

            byte[] fileBytes = Array.Empty<byte>();
            var fileName = "CV.pdf";
            var contentType = "application/pdf";
            var structuredText = applicationData.cv.SourceType == "CvBuilder"
                ? applicationData.cv.RawText
                : null;

            if (string.IsNullOrWhiteSpace(structuredText))
            {
                if (string.IsNullOrWhiteSpace(applicationData.cv.FilePath)
                    || !Uri.TryCreate(applicationData.cv.FilePath, UriKind.Absolute, out var fileUri))
                {
                    return (false, "Không tìm thấy tệp CV đã nộp để chạy lại phân tích.", null);
                }

                try
                {
                    var client = _httpClientFactory.CreateClient();
                    fileBytes = await client.GetByteArrayAsync(fileUri);
                    fileName = CvFileNameHelper.GetDisplayName(fileUri.LocalPath, "CV.pdf");
                    contentType = Path.GetExtension(fileName).ToLowerInvariant() switch
                    {
                        ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        ".png" => "image/png",
                        ".jpg" or ".jpeg" => "image/jpeg",
                        ".webp" => "image/webp",
                        _ => "application/pdf"
                    };
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Không tải được CV để phân tích lại {applicationId}: {ex.Message}");
                    return (false, "Không tải được tệp CV đã nộp. Vui lòng liên hệ nhà tuyển dụng để được hỗ trợ.", null);
                }
            }
            else
            {
                fileBytes = new byte[] { 0 };
                fileName = "CV-truc-tuyen.pdf";
            }

            if (evaluation != null)
            {
                _context.AIEvaluations.Remove(evaluation);
                await _context.SaveChangesAsync();
            }

            var bytesForAi = fileBytes;
            var textForAi = structuredText;
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _serviceScopeFactory.CreateScope();
                    var aiEvaluationService = scope.ServiceProvider.GetRequiredService<IAiEvaluationService>();
                    await aiEvaluationService.RunAiEvaluationInBackgroundAsync(
                        applicationId, bytesForAi, fileName, contentType, textForAi);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Lỗi chạy lại AI cho {applicationId}: {ex.Message}");
                }
            });

            return (true, "Hệ thống đã bắt đầu phân tích lại hồ sơ. Bạn không cần nộp CV lần nữa.", new
            {
                applicationId,
                aiStatus = "Processing"
            });
        }

        public async Task<(bool IsSuccess, string Message, object Data)> WithdrawApplicationAsync(
            string applicationId,
            ClaimsPrincipal user)
        {
            var accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(accountId))
                return (false, "Không xác định được tài khoản đang đăng nhập.", null);

            var applicationData = await (
                from item in _context.Applications
                join cv in _context.CandidateCVs on item.CVID equals cv.CVID
                join candidate in _context.Candidates on cv.CandidateID equals candidate.CandidateID
                where item.ApplicationID == applicationId && candidate.AccountID == accountId
                select new { Application = item, Snapshot = cv }
            ).FirstOrDefaultAsync();

            if (applicationData == null)
                return (false, "Không tìm thấy hồ sơ ứng tuyển hoặc bạn không có quyền rút hồ sơ này.", null);

            var application = applicationData.Application;

            if (!string.Equals(application.Status, "Applied", StringComparison.OrdinalIgnoreCase))
                return (false, "Chỉ có thể rút hồ sơ khi đang ở trạng thái Đã nộp và HR chưa bắt đầu xử lý.", null);

            var hasInterview = await _context.InterviewSchedules
                .AnyAsync(item => item.ApplicationID == applicationId);
            var hasHrInteraction = await _context.TalentPoolInteractions
                .AnyAsync(item => item.ApplicationID == applicationId);
            if (hasInterview || hasHrInteraction)
                return (false, "Hồ sơ đã được nhà tuyển dụng xử lý nên không thể rút để nộp lại.", null);

            _context.Applications.Remove(application);
            await _context.SaveChangesAsync();

            // CandidateCV được tạo riêng cho mỗi lần nộp. Xóa snapshot sau khi đã
            // xóa đơn, nhưng giữ nguyên CvBuilderDocument/ hồ sơ gốc để nộp lại.
            var snapshotStillUsed = await _context.Applications
                .AnyAsync(item => item.CVID == applicationData.Snapshot.CVID);
            if (!snapshotStillUsed)
            {
                _context.CandidateCVs.Remove(applicationData.Snapshot);
                await _context.SaveChangesAsync();
            }

            return (true, "Đã rút hồ sơ ứng tuyển. Bạn có thể chọn CV và nộp lại cho vị trí này.", new
            {
                applicationId,
                jobId = application.JobID
            });
        }

        private static bool HasCompleteDetailedAnalysis(string? reason)
        {
            if (string.IsNullOrWhiteSpace(reason)) return false;
            try
            {
                using var document = JsonDocument.Parse(reason);
                var root = document.RootElement;
                return root.ValueKind == JsonValueKind.Object
                    && root.TryGetProperty("analysis_version", out var analysisVersion)
                    && analysisVersion.ValueKind == JsonValueKind.Number
                    && analysisVersion.TryGetInt32(out var version)
                    && version >= 4
                    && root.TryGetProperty("score_analysis", out var scoreAnalysis)
                    && scoreAnalysis.ValueKind == JsonValueKind.Object
                    && root.TryGetProperty("criteria_results", out var criteriaResults)
                    && criteriaResults.ValueKind == JsonValueKind.Array
                    && root.TryGetProperty("optimization_tips", out var optimizationTips)
                    && optimizationTips.ValueKind == JsonValueKind.Array
                    && optimizationTips.GetArrayLength() > 0
                    && root.TryGetProperty("language_review", out var languageReview)
                    && languageReview.ValueKind == JsonValueKind.Object
                    && (!languageReview.TryGetProperty("insufficient_data", out var insufficientData)
                        || insufficientData.ValueKind != JsonValueKind.True)
                    && (!languageReview.TryGetProperty("is_fallback", out var languageFallback)
                        || languageFallback.ValueKind != JsonValueKind.True)
                    && root.TryGetProperty("mock_interview", out var studyPlan)
                    && studyPlan.ValueKind == JsonValueKind.Array
                    && studyPlan.GetArrayLength() > 0;
            }
            catch (JsonException)
            {
                return false;
            }
        }

        private static readonly HashSet<string> AllowedCvExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".docx", ".png", ".jpg", ".jpeg", ".webp"
        };

        private static string? ValidateCvFile(byte[] bytes, string fileName)
        {
            if (bytes.Length == 0) return "Tệp CV đang trống.";
            if (bytes.Length > 10 * 1024 * 1024) return "Tệp CV vượt quá dung lượng tối đa 10 MB.";
            var extension = Path.GetExtension(fileName);
            if (!AllowedCvExtensions.Contains(extension))
                return "Định dạng tệp không được hỗ trợ. Vui lòng dùng PDF, DOCX, PNG, JPG hoặc WEBP.";

            bool signatureMatches = extension.ToLowerInvariant() switch
            {
                ".pdf" => bytes.Length >= 5 && bytes.AsSpan(0, 5).SequenceEqual("%PDF-"u8),
                ".docx" => bytes.Length >= 2 && bytes[0] == (byte)'P' && bytes[1] == (byte)'K',
                ".png" => bytes.Length >= 8 && bytes.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }),
                ".jpg" or ".jpeg" => bytes.Length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF,
                ".webp" => bytes.Length >= 12 && bytes.AsSpan(0, 4).SequenceEqual("RIFF"u8) && bytes.AsSpan(8, 4).SequenceEqual("WEBP"u8),
                _ => false
            };
            return signatureMatches ? null : "Nội dung tệp không đúng với định dạng được khai báo hoặc tệp đã bị hỏng.";
        }

        private static string BuildCvBuilderText(string contentJson)
        {
            using var document = JsonDocument.Parse(contentJson);
            var output = new StringBuilder();
            AppendBuilderValue(document.RootElement, output, null);
            return output.ToString().Trim();
        }

        private static void AppendBuilderValue(JsonElement element, StringBuilder output, string? label)
        {
            if (element.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in element.EnumerateObject())
                {
                    // Dữ liệu trình bày của CV Builder không phải nội dung nghề nghiệp và
                    // tuyệt đối không được đưa chuỗi base64/icon vào pipeline chấm điểm AI.
                    if (property.Name.Equals("avatarDataUrl", StringComparison.OrdinalIgnoreCase)
                        || property.Name.Equals("imageDataUrl", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }
                    AppendBuilderValue(property.Value, output, property.Name);
                }
                return;
            }

            if (element.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in element.EnumerateArray())
                {
                    AppendBuilderValue(item, output, label);
                }
                return;
            }

            if (element.ValueKind != JsonValueKind.String) return;
            var value = element.GetString()?.Trim();
            if (string.IsNullOrWhiteSpace(value)) return;
            output.AppendLine(string.IsNullOrWhiteSpace(label) ? value : $"{label}: {value}");
        }

        public async Task<(bool IsSuccess, string Message, object Data)> ApplyJobAsync(ApplyJobRequest request, ClaimsPrincipal user)
        {
            try
            {
                // 1. Lấy thông tin tài khoản đang đăng nhập
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrWhiteSpace(accountId) == true)
                {
                    return (false, "Không xác định được tài khoản đang đăng nhập.", null);
                }

                // 2. Lấy thông tin ứng viên
                var candidate = await _context.Candidates
                    .AsNoTracking()
                    .FirstOrDefaultAsync(candidateItem => candidateItem.AccountID == accountId);

                if (candidate == null)
                {
                    return (false, "Không tìm thấy thông tin Ứng viên hợp lệ.", null);
                }

                // 3. Lấy thông tin tin tuyển dụng
                var job = await _context.JobPostings.FindAsync(request.JobId);

                if (job == null)
                {
                    return (false, "Công việc bạn ứng tuyển không tồn tại hoặc đã hết hạn.", null);
                }

                DateTime todayVietnam = JobLifecyclePolicy.TodayVietnam;
                if (job.Status != "Published")
                {
                    return (false, "Tin tuyển dụng hiện không mở nhận hồ sơ.", null);
                }

                if (job.StartDate.HasValue && job.StartDate.Value.Date > todayVietnam)
                {
                    return (false, $"Tin tuyển dụng sẽ bắt đầu nhận hồ sơ từ ngày {job.StartDate.Value:dd/MM/yyyy}.", null);
                }

                if (job.Deadline.Date < todayVietnam)
                {
                    return (false, $"Tin tuyển dụng đã hết hạn nhận hồ sơ từ ngày {job.Deadline:dd/MM/yyyy}.", null);
                }

                // 4. Kiểm tra ứng viên đã nộp CV cho tin tuyển dụng này chưa
                var candidateCvIds = await _context.CandidateCVs
                    .Where(candidateCv => candidateCv.CandidateID == candidate.CandidateID)
                    .Select(candidateCv => candidateCv.CVID)
                    .ToListAsync();

                if (candidateCvIds.Count > 0)
                {
                    var existingApplication = await _context.Applications
                        .FirstOrDefaultAsync(application =>
                            candidateCvIds.Contains(application.CVID) &&
                            application.JobID == request.JobId);

                    if (existingApplication != null)
                    {
                        var duplicateData = new
                        {
                            applicationId = existingApplication.ApplicationID,
                            jobId = existingApplication.JobID,
                            isDuplicate = true
                        };

                        return (
                            false,
                            "Hồ sơ của bạn cho vị trí này đã được ghi nhận vào hệ thống. Bạn có thể theo dõi tiến độ tại trang Lịch sử ứng tuyển.",
                            duplicateData
                        );
                    }
                }

                // 5. Kiểm tra tin tuyển dụng có tiêu chí đánh giá chưa
                var jobCriteria = await _context.JobCriteria
                    .Where(jobCriterion => jobCriterion.JobID == request.JobId && jobCriterion.IsActive)
                    .ToListAsync();

                if (jobCriteria == null || jobCriteria.Count == 0)
                {
                    return (false, "Tin tuyển dụng này chưa có tiêu chí đánh giá CV.", null);
                }

                // 6. Xử lý tải file CV hoặc dùng CV mặc định
                byte[] cvFileBytes;
                string originalFileName;
                string contentType;
                string cvUrl;
                CvBuilderDocument? sourceBuilderDocument = null;
                string? structuredCvText = null;

                var useStoredCv = request.UseDefaultCv || !string.IsNullOrWhiteSpace(request.SavedCvId);
                if (useStoredCv)
                {
                    CandidateCV? selectedStoredCv = null;
                    if (!string.IsNullOrWhiteSpace(request.SavedCvId))
                    {
                        selectedStoredCv = await _context.CandidateCVs.AsNoTracking()
                            .FirstOrDefaultAsync(item => item.CVID == request.SavedCvId && item.CandidateID == candidate.CandidateID);
                        if (selectedStoredCv == null || string.IsNullOrWhiteSpace(selectedStoredCv.FilePath))
                        {
                            return (false, "Không tìm thấy CV đã lưu hoặc bạn không có quyền sử dụng CV này.", null);
                        }
                    }

                    if (selectedStoredCv == null && string.IsNullOrEmpty(candidate.DefaultCvUrl))
                    {
                        return (false, "Bạn chưa tải lên CV mặc định trong hồ sơ cá nhân.", null);
                    }
                    cvUrl = selectedStoredCv?.FilePath ?? candidate.DefaultCvUrl!;
                    originalFileName = selectedStoredCv == null
                        ? CvFileNameHelper.GetDisplayName(candidate.DefaultCvName ?? cvUrl, "CV_MacDinh.pdf")
                        : CvFileNameHelper.GetDisplayName(cvUrl, "CV.pdf");
                    contentType = Path.GetExtension(originalFileName).ToLowerInvariant() switch
                    {
                        ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        ".png" => "image/png",
                        ".jpg" or ".jpeg" => "image/jpeg",
                        ".webp" => "image/webp",
                        _ => "application/pdf"
                    };

                    // Trích xuất tên file nguyên bản
                    string fileNameOnly = Path.GetFileName(cvUrl);
                    if (cvUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                    {
                        try
                        {
                            var uri = new Uri(cvUrl);
                            fileNameOnly = Path.GetFileName(uri.AbsolutePath);
                        }
                        catch {}
                    }

                    // Ưu tiên đọc file từ đĩa cục bộ (Hoạt động cả trên Docker volume ./Uploads:/app/Uploads)
                    string localPath1 = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", fileNameOnly);
                    string localPath2 = Path.Combine(Directory.GetCurrentDirectory(), cvUrl.TrimStart('/'));

                    if (File.Exists(localPath1))
                    {
                        cvFileBytes = await File.ReadAllBytesAsync(localPath1);
                    }
                    else if (File.Exists(localPath2))
                    {
                        cvFileBytes = await File.ReadAllBytesAsync(localPath2);
                    }
                    else if (cvUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                    {
                        using (var httpClient = new System.Net.Http.HttpClient())
                        {
                            httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
                            var httpResponse = await httpClient.GetAsync(cvUrl);
                            if (!httpResponse.IsSuccessStatusCode)
                            {
                                return (false, $"Không thể tải file CV (Mã lỗi: {httpResponse.StatusCode}). Vui lòng kiểm tra lại file CV.", null);
                            }
                            cvFileBytes = await httpResponse.Content.ReadAsByteArrayAsync();
                        }
                    }
                    else
                    {
                        return (false, "File CV mặc định không tồn tại trên hệ thống. Vui lòng tải lại CV mới trong hồ sơ.", null);
                    }

                    // Kiểm tra phản hồi trả về có phải trang lỗi HTML 404 hay không
                    if (cvFileBytes != null && cvFileBytes.Length > 0 && cvFileBytes.Length < 2000)
                    {
                        string headerText = System.Text.Encoding.UTF8.GetString(cvFileBytes);
                        if (headerText.TrimStart().StartsWith("<html", StringComparison.OrdinalIgnoreCase) || 
                            headerText.TrimStart().StartsWith("<!DOCTYPE", StringComparison.OrdinalIgnoreCase))
                        {
                            return (false, "File CV mặc định bị lỗi liên kết (trả về trang HTML 404). Vui lòng chọn hoặc tải lại file CV.", null);
                        }
                    }
                }
                else
                {
                    if (request.CvFile == null || request.CvFile.Length == 0)
                    {
                        return (false, "Vui lòng chọn file CV.", null);
                    }

                    using (var memoryStream = new MemoryStream())
                    {
                        await request.CvFile.CopyToAsync(memoryStream);
                        cvFileBytes = memoryStream.ToArray();
                    }

                    if (!string.IsNullOrWhiteSpace(request.CvBuilderDocumentId))
                    {
                        sourceBuilderDocument = await _context.CvBuilderDocuments
                            .AsNoTracking()
                            .FirstOrDefaultAsync(document =>
                                document.Id == request.CvBuilderDocumentId
                                && document.CandidateID == candidate.CandidateID);

                        if (sourceBuilderDocument == null)
                        {
                            return (false, "Không tìm thấy CV trực tuyến hoặc bạn không có quyền sử dụng CV này.", null);
                        }

                        var builderDisplayName = CvFileNameHelper.GetDisplayName(sourceBuilderDocument.Name, "CV");
                        originalFileName = Path.ChangeExtension(builderDisplayName, ".pdf");
                        structuredCvText = BuildCvBuilderText(sourceBuilderDocument.ContentJson);
                        if (structuredCvText.Length < 80)
                        {
                            return (false, "CV trực tuyến chưa có đủ nội dung để ứng tuyển. Vui lòng bổ sung thông tin cá nhân, kỹ năng hoặc kinh nghiệm.", null);
                        }
                    }
                    else
                    {
                        originalFileName = request.CvFile.FileName;
                    }
                    contentType = request.CvFile.ContentType;
                    cvUrl = string.Empty;
                }

                var fileValidationError = ValidateCvFile(cvFileBytes, originalFileName);
                if (fileValidationError != null)
                {
                    return (false, fileValidationError, null);
                }

                try
                {
                    if (sourceBuilderDocument == null)
                    {
                        var cvValidation = await _aiService.ValidateCvAsync(cvFileBytes, originalFileName, contentType);
                        if (!cvValidation.IsValid)
                        {
                            return (false, cvValidation.Message, null);
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Lỗi kiểm tra CV trước khi nộp: {ex.Message}");
                    return (false, "Chưa thể kiểm tra nội dung CV lúc này. Vui lòng thử lại sau.", null);
                }

                if (!useStoredCv)
                {
                    cvUrl = await _fileService.SaveFileAsync(request.CvFile!);
                }

                // 7. Lưu thông tin CV vào database trước
                var newCv = new CandidateCV
                {
                    CVID = Guid.NewGuid().ToString(),
                    CandidateID = candidate.CandidateID,
                    FilePath = cvUrl,
                    RawText = structuredCvText ?? "",
                    ExtractedEmail = null,
                    ExtractedPhone = null,
                    CVExtractedSkills = "[]",
                    Degree = null,
                    Major = null,
                    University = null,
                    YearsOfExperience = 0,
                    Certificates = "[]",
                    SourceType = sourceBuilderDocument != null
                        ? "CvBuilder"
                        : useStoredCv ? "Stored" : "Uploaded",
                    SourceDocumentId = sourceBuilderDocument?.Id,
                    CreatedAt = DateTime.Now
                };

                _context.CandidateCVs.Add(newCv);

                // 9. Ghi nhận đơn ứng tuyển trước
                var newApplication = new Application
                {
                    ApplicationID = Guid.NewGuid().ToString(),
                    JobID = request.JobId,
                    CVID = newCv.CVID,
                    Status = "Applied",
                    AppliedAt = DateTime.Now
                };

                _context.Applications.Add(newApplication);
                _context.ApplicationStatusHistories.Add(new ApplicationStatusHistory
                {
                    ApplicationID = newApplication.ApplicationID,
                    FromStatus = string.Empty,
                    ToStatus = ApplicationStatuses.Applied,
                    ChangedAtUtc = DateTime.UtcNow,
                    ChangedByAccountID = accountId,
                    Source = "ApplicationCreated"
                });

                await _context.SaveChangesAsync();

                try
                {
                    await _hubContext.Clients.All.SendAsync("ApplicationCreated", new
                    {
                        applicationId = newApplication.ApplicationID,
                        jobId = newApplication.JobID
                    });
                }
                catch (Exception signalRException)
                {
                    Console.WriteLine("Không thể phát sự kiện hồ sơ mới: " + signalRException.Message);
                }

                // 9.5. Send notification to Recruiter
                try
                {
                    var recruiter = await _context.Recruiters.FindAsync(job.RecruiterID);
                    if (recruiter != null)
                    {
                        string positionName = "Chưa cập nhật";
                        var position = await _context.Positions.FindAsync(job.PositionID);
                        if (position != null) positionName = position.PositionName;

                        await _notificationService.CreateNotificationAsync(
                            recruiter.AccountID,
                            $"Ứng viên mới: {candidate.FullName}",
                            $"{candidate.FullName} đã ứng tuyển vị trí {positionName}, đợt {job.RecruitmentRound}. Mở chiến dịch để xem hồ sơ và kết quả phân tích.",
                            $"/recruiter/applications/{job.JobID}"
                        );
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Lỗi gửi thông báo ứng tuyển mới: " + ex.Message);
                }

                // 10. Kích hoạt AI chạy nền
                string applicationIdForAi = newApplication.ApplicationID;

                _ = Task.Run(async () =>
                {
                    try
                    {
                        using var scope = _serviceScopeFactory.CreateScope();
                        var aiEvaluationService = scope.ServiceProvider.GetRequiredService<IAiEvaluationService>();

                        await aiEvaluationService.RunAiEvaluationInBackgroundAsync(
                            applicationIdForAi,
                            cvFileBytes,
                            originalFileName,
                            contentType,
                            structuredCvText
                        );
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Lỗi background AI: " + ex.Message);
                    }
                });

                var dataToReturn = new
                {
                    message = "Chúc mừng! Hồ sơ của bạn đã được gửi đến nhà tuyển dụng thành công.",
                    applicationId = newApplication.ApplicationID,
                    jobId = newApplication.JobID,
                    cvId = newCv.CVID,
                    cvUrl = cvUrl,
                    aiStatus = "Processing"
                };

                return (true, "Nộp CV thành công", dataToReturn);
            }
            catch (Exception ex)
            {
                string innerError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return (false, $"Lỗi hệ thống khi xử lý CV: {innerError}", null);
            }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> GetHrApplicationsAsync(
            ClaimsPrincipal user,
            bool includeAiDetails = true,
            string? applicationId = null,
            string? jobId = null)
        {
            try
            {
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                var recruiter = await _context.Recruiters.AsNoTracking().FirstOrDefaultAsync(r => r.AccountID == accountId);

                if (recruiter == null)
                {
                    return (false, "Không tìm thấy thông tin Nhà tuyển dụng.", null);
                }

                var branchIds = await _context.RecruiterBranches
                    .AsNoTracking()
                    .Where(rb => rb.RecruiterID == recruiter.RecruiterID)
                    .Select(rb => rb.BranchID)
                    .ToListAsync();

                var rawApplications = await (
                    from app in _context.Applications.AsNoTracking()
                    join job in _context.JobPostings.AsNoTracking() on app.JobID equals job.JobID
                     where (job.RecruiterID == recruiter.RecruiterID || string.IsNullOrEmpty(job.RecruiterID) || branchIds.Contains(job.BranchID))
                         && (applicationId == null || app.ApplicationID == applicationId)
                         && (jobId == null || app.JobID == jobId)
                    join cv in _context.CandidateCVs.AsNoTracking() on app.CVID equals cv.CVID
                    join cand in _context.Candidates.AsNoTracking() on cv.CandidateID equals cand.CandidateID
                    join acc in _context.Accounts.AsNoTracking() on cand.AccountID equals acc.AccountID
                    join ai in _context.AIEvaluations.AsNoTracking() on app.ApplicationID equals ai.ApplicationID into aiGrp
                    from ai in aiGrp.DefaultIfEmpty()
                    join pos in _context.Positions.AsNoTracking() on job.PositionID equals pos.PositionID into posGrp
                    from pos in posGrp.DefaultIfEmpty()
                    orderby ai != null ? ai.FitScore : 0m descending
                    select new
                    {
                        id = app.ApplicationID,
                        candidateId = cand.CandidateID,
                        jobId = job.JobID,
                        jobTitle = pos != null ? pos.PositionName : "Chưa cập nhật",
                        candidateName = cand.FullName,
                        email = acc.Email,
                        accountEmail = acc.Email,
                        cvEmail = cv.ExtractedEmail,
                        cvPhone = cv.ExtractedPhone,
                        status = app.Status,
                        appliedAt = app.AppliedAt,
                        phone = cand.Phone,
                        cvUrl = cv.FilePath,
                        aiScore = ai != null ? ai.FitScore : 0,
                        aiReason = includeAiDetails && ai != null ? ai.Reason : null,
                        matchedSkills = includeAiDetails && ai != null ? ai.MatchedSkills : null,
                        missingSkills = includeAiDetails && ai != null ? ai.MissingSkills : null,
                        classification = ai != null ? ai.Classification : null,
                        criteriaResultsJson = includeAiDetails && ai != null ? ai.CriteriaResultsJson : null
                    }
                ).ToListAsync();

                var applications = new List<object>();

                foreach (var application in rawApplications)
                {
                    List<CriteriaScoreResult> criteriaResults = new List<CriteriaScoreResult>();
                    List<string> matchedSkillsList = new List<string>();
                    List<string> missingSkillsList = new List<string>();

                    if (string.IsNullOrWhiteSpace(application.criteriaResultsJson) == false)
                    {
                        try
                        {
                            var parsedCriteriaResults = JsonSerializer.Deserialize<List<CriteriaScoreResult>>(
                                application.criteriaResultsJson
                            );

                            if (parsedCriteriaResults != null)
                            {
                                criteriaResults = parsedCriteriaResults;
                            }
                        }
                        catch
                        {
                            criteriaResults = new List<CriteriaScoreResult>();
                        }
                    }

                    if (string.IsNullOrWhiteSpace(application.matchedSkills) == false)
                    {
                        try
                        {
                            var parsedMatchedSkills = JsonSerializer.Deserialize<List<string>>(
                                application.matchedSkills
                            );

                            if (parsedMatchedSkills != null)
                            {
                                matchedSkillsList = parsedMatchedSkills;
                            }
                        }
                        catch
                        {
                            matchedSkillsList = new List<string>();
                        }
                    }

                    if (string.IsNullOrWhiteSpace(application.missingSkills) == false)
                    {
                        try
                        {
                            var parsedMissingSkills = JsonSerializer.Deserialize<List<string>>(
                                application.missingSkills
                            );

                            if (parsedMissingSkills != null)
                            {
                                missingSkillsList = parsedMissingSkills;
                            }
                        }
                        catch
                        {
                            missingSkillsList = new List<string>();
                        }
                    }

                    var applicationItem = new
                    {
                        id = application.id,
                        candidateId = application.candidateId,
                        jobId = application.jobId,
                        jobTitle = application.jobTitle,
                        candidateName = application.candidateName,
                        email = application.email,
                        accountEmail = application.accountEmail,
                        cvEmail = application.cvEmail,
                        cvPhone = application.cvPhone,
                        status = application.status,
                        appliedAt = application.appliedAt,
                        phone = application.phone,
                        cvUrl = application.cvUrl,
                        aiScore = application.aiScore,
                        aiReason = application.aiReason,
                        matchedSkills = matchedSkillsList,
                        missingSkills = missingSkillsList,
                        classification = NormalizeClassification(application.classification),
                        criteriaResults = criteriaResults
                    };

                    applications.Add(applicationItem);
                }

                return (true, "Lấy dữ liệu ứng tuyển của HR thành công", applications);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi lấy danh sách ứng tuyển: " + ex.Message, null);
            }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> GetMyApplicationsAsync(ClaimsPrincipal user)
        {
            try
            {
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrWhiteSpace(accountId) == true)
                {
                    return (false, "Không xác định được tài khoản đang đăng nhập.", null);
                }

                var candidate = await _context.Candidates
                    .FirstOrDefaultAsync(candidateItem => candidateItem.AccountID == accountId);

                if (candidate == null)
                {
                    return (false, "Không tìm thấy thông tin Ứng viên.", null);
                }

                var rawApplications = await (
                    from app in _context.Applications.AsNoTracking()
                    join cv in _context.CandidateCVs.AsNoTracking() on app.CVID equals cv.CVID
                    where cv.CandidateID == candidate.CandidateID
                    join job in _context.JobPostings.AsNoTracking() on app.JobID equals job.JobID
                    join ai in _context.AIEvaluations.AsNoTracking() on app.ApplicationID equals ai.ApplicationID into aiGrp
                    from ai in aiGrp.DefaultIfEmpty()
                    join pos in _context.Positions.AsNoTracking() on job.PositionID equals pos.PositionID into posGrp
                    from pos in posGrp.DefaultIfEmpty()
                    orderby app.AppliedAt descending
                    select new
                    {
                        id = app.ApplicationID,
                        candidateId = cv.CandidateID,
                        jobId = app.JobID,
                        cvId = cv.CVID,
                        cvUrl = cv.FilePath,
                        appliedAt = app.AppliedAt,
                        status = app.Status,
                        jobTitle = pos != null ? pos.PositionName : "Chưa cập nhật",
                        hasAiEvaluation = ai != null,
                        aiScore = ai != null ? ai.FitScore : 0,
                        aiReason = ai != null ? ai.Reason : "AI đang phân tích",
                        matchedSkills = ai != null ? ai.MatchedSkills : "[]",
                        missingSkills = ai != null ? ai.MissingSkills : "[]",
                        classification = ai != null ? ai.Classification : null,
                        criteriaResultsJson = ai != null ? ai.CriteriaResultsJson : null
                    }
                ).ToListAsync();

                var applicationIds = rawApplications.Select(item => item.id).ToList();
                var schedulesByApplicationId = await _context.InterviewSchedules
                    .AsNoTracking()
                    .Where(schedule => applicationIds.Contains(schedule.ApplicationID))
                    .ToDictionaryAsync(schedule => schedule.ApplicationID);

                var rejectionRows = await _context.TalentPoolInteractions
                    .AsNoTracking()
                    .Where(interaction => interaction.ApplicationID != null
                        && applicationIds.Contains(interaction.ApplicationID)
                        && interaction.Type == "Rejected")
                    .OrderByDescending(interaction => interaction.CreatedAt)
                    .Select(interaction => new { ApplicationID = interaction.ApplicationID!, interaction.Content, interaction.CreatedAt })
                    .ToListAsync();
                var rejectionByApplicationId = rejectionRows
                    .GroupBy(interaction => interaction.ApplicationID)
                    .ToDictionary(group => group.Key, group => group.First().Content);

                var applications = new List<object>();

                foreach (var application in rawApplications)
                {
                    List<CriteriaScoreResult> criteriaResults = new List<CriteriaScoreResult>();
                    List<string> matchedSkillsList = new List<string>();
                    List<string> missingSkillsList = new List<string>();

                    if (string.IsNullOrWhiteSpace(application.criteriaResultsJson) == false)
                    {
                        try
                        {
                            var parsedCriteriaResults = JsonSerializer.Deserialize<List<CriteriaScoreResult>>(
                                application.criteriaResultsJson
                            );

                            if (parsedCriteriaResults != null)
                            {
                                criteriaResults = parsedCriteriaResults;
                            }
                        }
                        catch
                        {
                            criteriaResults = new List<CriteriaScoreResult>();
                        }
                    }

                    if (string.IsNullOrWhiteSpace(application.matchedSkills) == false)
                    {
                        try
                        {
                            var parsedMatchedSkills = JsonSerializer.Deserialize<List<string>>(
                                application.matchedSkills
                            );

                            if (parsedMatchedSkills != null)
                            {
                                matchedSkillsList = parsedMatchedSkills;
                            }
                        }
                        catch
                        {
                            matchedSkillsList = new List<string>();
                        }
                    }

                    if (string.IsNullOrWhiteSpace(application.missingSkills) == false)
                    {
                        try
                        {
                            var parsedMissingSkills = JsonSerializer.Deserialize<List<string>>(
                                application.missingSkills
                            );

                            if (parsedMissingSkills != null)
                            {
                                missingSkillsList = parsedMissingSkills;
                            }
                        }
                        catch
                        {
                            missingSkillsList = new List<string>();
                        }
                    }

                    string aiStatus = "Processing";

                    if (application.hasAiEvaluation == true)
                    {
                        if (application.classification == "AI_ERROR")
                        {
                            aiStatus = "Failed";
                        }
                        else
                        {
                            aiStatus = "Completed";
                        }
                    }

                    string classification = "Chưa phân loại";

                    if (string.IsNullOrWhiteSpace(application.classification) == false)
                    {
                        classification = application.classification;
                    }

                    schedulesByApplicationId.TryGetValue(application.id, out var schedule);
                    rejectionByApplicationId.TryGetValue(application.id, out var rejectionFeedback);

                    var applicationItem = new
                    {
                        id = application.id,
                        applicationId = application.id,
                        candidateId = application.candidateId,
                        jobId = application.jobId,
                        cvId = application.cvId,
                        cvUrl = application.cvUrl,
                        jobTitle = application.jobTitle,
                        status = application.status,
                        appliedAt = application.appliedAt,
                        hasAiEvaluation = application.hasAiEvaluation,
                        aiAnalysisComplete = application.hasAiEvaluation
                            && HasCompleteDetailedAnalysis(application.aiReason),
                        aiStatus = aiStatus,
                        aiScore = application.aiScore,
                        aiReason = application.aiReason,
                        matchedSkills = matchedSkillsList,
                        missingSkills = missingSkillsList,
                        classification = NormalizeClassification(classification),
                        criteriaResults = criteriaResults,
                        interviewSchedule = schedule != null ? new {
                            interviewDate = schedule.InterviewDate,
                            format = schedule.Format,
                            locationOrLink = schedule.LocationOrLink,
                            meetingId = schedule.MeetingID,
                            passcode = schedule.Passcode,
                            notes = schedule.Notes
                        } : null,
                        rejectionFeedback
                    };

                    applications.Add(applicationItem);
                }

                return (true, "Lấy dữ liệu thành công", applications);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi lấy lịch sử ứng tuyển: " + ex.Message, null);
            }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> UpdateApplicationStatusAsync(
            string applicationId,
            UpdateApplicationStatusRequest request,
            ClaimsPrincipal user)
        {
            try
            {
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrWhiteSpace(accountId) == true)
                {
                    return (false, "Không xác định được tài khoản đang đăng nhập.", null);
                }

                var recruiter = await _context.Recruiters
                    .FirstOrDefaultAsync(recruiterItem => recruiterItem.AccountID == accountId);

                if (recruiter == null)
                {
                    return (false, "Không tìm thấy thông tin Nhà tuyển dụng.", null);
                }

                if (request == null || string.IsNullOrWhiteSpace(request.Status) == true)
                {
                    return (false, "Trạng thái hồ sơ không hợp lệ.", null);
                }

                string newStatus = request.Status.Trim();
                bool isValidStatus = ApplicationStatuses.AllStatuses.Contains(newStatus);

                if (isValidStatus == false)
                {
                    return (false, "Trạng thái hồ sơ không nằm trong danh sách cho phép.", null);
                }

                if (newStatus == ApplicationStatuses.Rejected)
                {
                    return (false, "Vui lòng dùng chức năng Từ chối hồ sơ kèm lý do ở bước tiếp theo.", null);
                }

                var application = await _context.Applications
                    .FirstOrDefaultAsync(applicationItem => applicationItem.ApplicationID == applicationId);

                if (application == null)
                {
                    return (false, "Không tìm thấy hồ sơ ứng tuyển.", null);
                }

                var job = await _context.JobPostings
                    .FirstOrDefaultAsync(jobItem => jobItem.JobID == application.JobID);

                if (job == null)
                {
                    return (false, "Không tìm thấy tin tuyển dụng của hồ sơ này.", null);
                }

                if (job.RecruiterID != recruiter.RecruiterID)
                {
                    return (false, "Bạn không có quyền cập nhật hồ sơ ứng tuyển này.", null);
                }

                if (application.Status == "Interview" && newStatus != "Interview")
                {
                    var schedule = await _context.InterviewSchedules
                        .FirstOrDefaultAsync(s => s.ApplicationID == applicationId);
                    if (schedule != null)
                    {
                        _context.InterviewSchedules.Remove(schedule);
                    }
                }

                string previousStatus = application.Status;
                application.Status = newStatus;

                if (!string.Equals(previousStatus, newStatus, StringComparison.Ordinal))
                {
                    _context.ApplicationStatusHistories.Add(new ApplicationStatusHistory
                    {
                        ApplicationID = application.ApplicationID,
                        FromStatus = previousStatus,
                        ToStatus = newStatus,
                        ChangedAtUtc = DateTime.UtcNow,
                        ChangedByAccountID = accountId,
                        Source = "RecruiterStatusUpdate"
                    });
                }

                await _context.SaveChangesAsync();

                // Trigger notification to candidate
                try
                {
                    var cv = await _context.CandidateCVs.FindAsync(application.CVID);
                    if (cv != null)
                    {
                        var candidateItem = await _context.Candidates.FindAsync(cv.CandidateID);
                        if (candidateItem != null)
                        {
                            string positionName = "Chưa cập nhật";
                            var position = await _context.Positions.FindAsync(job.PositionID);
                            if (position != null) positionName = position.PositionName;

                            string statusText = newStatus switch
                            {
                                "Reviewing" => "Đang xem xét",
                                "Interview" => "Lên lịch phỏng vấn",
                                "Shortlisted" => "Trúng tuyển vòng hồ sơ",
                                "Accepted" => "Đạt yêu cầu (Nhận việc)",
                                _ => newStatus
                            };

                            await _notificationService.CreateNotificationAsync(
                                candidateItem.AccountID,
                                "Cập nhật trạng thái hồ sơ",
                                $"Đơn ứng tuyển vị trí {positionName} của bạn đã chuyển sang trạng thái: {statusText}",
                                "/my-applications"
                            );
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Lỗi gửi thông báo đổi trạng thái: " + ex.Message);
                }

                // Phát SignalR thông báo
                try
                {
                    await _hubContext.Clients.Group(applicationId).SendAsync("ReceiveStatusUpdate", new { applicationId, status = application.Status });
                    await _hubContext.Clients.All.SendAsync("ApplicationStatusChanged", new
                    {
                        applicationId,
                        jobId = application.JobID,
                        status = application.Status
                    });
                }
                catch {}

                var dataToReturn = new
                {
                    applicationId = application.ApplicationID,
                    status = application.Status
                };

                return (true, "Cập nhật trạng thái hồ sơ thành công.", dataToReturn);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi cập nhật trạng thái hồ sơ: " + ex.Message, null);
            }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> RejectApplicationAsync(
            string applicationId,
            RejectApplicationRequest request,
            ClaimsPrincipal user)
        {
            try
            {
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrWhiteSpace(accountId) == true)
                {
                    return (false, "Không xác định được tài khoản đang đăng nhập.", null);
                }

                var recruiter = await _context.Recruiters
                    .FirstOrDefaultAsync(recruiterItem => recruiterItem.AccountID == accountId);

                if (recruiter == null)
                {
                    return (false, "Không tìm thấy thông tin Nhà tuyển dụng.", null);
                }

                if (request == null)
                {
                    return (false, "Dữ liệu từ chối hồ sơ không hợp lệ.", null);
                }

                if (string.IsNullOrWhiteSpace(request.ReasonType) == true)
                {
                    return (false, "Vui lòng chọn lý do từ chối hồ sơ.", null);
                }

                string reasonType = request.ReasonType.Trim();
                string note = "";

                if (string.IsNullOrWhiteSpace(request.Note) == false)
                {
                    note = request.Note.Trim();
                }

                var application = await _context.Applications
                    .FirstOrDefaultAsync(applicationItem => applicationItem.ApplicationID == applicationId);

                if (application == null)
                {
                    return (false, "Không tìm thấy hồ sơ ứng tuyển.", null);
                }

                var job = await _context.JobPostings
                    .FirstOrDefaultAsync(jobItem => jobItem.JobID == application.JobID);

                if (job == null)
                {
                    return (false, "Không tìm thấy tin tuyển dụng của hồ sơ này.", null);
                }

                if (job.RecruiterID != recruiter.RecruiterID)
                {
                    return (false, "Bạn không có quyền từ chối hồ sơ ứng tuyển này.", null);
                }

                var applicationCv = await _context.CandidateCVs
                    .FirstOrDefaultAsync(cvItem => cvItem.CVID == application.CVID);

                if (applicationCv == null)
                {
                    return (false, "Không tìm thấy CV của hồ sơ ứng tuyển.", null);
                }

                var candidate = await _context.Candidates
                    .FirstOrDefaultAsync(candidateItem => candidateItem.CandidateID == applicationCv.CandidateID);

                if (candidate == null)
                {
                    return (false, "Không tìm thấy thông tin ứng viên.", null);
                }

                var candidateAccount = await _context.Accounts
                    .FirstOrDefaultAsync(accountItem => accountItem.AccountID == candidate.AccountID);

                var latestCv = await _context.CandidateCVs
                    .Where(cvItem => cvItem.CandidateID == candidate.CandidateID)
                    .OrderByDescending(cvItem => cvItem.CreatedAt)
                    .FirstOrDefaultAsync();

                var aiEvaluation = await _context.AIEvaluations
                    .FirstOrDefaultAsync(aiItem => aiItem.ApplicationID == application.ApplicationID);

                string jobTitle = "Chưa cập nhật";

                var position = await _context.Positions
                    .FirstOrDefaultAsync(positionItem => positionItem.PositionID == job.PositionID);

                if (position != null)
                {
                    jobTitle = position.PositionName;
                }

                string previousStatus = application.Status;
                application.Status = ApplicationStatuses.Rejected;
                if (!string.Equals(previousStatus, ApplicationStatuses.Rejected, StringComparison.Ordinal))
                {
                    _context.ApplicationStatusHistories.Add(new ApplicationStatusHistory
                    {
                        ApplicationID = application.ApplicationID,
                        FromStatus = previousStatus,
                        ToStatus = ApplicationStatuses.Rejected,
                        ChangedAtUtc = DateTime.UtcNow,
                        ChangedByAccountID = accountId,
                        Source = "RecruiterRejected"
                    });
                }

                var talentPoolCandidate = await _context.TalentPoolCandidates
                    .FirstOrDefaultAsync(poolItem =>
                        poolItem.CandidateID == candidate.CandidateID
                        && poolItem.RecruiterID == job.RecruiterID);

                if (talentPoolCandidate == null)
                {
                    talentPoolCandidate = new TalentPoolCandidate();
                    talentPoolCandidate.CandidateID = candidate.CandidateID;
                    talentPoolCandidate.RecruiterID = job.RecruiterID;
                    await _context.TalentPoolCandidates.AddAsync(talentPoolCandidate);
                }

                talentPoolCandidate.LatestCVID = latestCv != null ? latestCv.CVID : null;
                talentPoolCandidate.FullName = candidate.FullName;

                if (candidateAccount != null)
                {
                    talentPoolCandidate.Email = candidateAccount.Email;
                }
                else
                {
                    talentPoolCandidate.Email = "";
                }

                talentPoolCandidate.Phone = candidate.Phone;

                var highlightSkills = new List<string>();

                AddSkillsFromJson(highlightSkills, applicationCv.CVExtractedSkills);

                if (latestCv != null)
                {
                    AddSkillsFromJson(highlightSkills, latestCv.CVExtractedSkills);
                }

                if (aiEvaluation != null)
                {
                    AddSkillsFromJson(highlightSkills, aiEvaluation.MatchedSkills);
                }

                talentPoolCandidate.HighlightSkillsJson = JsonSerializer.Serialize(
                    highlightSkills,
                    new JsonSerializerOptions
                    {
                        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                    }
                );

                if (aiEvaluation != null)
                {
                    int fitScore = Convert.ToInt32(Math.Round(aiEvaluation.FitScore));

                    if (fitScore > talentPoolCandidate.HighestAiScore)
                    {
                        talentPoolCandidate.HighestAiScore = fitScore;
                        talentPoolCandidate.HighestScoreJobTitle = jobTitle;
                    }
                }

                talentPoolCandidate.CurrentAvailabilityStatus = "Available";
                talentPoolCandidate.LastAppliedAt = application.AppliedAt;
                talentPoolCandidate.LastUpdatedAt = DateTime.Now;
                talentPoolCandidate.Source = "Rejected";
                talentPoolCandidate.IsActive = true;

                string interactionContent = "Lý do từ chối: " + reasonType;

                if (string.IsNullOrWhiteSpace(note) == false)
                {
                    interactionContent = interactionContent + "\nGhi chú: " + note;
                }

                var interaction = new TalentPoolInteraction();
                interaction.TalentPoolCandidateID = talentPoolCandidate.TalentPoolCandidateID;
                interaction.ApplicationID = application.ApplicationID;
                interaction.JobID = application.JobID;
                interaction.Type = "Rejected";
                interaction.Title = "HR từ chối hồ sơ và đưa vào Talent Pool";
                interaction.Content = interactionContent;

                if (aiEvaluation != null)
                {
                    interaction.AiScore = Convert.ToInt32(Math.Round(aiEvaluation.FitScore));
                }

                interaction.StatusSnapshot = ApplicationStatuses.Rejected;
                interaction.CreatedByRecruiterID = recruiter.RecruiterID;
                interaction.CreatedAt = DateTime.Now;

                await _context.TalentPoolInteractions.AddAsync(interaction);

                await _context.SaveChangesAsync();

                // Trigger notification to candidate
                try
                {
                    await _notificationService.CreateNotificationAsync(
                        candidate.AccountID,
                        "Hồ sơ chưa phù hợp",
                        $"Đơn ứng tuyển vị trí {jobTitle} của bạn đã bị từ chối với lý do: {reasonType}",
                        "/my-applications"
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Lỗi gửi thông báo từ chối: " + ex.Message);
                }

                // Phát SignalR thông báo
                try
                {
                    await _hubContext.Clients.Group(applicationId).SendAsync("ReceiveStatusUpdate", new { applicationId, status = application.Status });
                    await _hubContext.Clients.All.SendAsync("ApplicationStatusChanged", new
                    {
                        applicationId,
                        jobId = application.JobID,
                        status = application.Status
                    });
                }
                catch {}

                var dataToReturn = new
                {
                    applicationId = application.ApplicationID,
                    status = application.Status,
                    talentPoolCandidateId = talentPoolCandidate.TalentPoolCandidateID,
                    reasonType = reasonType
                };

                return (true, "Đã từ chối hồ sơ và đưa ứng viên vào Talent Pool.", dataToReturn);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi từ chối hồ sơ: " + ex.Message, null);
            }
        }

        private static string NormalizeClassification(string? classification)
        {
            if (string.IsNullOrWhiteSpace(classification))
            {
                return "Chưa phân loại";
            }

            return classification.Trim().ToLowerInvariant() switch
            {
                "phu hop" => "Phù hợp",
                "phù hợp" => "Phù hợp",
                "nen xem xet" => "Nên xem xét",
                "nên xem xét" => "Nên xem xét",
                "chua phu hop" => "Chưa phù hợp",
                "chưa phù hợp" => "Chưa phù hợp",
                _ => classification.Trim()
            };
        }

        private static void AddSkillsFromJson(List<string> targetSkills, string sourceText)
        {
            if (string.IsNullOrWhiteSpace(sourceText) == true)
            {
                return;
            }

            try
            {
                var skillsList = JsonSerializer.Deserialize<List<string>>(sourceText);

                if (skillsList != null)
                {
                    foreach (var skill in skillsList)
                    {
                        var cleanedSkill = skill.Trim();

                        if (cleanedSkill.Length == 0)
                        {
                            continue;
                        }

                        bool existed = targetSkills.Any(existingSkill =>
                            string.Equals(
                                existingSkill.Trim(),
                                cleanedSkill,
                                StringComparison.OrdinalIgnoreCase
                            )
                        );

                        if (!existed)
                        {
                            targetSkills.Add(cleanedSkill);
                        }
                    }

                    return;
                }
            }
            catch
            {
            }

            var separators = new char[] { ',', ';', '\n', '\r', '|', '/', '\\' };
            var rawSkills = sourceText.Split(separators, StringSplitOptions.RemoveEmptyEntries);

            foreach (var rawSkill in rawSkills)
            {
                var cleanedSkill = rawSkill.Trim();

                if (cleanedSkill.Length == 0)
                {
                    continue;
                }

                bool existed = targetSkills.Any(existingSkill =>
                    string.Equals(
                        existingSkill.Trim(),
                        cleanedSkill,
                        StringComparison.OrdinalIgnoreCase
                    )
                );

                if (!existed)
                {
                    targetSkills.Add(cleanedSkill);
                }
            }
        }
    }
}
