using Microsoft.AspNetCore.Http;
using RecruitmentBackend.DTOs.Responses;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface IAiService
    {
        Task<AiMatchingResponse> GetMatchingScoreAsync(IFormFile cvFile, string jobDescription, string criteriaJson);
        Task<AiMatchingResponse> GetMatchingScoreFromTextAsync(string cvText, string jobDescription, string criteriaJson);
        Task<(bool IsValid, string Message)> ValidateCvAsync(byte[] fileBytes, string fileName, string contentType);
        Task<bool> SyncSkillsToAiAsync(List<string> skills);
        Task<bool> TrainAprioriAsync(List<List<string>> transactions);
        Task<List<string>> RecommendSkillsAsync(List<string> currentSkills, int topN = 5);
        Task<string> GetAssociationRulesJsonAsync();
        Task<bool> TrainHuimAsync(object payload);
        Task<string> RecommendHighUtilitySkillsAsync(List<string> currentSkills, int topN = 5);
        Task<string> GetHighUtilityItemsetsJsonAsync();
        Task<List<SemanticSearchResultItemDto>> SearchSemanticAsync(string query, List<DTOs.Requests.SemanticSearchJobItemDto> jobs);
    }
}
