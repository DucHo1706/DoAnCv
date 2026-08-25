using RecruitmentBackend.DTOs.Responses;

namespace RecruitmentBackend.Interfaces
{
    public interface ISkillObservationService
    {
        Task<int> RecordAsync(
            string cvId,
            string jobId,
            IReadOnlyCollection<SkillObservationCandidate>? cvObservations,
            IReadOnlyCollection<SkillObservationCandidate>? jobObservations,
            CancellationToken cancellationToken = default);
    }
}
