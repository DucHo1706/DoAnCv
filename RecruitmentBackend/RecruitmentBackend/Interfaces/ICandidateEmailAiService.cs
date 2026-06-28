using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.DTOs.Responses;

namespace RecruitmentBackend.Interfaces
{
    public interface ICandidateEmailAiService
    {
        Task<(bool IsSuccess, string Message, GenerateCandidateEmailResponse? Data)> GenerateEmailAsync(
            GenerateCandidateEmailRequest request);
    }
}