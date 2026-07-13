using System.Collections.Generic;
using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface IHighUtilityService
    {
        Task<(bool IsSuccess, string Message, object Data)> TrainHighUtilityModelAsync(double minUtility);
        Task<(bool IsSuccess, string Message, object Data)> GetHighUtilityItemsetsAsync();
        Task<(bool IsSuccess, string Message, object Data)> RecommendSkillsAsync(List<string> currentSkills, int topN);
    }
}
