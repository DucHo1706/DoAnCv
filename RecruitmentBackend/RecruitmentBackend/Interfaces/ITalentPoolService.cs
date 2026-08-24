using RecruitmentBackend.DTOs.Requests;
using System.Security.Claims;

namespace RecruitmentBackend.Interfaces
{
    public interface ITalentPoolService
    {
        Task<(bool IsSuccess, string Message, object Data)> GetTalentPoolCandidatesAsync(
            ClaimsPrincipal user
        );

        Task<(bool IsSuccess, string Message, object Data)> GetTalentPoolDetailAsync(
            string talentPoolCandidateId,
            ClaimsPrincipal user
        );

        Task<(bool IsSuccess, string Message, object Data)> AddTalentPoolNoteAsync(
            string talentPoolCandidateId,
            AddTalentPoolNoteRequest request,
            ClaimsPrincipal user
        );

        Task<(bool IsSuccess, string Message, object Data)> GetInviteSuggestionsAsync(
            string talentPoolCandidateId,
            ClaimsPrincipal user
        );

        Task<(bool IsSuccess, string Message, object Data)> SearchDiscoverableCandidatesAsync(
            CandidateDiscoverySearchRequest request,
            ClaimsPrincipal user
        );

        Task<(bool IsSuccess, string Message, object? Data)> SaveDiscoverableCandidateAsync(
            string candidateId,
            UpdateTalentPoolProfileRequest request,
            ClaimsPrincipal user
        );

        Task<(bool IsSuccess, string Message, object? Data)> GetDiscoverableCandidateDetailAsync(
            string candidateId,
            ClaimsPrincipal user
        );

        Task<(bool IsSuccess, string Message)> RemoveTalentPoolCandidateAsync(
            string talentPoolCandidateId,
            ClaimsPrincipal user
        );
        Task<(bool IsSuccess, string Message, object Data)> UpdateTalentPoolProfileAsync(
            string talentPoolCandidateId,
            UpdateTalentPoolProfileRequest request,
            ClaimsPrincipal user
        );
    }
}
