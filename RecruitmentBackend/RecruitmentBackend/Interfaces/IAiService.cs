using Microsoft.AspNetCore.Http;
using RecruitmentBackend.DTOs.Responses;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface IAiService
    {
        Task<AiMatchingResponse> GetMatchingScoreAsync(IFormFile cvFile, string jobRequirements);
        Task<bool> SyncSkillsToAiAsync(List<string> skills);
    }
}