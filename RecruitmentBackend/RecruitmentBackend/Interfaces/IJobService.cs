﻿﻿﻿﻿﻿using RecruitmentBackend.DTOs.Requests;
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
        Task<string> CreatePendingJobAsync(CreateJobRequest request, string accountId);
        Task<object> ReviewJobAsync(string jobId);
        Task<bool> ApproveJobAndSyncAiAsync(string jobId);
        Task<bool> ToggleJobStatusAsync(string jobId);
    }
}
