using RecruitmentBackend.DTOs.Responses;

namespace RecruitmentBackend.Interfaces
{
    public interface IAiService
    {
        Task<AiServiceResponseDto> GetMatchingScoreAsync(IFormFile file, string jobDescription);
        Task<bool> SyncSkillsToAiAsync(List<string> skills);
    }
}
