using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Models;
using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface IJobService
    {

        Task<IEnumerable<object>> GetAllJobsAsync();
        Task<IEnumerable<object>> GetPendingJobsAsync();
        Task<IEnumerable<object>> GetAdminJobsAsync();
        Task<PagedResult<JobSummaryDto>> GetPublishedJobsAsync(JobFilterRequest request);
        Task<object?> GetPublishedJobByIdAsync(string jobId);
        Task<IEnumerable<object>> GetTrendingCategoriesAsync(int limit = 8);
        Task<IEnumerable<object>> GetJobsByRecruiterAsync(string accountId);
        Task<IReadOnlyList<RecruiterCampaignSummaryDto>> GetRecruiterCampaignSummariesAsync(string accountId);
        Task<string> CreatePendingJobAsync(CreateJobRequest request, string accountId);
        Task<(bool Success, string Message, string? JobId, int? RecruitmentRound)> RepostJobAsync(string sourceJobId, RepostJobRequest request, string accountId);
        Task<(bool Success, string Message)> UpdateRecruiterJobAsync(string jobId, CreateJobRequest request, string accountId);
        Task<(bool Success, string Message)> ArchiveJobAsync(string jobId, string accountId, bool isAdmin);
        Task<(bool Success, string Message)> RestoreArchivedJobAsync(string jobId, string accountId, bool isAdmin);
        Task<object?> ReviewJobAsync(string jobId, string accountId, bool isAdmin);
        Task<bool> ApproveJobAndSyncAiAsync(string jobId);
        Task<bool> RejectJobAsync(string jobId, string reason);
        Task<bool> FlagJobAsync(string jobId, string reason);
        Task<bool> UnflagJobAsync(string jobId);
        Task<(int successCount, int failCount)> BulkApproveJobsAsync(List<string> jobIds);
        Task<bool> ToggleJobStatusAsync(string jobId);
        Task<bool> ToggleRecruiterJobStatusAsync(string jobId, string accountId);
        Task<IEnumerable<JobSummaryDto>> GetTrendingJobsAsync(int limit = 6);
        Task<IEnumerable<JobSummaryDto>> GetRelatedJobsAsync(string jobId, int limit = 3);
        Task<bool> SaveJobAsync(string jobId, string accountId);
        Task<bool> UnsaveJobAsync(string jobId, string accountId);
        Task<IEnumerable<object>> GetSavedJobsAsync(string accountId);
    }
}
