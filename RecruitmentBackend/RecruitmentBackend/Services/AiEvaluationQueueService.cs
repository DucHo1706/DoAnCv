using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RecruitmentBackend.Constants;
using RecruitmentBackend.Data;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
using RecruitmentBackend.Settings;

namespace RecruitmentBackend.Services
{
    public sealed class AiEvaluationQueueService : IAiEvaluationQueueService
    {
        private readonly AppDbContext _context;
        private readonly AiEvaluationQueueSettings _settings;

        public AiEvaluationQueueService(
            AppDbContext context,
            IOptions<AiEvaluationQueueSettings> settings)
        {
            _context = context;
            _settings = settings.Value;
        }

        public async Task<DateTime> EnqueueAsync(string applicationId, DateTime? notBeforeUtc = null)
        {
            var nowUtc = DateTime.UtcNow;
            var scheduledAtUtc = notBeforeUtc
                ?? nowUtc.AddSeconds(Math.Clamp(_settings.GracePeriodSeconds, 0, 300));
            var task = await _context.AiEvaluationTasks
                .FirstOrDefaultAsync(item => item.ApplicationID == applicationId);

            if (task == null)
            {
                task = new AiEvaluationTask
                {
                    AiEvaluationTaskID = Guid.NewGuid().ToString(),
                    ApplicationID = applicationId,
                    Status = AiEvaluationTaskStatuses.Pending,
                    NotBeforeUtc = scheduledAtUtc,
                    MaxAttempts = Math.Clamp(_settings.MaxAttempts, 1, 5),
                    CreatedAtUtc = nowUtc,
                    UpdatedAtUtc = nowUtc
                };
                _context.AiEvaluationTasks.Add(task);
            }
            else if (!AiEvaluationTaskStatuses.ActiveStatuses.Contains(task.Status)
                && task.Status != AiEvaluationTaskStatuses.Completed)
            {
                task.Status = AiEvaluationTaskStatuses.Pending;
                task.NotBeforeUtc = scheduledAtUtc;
                task.AttemptCount = 0;
                task.MaxAttempts = Math.Clamp(_settings.MaxAttempts, 1, 5);
                task.LastErrorCode = null;
                task.LastErrorMessage = null;
                task.CompletedAtUtc = null;
                task.ProcessingStartedAtUtc = null;
                task.UpdatedAtUtc = nowUtc;
            }

            await _context.SaveChangesAsync();
            return task.NotBeforeUtc;
        }

        public async Task<(bool IsSuccess, string Message, string AiStatus)> RequestRetryAsync(
            string applicationId)
        {
            var evaluation = await _context.AIEvaluations
                .FirstOrDefaultAsync(item => item.ApplicationID == applicationId);
            if (evaluation != null
                && !string.Equals(evaluation.Classification, "AI_ERROR", StringComparison.OrdinalIgnoreCase))
            {
                return (false, "Hồ sơ đã có kết quả AI và không cần phân tích lại.", AiEvaluationTaskStatuses.Completed);
            }

            var task = await _context.AiEvaluationTasks
                .FirstOrDefaultAsync(item => item.ApplicationID == applicationId);
            if (task != null && AiEvaluationTaskStatuses.ActiveStatuses.Contains(task.Status))
            {
                return (true, "Hồ sơ đã có trong hàng đợi phân tích AI.", task.Status);
            }

            if (task?.ManualRetryCount >= 1)
            {
                return (false, "Hồ sơ đã sử dụng lượt yêu cầu phân tích lại. Hệ thống sẽ không gọi AI thêm để tránh lạm dụng.", AiEvaluationTaskStatuses.Failed);
            }

            if (evaluation != null)
            {
                _context.AIEvaluations.Remove(evaluation);
            }

            var nowUtc = DateTime.UtcNow;
            if (task == null)
            {
                task = new AiEvaluationTask
                {
                    AiEvaluationTaskID = Guid.NewGuid().ToString(),
                    ApplicationID = applicationId,
                    Status = AiEvaluationTaskStatuses.Pending,
                    NotBeforeUtc = nowUtc,
                    AttemptCount = 0,
                    MaxAttempts = 1,
                    ManualRetryCount = 1,
                    CreatedAtUtc = nowUtc,
                    UpdatedAtUtc = nowUtc
                };
                _context.AiEvaluationTasks.Add(task);
            }
            else
            {
                task.Status = AiEvaluationTaskStatuses.Pending;
                task.NotBeforeUtc = nowUtc;
                task.MaxAttempts = Math.Max(task.AttemptCount + 1, 1);
                task.ManualRetryCount += 1;
                task.LastErrorCode = null;
                task.LastErrorMessage = null;
                task.CompletedAtUtc = null;
                task.ProcessingStartedAtUtc = null;
                task.UpdatedAtUtc = nowUtc;
            }

            await _context.SaveChangesAsync();
            return (true, "Hồ sơ đã được đưa vào hàng đợi phân tích lại. Bạn không cần nộp CV lần nữa.", task.Status);
        }

        public async Task CancelAsync(string applicationId)
        {
            var task = await _context.AiEvaluationTasks
                .FirstOrDefaultAsync(item => item.ApplicationID == applicationId);
            if (task == null || task.Status == AiEvaluationTaskStatuses.Completed)
            {
                return;
            }

            var nowUtc = DateTime.UtcNow;
            if (task.Status == AiEvaluationTaskStatuses.Processing)
            {
                task.Status = AiEvaluationTaskStatuses.CancelRequested;
            }
            else if (AiEvaluationTaskStatuses.ActiveStatuses.Contains(task.Status))
            {
                task.Status = AiEvaluationTaskStatuses.Cancelled;
                task.CompletedAtUtc = nowUtc;
            }

            task.UpdatedAtUtc = nowUtc;
            await _context.SaveChangesAsync();
        }
    }
}
