using System.Security.Claims;
using System.Threading.Tasks;
using RecruitmentBackend.DTOs.Requests;

namespace RecruitmentBackend.Interfaces
{
    public interface IInterviewService
    {
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
