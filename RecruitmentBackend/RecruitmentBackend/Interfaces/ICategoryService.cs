using RecruitmentBackend.DTOs.Requests;
using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface ICategoryService
    {
        Task<object> GetCategoriesAsync();
        Task<(bool IsSuccess, string Message, object Data)> CreateCategoryAsync(CategoryRequest request);
        Task<(bool IsSuccess, string Message, object Data)> UpdateCategoryAsync(string id, CategoryRequest request);
        Task<(bool IsSuccess, string Message, object Data)> ToggleCategoryStatusAsync(string id);
        Task<(bool IsSuccess, string Message)> DeleteCategoryAsync(string id);
    }
}