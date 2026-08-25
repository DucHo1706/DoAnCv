using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RecruitmentBackend.Constants;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
using RecruitmentBackend.Settings;
using RecruitmentBackend.Utilities;

namespace RecruitmentBackend.Services
{
    public sealed class AiEvaluationQueueWorker : BackgroundService
    {
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".docx", ".png", ".jpg", ".jpeg", ".webp"
        };

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly AiEvaluationQueueSettings _settings;
        private readonly ILogger<AiEvaluationQueueWorker> _logger;

        public AiEvaluationQueueWorker(
            IServiceScopeFactory scopeFactory,
            IHttpClientFactory httpClientFactory,
            IOptions<AiEvaluationQueueSettings> settings,
            ILogger<AiEvaluationQueueWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _httpClientFactory = httpClientFactory;
            _settings = settings.Value;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await RecoverInterruptedTasksAsync(stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var processed = await ProcessNextAsync(stoppingToken);
                    if (!processed)
                    {
                        await Task.Delay(
                            TimeSpan.FromSeconds(Math.Clamp(_settings.PollIntervalSeconds, 1, 30)),
                            stoppingToken);
                    }
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception exception)
                {
                    _logger.LogError(
                        exception,
                        "Hàng đợi AI gặp lỗi ngoài dự kiến; worker sẽ tiếp tục sau nhịp chờ.");
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                }
            }
        }

        private async Task RecoverInterruptedTasksAsync(CancellationToken cancellationToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var nowUtc = DateTime.UtcNow;
            var staleBeforeUtc = nowUtc.AddMinutes(-Math.Clamp(_settings.StaleProcessingMinutes, 2, 60));
            var interruptedTasks = await context.AiEvaluationTasks
                .Where(item =>
                    item.Status == AiEvaluationTaskStatuses.CancelRequested
                    || (item.Status == AiEvaluationTaskStatuses.Processing
                        && item.ProcessingStartedAtUtc != null
                        && item.ProcessingStartedAtUtc < staleBeforeUtc))
                .ToListAsync(cancellationToken);

            foreach (var item in interruptedTasks)
            {
                if (item.Status == AiEvaluationTaskStatuses.CancelRequested)
                {
                    item.Status = AiEvaluationTaskStatuses.Cancelled;
                    item.CompletedAtUtc = nowUtc;
                }
                else if (item.AttemptCount < item.MaxAttempts)
                {
                    item.Status = AiEvaluationTaskStatuses.RetryScheduled;
                    item.NotBeforeUtc = nowUtc;
                    item.LastErrorCode = "WORKER_INTERRUPTED";
                    item.LastErrorMessage = "Tiến trình xử lý trước đó bị gián đoạn và đã được đưa lại vào hàng đợi.";
                }
                else
                {
                    item.Status = AiEvaluationTaskStatuses.Failed;
                    item.CompletedAtUtc = nowUtc;
                    item.LastErrorCode = "WORKER_INTERRUPTED";
                    item.LastErrorMessage = "Tiến trình xử lý bị gián đoạn và đã hết số lần thử tự động.";
                }

                item.ProcessingStartedAtUtc = null;
                item.UpdatedAtUtc = nowUtc;
            }

            if (interruptedTasks.Count > 0)
            {
                await context.SaveChangesAsync(cancellationToken);
            }
        }

        private async Task<bool> ProcessNextAsync(CancellationToken cancellationToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var evaluationService = scope.ServiceProvider.GetRequiredService<IAiEvaluationService>();
            var nowUtc = DateTime.UtcNow;

            AiEvaluationTask? queueTask;
            await using (var transaction = await context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken))
            {
                queueTask = await context.AiEvaluationTasks
                    .Where(item =>
                        AiEvaluationTaskStatuses.WaitingStatuses.Contains(item.Status)
                        && item.NotBeforeUtc <= nowUtc)
                    .OrderBy(item => item.NotBeforeUtc)
                    .ThenBy(item => item.CreatedAtUtc)
                    .FirstOrDefaultAsync(cancellationToken);

                if (queueTask == null)
                {
                    await transaction.CommitAsync(cancellationToken);
                    return false;
                }

                queueTask.Status = AiEvaluationTaskStatuses.Processing;
                queueTask.AttemptCount += 1;
                queueTask.LastAttemptAtUtc = nowUtc;
                queueTask.ProcessingStartedAtUtc = nowUtc;
                queueTask.UpdatedAtUtc = nowUtc;
                await context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            }

            var application = await context.Applications
                .AsNoTracking()
                .FirstOrDefaultAsync(item => item.ApplicationID == queueTask.ApplicationID, cancellationToken);
            if (application == null)
            {
                await FinishTaskAsync(
                    context,
                    queueTask,
                    AiEvaluationRunOutcome.PermanentFailed,
                    "APPLICATION_NOT_FOUND",
                    "Không tìm thấy hồ sơ ứng tuyển.",
                    cancellationToken);
                return true;
            }

            if (application.Status == ApplicationStatuses.Withdrawn)
            {
                await FinishTaskAsync(
                    context,
                    queueTask,
                    AiEvaluationRunOutcome.Cancelled,
                    null,
                    null,
                    cancellationToken);
                return true;
            }

            var cv = await context.CandidateCVs
                .AsNoTracking()
                .FirstOrDefaultAsync(item => item.CVID == application.CVID, cancellationToken);
            if (cv == null)
            {
                await FinishTaskAsync(
                    context,
                    queueTask,
                    AiEvaluationRunOutcome.PermanentFailed,
                    "CV_NOT_FOUND",
                    "Không tìm thấy CV đã nộp.",
                    cancellationToken);
                return true;
            }

            var payload = await LoadCvPayloadAsync(cv, cancellationToken);
            if (!payload.IsSuccess)
            {
                await FinishTaskAsync(
                    context,
                    queueTask,
                    payload.IsTransient
                        ? AiEvaluationRunOutcome.TransientFailed
                        : AiEvaluationRunOutcome.PermanentFailed,
                    payload.ErrorCode,
                    payload.ErrorMessage,
                    cancellationToken);
                return true;
            }

            var result = await evaluationService.RunAiEvaluationJobAsync(
                queueTask.ApplicationID,
                payload.Bytes,
                payload.FileName,
                payload.ContentType,
                payload.StructuredText);

            await FinishTaskAsync(
                context,
                queueTask,
                result.Outcome,
                result.ErrorCode,
                result.ErrorMessage,
                cancellationToken);
            return true;
        }

        private async Task FinishTaskAsync(
            AppDbContext context,
            AiEvaluationTask queueTask,
            AiEvaluationRunOutcome outcome,
            string? errorCode,
            string? errorMessage,
            CancellationToken cancellationToken)
        {
            // CancelAsync có thể cập nhật RowVersion trong lúc lời gọi AI đang chạy.
            // Nạp lại bản ghi để tôn trọng yêu cầu rút hồ sơ và tránh lỗi optimistic concurrency.
            await context.Entry(queueTask).ReloadAsync(cancellationToken);
            if (queueTask.Status == AiEvaluationTaskStatuses.CancelRequested
                || queueTask.Status == AiEvaluationTaskStatuses.Cancelled)
            {
                outcome = AiEvaluationRunOutcome.Cancelled;
                errorCode = null;
                errorMessage = null;
            }

            var nowUtc = DateTime.UtcNow;
            queueTask.ProcessingStartedAtUtc = null;
            queueTask.UpdatedAtUtc = nowUtc;
            queueTask.LastErrorCode = Limit(errorCode, 64);
            queueTask.LastErrorMessage = Limit(errorMessage, 1000);

            switch (outcome)
            {
                case AiEvaluationRunOutcome.Completed:
                case AiEvaluationRunOutcome.AlreadyCompleted:
                    queueTask.Status = AiEvaluationTaskStatuses.Completed;
                    queueTask.CompletedAtUtc = nowUtc;
                    queueTask.LastErrorCode = null;
                    queueTask.LastErrorMessage = null;
                    break;
                case AiEvaluationRunOutcome.Cancelled:
                    queueTask.Status = AiEvaluationTaskStatuses.Cancelled;
                    queueTask.CompletedAtUtc = nowUtc;
                    queueTask.LastErrorCode = null;
                    queueTask.LastErrorMessage = null;
                    // Nếu ứng viên rút trong lúc provider đang xử lý, kết quả đến muộn
                    // không được gắn lại vào hồ sơ đã rút.
                    await RemoveEvaluationAsync(context, queueTask.ApplicationID, cancellationToken);
                    break;
                case AiEvaluationRunOutcome.TransientFailed when queueTask.AttemptCount < queueTask.MaxAttempts:
                    queueTask.Status = AiEvaluationTaskStatuses.RetryScheduled;
                    queueTask.NotBeforeUtc = nowUtc.Add(GetRetryDelay(queueTask.AttemptCount));
                    await RemoveFailedEvaluationAsync(context, queueTask.ApplicationID, cancellationToken);
                    break;
                default:
                    queueTask.Status = AiEvaluationTaskStatuses.Failed;
                    queueTask.CompletedAtUtc = nowUtc;
                    break;
            }

            await context.SaveChangesAsync(cancellationToken);
        }

        private static async Task RemoveFailedEvaluationAsync(
            AppDbContext context,
            string applicationId,
            CancellationToken cancellationToken)
        {
            var failedEvaluation = await context.AIEvaluations
                .FirstOrDefaultAsync(
                    item => item.ApplicationID == applicationId && item.Classification == "AI_ERROR",
                    cancellationToken);
            if (failedEvaluation != null)
            {
                context.AIEvaluations.Remove(failedEvaluation);
            }
        }

        private static async Task RemoveEvaluationAsync(
            AppDbContext context,
            string applicationId,
            CancellationToken cancellationToken)
        {
            var evaluation = await context.AIEvaluations
                .FirstOrDefaultAsync(item => item.ApplicationID == applicationId, cancellationToken);
            if (evaluation != null)
            {
                context.AIEvaluations.Remove(evaluation);
            }
        }

        private async Task<CvPayload> LoadCvPayloadAsync(
            CandidateCV cv,
            CancellationToken cancellationToken)
        {
            if (string.Equals(cv.SourceType, "CvBuilder", StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(cv.RawText))
            {
                return CvPayload.Success(
                    new byte[] { 0 },
                    "CV-truc-tuyen.pdf",
                    "application/pdf",
                    cv.RawText);
            }

            if (string.IsNullOrWhiteSpace(cv.FilePath))
            {
                return CvPayload.Permanent("CV_FILE_MISSING", "CV đã nộp không còn đường dẫn tệp hợp lệ.");
            }

            var fileName = CvFileNameHelper.GetDisplayName(cv.FilePath, "CV.pdf");
            byte[] bytes;
            try
            {
                var pathName = fileName;
                if (Uri.TryCreate(cv.FilePath, UriKind.Absolute, out var absoluteUri))
                {
                    pathName = CvFileNameHelper.GetDisplayName(absoluteUri.LocalPath, fileName);
                }

                var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", pathName);
                var relativePath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    cv.FilePath.TrimStart('/', '\\'));

                if (File.Exists(uploadPath))
                {
                    bytes = await File.ReadAllBytesAsync(uploadPath, cancellationToken);
                }
                else if (!Uri.IsWellFormedUriString(cv.FilePath, UriKind.Absolute)
                    && File.Exists(relativePath))
                {
                    bytes = await File.ReadAllBytesAsync(relativePath, cancellationToken);
                }
                else if (Uri.TryCreate(cv.FilePath, UriKind.Absolute, out absoluteUri)
                    && (absoluteUri.Scheme == Uri.UriSchemeHttp || absoluteUri.Scheme == Uri.UriSchemeHttps))
                {
                    var client = _httpClientFactory.CreateClient();
                    using var response = await client.GetAsync(absoluteUri, cancellationToken);
                    if (!response.IsSuccessStatusCode)
                    {
                        var transient = (int)response.StatusCode == 429 || (int)response.StatusCode >= 500;
                        return transient
                            ? CvPayload.Transient("CV_DOWNLOAD_TEMPORARY", "Tạm thời chưa tải được CV đã nộp.")
                            : CvPayload.Permanent("CV_DOWNLOAD_FAILED", "Không tải được CV đã nộp từ kho lưu trữ.");
                    }

                    bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
                }
                else
                {
                    return CvPayload.Permanent("CV_FILE_MISSING", "Không tìm thấy tệp CV đã nộp.");
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (HttpRequestException)
            {
                return CvPayload.Transient("CV_DOWNLOAD_TEMPORARY", "Tạm thời chưa tải được CV đã nộp.");
            }
            catch (IOException)
            {
                return CvPayload.Transient("CV_STORAGE_TEMPORARY", "Kho lưu trữ CV đang tạm thời không khả dụng.");
            }

            var validationError = ValidateFile(bytes, fileName);
            if (validationError != null)
            {
                return CvPayload.Permanent("INVALID_CV_FILE", validationError);
            }

            return CvPayload.Success(bytes, fileName, GetContentType(fileName), null);
        }

        private static string? ValidateFile(byte[] bytes, string fileName)
        {
            if (bytes.Length == 0) return "Tệp CV đang trống.";
            if (bytes.Length > 10 * 1024 * 1024) return "Tệp CV vượt quá dung lượng tối đa 10 MB.";
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
            {
                return "Định dạng CV không được hỗ trợ.";
            }

            var signatureMatches = extension switch
            {
                ".pdf" => bytes.Length >= 5 && bytes.AsSpan(0, 5).SequenceEqual("%PDF-"u8),
                ".docx" => bytes.Length >= 2 && bytes[0] == (byte)'P' && bytes[1] == (byte)'K',
                ".png" => bytes.Length >= 8 && bytes.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }),
                ".jpg" or ".jpeg" => bytes.Length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF,
                ".webp" => bytes.Length >= 12 && bytes.AsSpan(0, 4).SequenceEqual("RIFF"u8) && bytes.AsSpan(8, 4).SequenceEqual("WEBP"u8),
                _ => false
            };
            return signatureMatches
                ? null
                : "Nội dung tệp CV không đúng định dạng hoặc tệp đã bị hỏng.";
        }

        private static string GetContentType(string fileName) =>
            Path.GetExtension(fileName).ToLowerInvariant() switch
            {
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".webp" => "image/webp",
                _ => "application/pdf"
            };

        private static TimeSpan GetRetryDelay(int attemptCount) => attemptCount switch
        {
            <= 1 => TimeSpan.FromSeconds(30),
            2 => TimeSpan.FromMinutes(2),
            _ => TimeSpan.FromMinutes(5)
        };

        private static string? Limit(string? value, int maxLength) =>
            string.IsNullOrWhiteSpace(value)
                ? null
                : value.Trim()[..Math.Min(value.Trim().Length, maxLength)];

        private sealed record CvPayload(
            bool IsSuccess,
            bool IsTransient,
            byte[] Bytes,
            string FileName,
            string ContentType,
            string? StructuredText,
            string? ErrorCode,
            string? ErrorMessage)
        {
            public static CvPayload Success(
                byte[] bytes,
                string fileName,
                string contentType,
                string? structuredText) =>
                new(true, false, bytes, fileName, contentType, structuredText, null, null);

            public static CvPayload Transient(string errorCode, string errorMessage) =>
                new(false, true, Array.Empty<byte>(), string.Empty, string.Empty, null, errorCode, errorMessage);

            public static CvPayload Permanent(string errorCode, string errorMessage) =>
                new(false, false, Array.Empty<byte>(), string.Empty, string.Empty, null, errorCode, errorMessage);
        }
    }
}
