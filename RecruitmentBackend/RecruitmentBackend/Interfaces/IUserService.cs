using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.DTOs.Responses;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllUsersAsync();
        Task<(bool Success, string Message, string NewStatus)> ToggleUserStatusAsync(string id);
        Task<(bool Success, string Message)> CreateUserAsync(CreateUserRequest request);
        Task<(bool Success, string Message)> UpdateUserAsync(string id, UpdateUserRequest request);
    }
}