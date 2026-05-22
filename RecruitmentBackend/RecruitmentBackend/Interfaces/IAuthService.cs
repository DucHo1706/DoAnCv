using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.DTOs.Responses;
using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponse> LoginAsync(LoginRequest request);
    }
}