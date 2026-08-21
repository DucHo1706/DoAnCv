using RecruitmentBackend.Controllers;
using System.Security.Claims;
using System.Threading.Tasks;
using RecruitmentBackend.DTOs.Requests;

namespace RecruitmentBackend.Interfaces
{
    public interface IApplicationService
    {
        Task<(bool IsSuccess, string Message, object Data)> ApplyJobAsync(ApplyJobRequest request, ClaimsPrincipal user);
        Task<(bool IsSuccess, string Message, object Data)> GetHrApplicationsAsync(
            ClaimsPrincipal user,
            bool includeAiDetails = true,
            string? applicationId = null);
        Task<(bool IsSuccess, string Message, object Data)> GetMyApplicationsAsync(ClaimsPrincipal user);
        Task<(bool IsSuccess, string Message, object Data)> RetryAiEvaluationAsync(string applicationId, ClaimsPrincipal user);
        Task<(bool IsSuccess, string Message, object Data)> WithdrawApplicationAsync(string applicationId, ClaimsPrincipal user);
        Task<(bool IsSuccess, string Message, object Data)> UpdateApplicationStatusAsync(
            string applicationId,
            UpdateApplicationStatusRequest request,
            ClaimsPrincipal user
        );
        Task<(bool IsSuccess, string Message, object Data)> RejectApplicationAsync(
            string applicationId,
            RejectApplicationRequest request,
            ClaimsPrincipal user
        );
    }
}
