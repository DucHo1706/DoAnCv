using RecruitmentBackend.DTOs.Requests;
using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface IBranchService
    {
        Task<object> GetBranchesAsync();
        Task<(bool IsSuccess, string Message, object Data)> CreateBranchAsync(NameOnlyRequest request);
        Task<(bool IsSuccess, string Message, object Data)> UpdateBranchAsync(string id, NameOnlyRequest request);
        Task<(bool IsSuccess, string Message, object Data)> ToggleBranchStatusAsync(string id);
    }
}