using RecruitmentBackend.Controllers;
using System.Security.Claims;
using System.Threading.Tasks;
using RecruitmentBackend.DTOs.Requests;

namespace RecruitmentBackend.Interfaces
{
    public interface IRecruitmentService
    {
        Task<(bool IsSuccess, string Message, object Data)> ApplyJobAsync(ApplyJobRequest request, ClaimsPrincipal user);
        Task<(bool IsSuccess, string Message, object Data)> GetHrApplicationsAsync(
            ClaimsPrincipal user,
            bool includeAiDetails = true,
            string? applicationId = null);
        Task<(bool IsSuccess, string Message, object Data)> GetMyApplicationsAsync(ClaimsPrincipal user);
        Task<(bool IsSuccess, string Message, object Data)> UpdateApplicationStatusAsync(
            string applicationId,
            UpdateApplicationStatusRequest request,
            ClaimsPrincipal user
        );
        Task RunAiEvaluationInBackgroundAsync(string applicationId, byte[] cvFileBytes, string fileName, string contentType);
        Task<(bool IsSuccess, string Message, object Data)> RejectApplicationAsync(
            string applicationId,
            RejectApplicationRequest request,
            ClaimsPrincipal user
        );
        Task<(bool IsSuccess, string Message, object Data)> ScheduleInterviewAsync(
            string applicationId,
            ScheduleInterviewRequest request,
            ClaimsPrincipal user
        );
        Task<(bool IsSuccess, string Message, object Data)> GetInterviewScheduleAsync(
            string applicationId,
            ClaimsPrincipal user
        );
        Task<(bool IsSuccess, string Message, object Data)> GetHrInterviewSchedulesAsync(
            ClaimsPrincipal user
        );
        Task<(bool IsSuccess, string Message, object Data)> CancelInterviewScheduleAsync(
            string applicationId,
            ClaimsPrincipal user
        );
    }
}
