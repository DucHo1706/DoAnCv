using RecruitmentBackend.DTOs.Requests;
using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface IJobLevelService
    {
        Task<object> GetJobLevelsAsync();
        Task<(bool IsSuccess, string Message, object Data)> CreateJobLevelAsync(JobLevelRequest request);
        Task<(bool IsSuccess, string Message, object Data)> UpdateJobLevelAsync(string id, JobLevelRequest request);
        Task<(bool IsSuccess, string Message, object Data)> ToggleJobLevelStatusAsync(string id);
        Task<(bool IsSuccess, string Message)> DeleteJobLevelAsync(string id);
    }
}