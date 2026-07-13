namespace RecruitmentBackend.Interfaces
{
    public interface IDashboardService
    {
        Task<object> GetAdminDashboardStatsAsync(string? categoryId, DateTime? fromDate, DateTime? toDate);

        Task<object> GetHrDashboardStatsAsync(string accountId, string? jobId, string? timeRange);

        Task<object> GetSimulatorCandidatesAsync();
    }
}