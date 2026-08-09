using RecruitmentBackend.DTOs.Requests;
using System.Security.Claims;
using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface ICandidateComparisonService
    {
        Task<(bool IsSuccess, string Message, object Data)> GetCandidateRankingsAsync(
            string jobId,
            string? sortBy,
            string? criterionName,
            string? search,
            string? skill,
            decimal? minScore,
            double? minYearsOfExperience,
            ClaimsPrincipal user
        );

        Task<(bool IsSuccess, string Message, object Data)> CompareCandidatesAsync(
            CompareCandidatesRequest request,
            ClaimsPrincipal user
        );
    }
}
