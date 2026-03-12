using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Models;

namespace RecruitmentBackend.Interfaces
{
    public interface IJobService
    {
        Task<string> CreatePendingJobAsync(CreateJobRequest request);
        Task<JobReviewDto?> ReviewJobAsync(string jobId);
        Task<bool> ApproveJobAndSyncAiAsync(string jobId);
        Task<IEnumerable<Job>> GetAllJobsAsync();
        Task<IEnumerable<Job>> GetPendingJobsAsync();
    }
}
