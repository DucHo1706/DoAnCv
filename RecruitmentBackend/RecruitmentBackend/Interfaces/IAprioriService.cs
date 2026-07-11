using System.Collections.Generic;
using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface IAprioriService
    {
        Task<(bool IsSuccess, string Message, object Data)> TrainAprioriModelAsync();
        Task<(bool IsSuccess, string Message, object Data)> GetAssociationRulesAsync();
        Task<(bool IsSuccess, string Message, object Data)> RecommendSkillsAsync(List<string> currentSkills, int topN);
    }
}
