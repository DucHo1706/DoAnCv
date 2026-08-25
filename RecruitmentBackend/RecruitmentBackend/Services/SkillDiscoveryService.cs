using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RecruitmentBackend.Data;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
using RecruitmentBackend.Utilities;

namespace RecruitmentBackend.Services
{
    /// <summary>
    /// Tổng hợp quan sát kỹ năng từ nhiều CV/JD độc lập. Service chỉ chuyển
    /// trạng thái hàng chờ; không tự tạo Skill hoặc alias đã duyệt.
    /// </summary>
    public class SkillDiscoveryService : ISkillDiscoveryService
    {
        private const int MinimumIndependentSources = 3;
        private const decimal MinimumAverageConfidence = 0.75m;

        private readonly AppDbContext _context;
        private readonly ILogger<SkillDiscoveryService> _logger;

        public SkillDiscoveryService(
            AppDbContext context,
            ILogger<SkillDiscoveryService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<int> CollectAsync(CancellationToken cancellationToken = default)
        {
            var approved = await _context.Skills
                .AsNoTracking()
                .Where(skill => skill.IsApproved)
                .Include(skill => skill.Aliases)
                .ToListAsync(cancellationToken);

            var approvedMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            foreach (var skill in approved)
            {
                var canonicalKey = SkillTaxonomyNormalizer.NormalizeKey(skill.Name);
                if (canonicalKey.Length > 0)
                    approvedMap[canonicalKey] = skill.Id;
                foreach (var alias in skill.Aliases)
                {
                    var aliasKey = SkillTaxonomyNormalizer.NormalizeKey(alias.Alias);
                    if (aliasKey.Length > 0)
                        approvedMap[aliasKey] = skill.Id;
                }
            }

            var observations = await _context.SkillObservations
                .Where(item => item.Status != SkillObservationStatuses.Rejected)
                .ToListAsync(cancellationToken);

            var mappedThisRun = 0;
            foreach (var observation in observations)
            {
                if (!approvedMap.TryGetValue(observation.NormalizedCandidate, out var skillId))
                    continue;

                if (observation.Status != SkillObservationStatuses.Mapped || observation.ResolvedSkillID != skillId)
                {
                    observation.Status = SkillObservationStatuses.Mapped;
                    observation.ResolvedSkillID = skillId;
                    observation.ReviewedAtUtc ??= DateTime.UtcNow;
                    mappedThisRun++;
                }
            }

            var unresolved = observations
                .Where(item => item.Status != SkillObservationStatuses.Mapped
                    && item.Status != SkillObservationStatuses.Approved)
                .GroupBy(item => item.NormalizedCandidate, StringComparer.OrdinalIgnoreCase);

            foreach (var group in unresolved)
            {
                var sourceCount = group
                    .Select(item => $"{item.SourceType}:{item.SourceEntityID}")
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Count();
                var cvCount = group
                    .Where(item => item.SourceType == "CV")
                    .Select(item => item.SourceEntityID)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Count();
                var jobCount = group
                    .Where(item => item.SourceType == "JD")
                    .Select(item => item.SourceEntityID)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Count();
                var averageConfidence = group.Average(item => item.Confidence);
                var hasIndependentEvidence = cvCount >= 2 || jobCount >= 2;
                var nextStatus = sourceCount >= MinimumIndependentSources
                    && hasIndependentEvidence
                    && averageConfidence >= MinimumAverageConfidence
                        ? SkillObservationStatuses.CandidateForReview
                        : SkillObservationStatuses.Quarantine;

                foreach (var observation in group)
                    observation.Status = nextStatus;
            }

            await _context.SaveChangesAsync(cancellationToken);

            var reviewCount = observations.Count(item => item.Status == SkillObservationStatuses.CandidateForReview);
            var quarantineCount = observations.Count(item => item.Status == SkillObservationStatuses.Quarantine);
            var mappedCount = observations.Count(item => item.Status == SkillObservationStatuses.Mapped);
            _logger.LogInformation(
                "Skill discovery summary: approved taxonomy={Approved}; observations={Total}; review={Review}; quarantine={Quarantine}; mapped={Mapped}; newly mapped={NewlyMapped}.",
                approved.Count,
                observations.Count,
                reviewCount,
                quarantineCount,
                mappedCount,
                mappedThisRun);

            return reviewCount;
        }
    }
}
