using RecruitmentBackend.Controllers;
using System.Security.Claims;
using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface IRecruitmentService
    {
        Task<(bool IsSuccess, string Message, object Data)> ApplyJobAsync(ApplyJobRequest request, ClaimsPrincipal user);
        Task<(bool IsSuccess, string Message, object Data)> GetHrApplicationsAsync(ClaimsPrincipal user);
        Task<(bool IsSuccess, string Message, object Data)> GetMyApplicationsAsync(ClaimsPrincipal user);
    }
}