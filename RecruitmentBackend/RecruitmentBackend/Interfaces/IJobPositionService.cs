using RecruitmentBackend.DTOs.Requests;
using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface IJobPositionService
    {
        Task<object> GetJobPositionsAsync();
        Task<(bool IsSuccess, string Message, object Data)> CreateJobPositionAsync(JobPositionRequest request);
        Task<(bool IsSuccess, string Message, object Data)> UpdateJobPositionAsync(string id, JobPositionRequest request);
        Task<(bool IsSuccess, string Message, object Data)> TogglePositionStatusAsync(string id);
    }
}