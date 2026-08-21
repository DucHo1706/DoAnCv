namespace RecruitmentBackend.Interfaces
{
    public interface IDashboardService
    {
        Task<object> GetAdminDashboardStatsAsync(string? categoryId, string? positionId, string? jobLevelId, string? branchId, string? jobId, DateTime? fromDate, DateTime? toDate);

        Task<object> GetHrDashboardStatsAsync(string accountId, string? categoryId, string? positionId, string? jobLevelId, string? branchId, string? jobId, string? timeRange);

        Task<object> GetRecruiterPerformanceStatsAsync();

        Task<object> GetSimulatorCandidatesAsync();
    }
}
