using System.Security.Claims;
using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface IAiEvaluationService
    {
        Task RunAiEvaluationInBackgroundAsync(string applicationId, byte[] cvFileBytes, string fileName, string contentType);
        Task<(bool IsSuccess, string Message, object Data)> ReEvaluateApplicationAsync(string applicationId, ClaimsPrincipal user);
    }
}
