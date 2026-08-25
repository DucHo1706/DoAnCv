namespace RecruitmentBackend.Interfaces
{
    public interface IAiEvaluationQueueService
    {
        Task<DateTime> EnqueueAsync(string applicationId, DateTime? notBeforeUtc = null);

        Task<(bool IsSuccess, string Message, string AiStatus)> RequestRetryAsync(
            string applicationId);

        Task CancelAsync(string applicationId);
    }
}
