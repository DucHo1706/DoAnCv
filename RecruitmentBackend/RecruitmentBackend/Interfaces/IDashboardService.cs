namespace RecruitmentBackend.Interfaces
{
    public interface IDashboardService
    {
        Task<object> GetAdminDashboardStatsAsync(string? jobId, string? timeRange);
        Task<object> GetHrDashboardStatsAsync(string accountId, string? jobId, string? timeRange);

    }
}
