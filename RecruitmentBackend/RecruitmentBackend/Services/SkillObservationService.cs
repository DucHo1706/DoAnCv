using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
using RecruitmentBackend.Utilities;

namespace RecruitmentBackend.Services
{
    public class SkillObservationService : ISkillObservationService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<SkillObservationService> _logger;

        public SkillObservationService(
            AppDbContext context,
            ILogger<SkillObservationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<int> RecordAsync(
            string cvId,
            string jobId,
            IReadOnlyCollection<SkillObservationCandidate>? cvObservations,
            IReadOnlyCollection<SkillObservationCandidate>? jobObservations,
            CancellationToken cancellationToken = default)
        {
            var recorded = 0;
            recorded += await RecordSourceAsync(
                "CV", cvId, cvObservations, cancellationToken);
            recorded += await RecordSourceAsync(
                "JD", jobId, jobObservations, cancellationToken);
            return recorded;
        }

        private async Task<int> RecordSourceAsync(
            string sourceType,
            string sourceEntityId,
            IReadOnlyCollection<SkillObservationCandidate>? observations,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(sourceEntityId) || observations == null || observations.Count == 0)
                return 0;

            var accepted = observations
                .Select(NormalizeObservation)
                .Where(item => item != null)
                .Select(item => item!)
                .GroupBy(item => item.NormalizedCandidate, StringComparer.OrdinalIgnoreCase)
                .Select(group => group.OrderByDescending(item => item.Confidence).First())
                .ToList();

            var nowUtc = DateTime.UtcNow;
            foreach (var item in accepted)
            {
                // MERGE + HOLDLOCK tránh hai hồ sơ được chấm đồng thời cho cùng
                // một JD tạo bản ghi trùng. Mọi giá trị nội suy đều thành SQL parameter.
                await _context.Database.ExecuteSqlInterpolatedAsync($@"
MERGE dbo.SkillObservations WITH (HOLDLOCK) AS target
USING (VALUES (
    {sourceType}, {sourceEntityId}, {item.DisplayText}, {item.NormalizedCandidate},
    {item.EvidenceText}, {item.SourceSection}, {item.Confidence}, {nowUtc}
)) AS source (
    SourceType, SourceEntityID, DisplayText, NormalizedCandidate,
    EvidenceText, SourceSection, Confidence, ObservedAtUtc
)
ON target.SourceType = source.SourceType
   AND target.SourceEntityID = source.SourceEntityID
   AND target.NormalizedCandidate = source.NormalizedCandidate
WHEN MATCHED THEN UPDATE SET
    LastObservedAtUtc = source.ObservedAtUtc,
    DisplayText = CASE WHEN source.Confidence >= target.Confidence THEN source.DisplayText ELSE target.DisplayText END,
    EvidenceText = CASE WHEN source.Confidence >= target.Confidence THEN source.EvidenceText ELSE target.EvidenceText END,
    SourceSection = CASE WHEN source.Confidence >= target.Confidence THEN source.SourceSection ELSE target.SourceSection END,
    Confidence = CASE WHEN source.Confidence > target.Confidence THEN source.Confidence ELSE target.Confidence END
WHEN NOT MATCHED THEN INSERT (
    SourceType, SourceEntityID, DisplayText, NormalizedCandidate,
    EvidenceText, SourceSection, Confidence, Status,
    FirstObservedAtUtc, LastObservedAtUtc
) VALUES (
    source.SourceType, source.SourceEntityID, source.DisplayText, source.NormalizedCandidate,
    source.EvidenceText, source.SourceSection, source.Confidence, {SkillObservationStatuses.Quarantine},
    source.ObservedAtUtc, source.ObservedAtUtc
);", cancellationToken);
            }

            if (accepted.Count > 0)
            {
                _logger.LogInformation(
                    "Recorded {Count} skill observations from {SourceType}; evidence content is not written to logs.",
                    accepted.Count,
                    sourceType);
            }
            return accepted.Count;
        }

        private static NormalizedObservation? NormalizeObservation(SkillObservationCandidate source)
        {
            var displayText = (source.RawText ?? string.Empty).Trim();
            if (displayText.Length == 0 || displayText.Length > 100)
                return null;

            var normalized = SkillTaxonomyNormalizer.NormalizeKey(displayText);
            if (normalized.Length < 2 || normalized.Length > 120 || normalized.Split(' ').Length > 5)
                return null;

            if (displayText.Contains('�') || displayText.Contains("Ã", StringComparison.Ordinal))
                return null;

            return new NormalizedObservation(
                displayText,
                normalized,
                Truncate(source.EvidenceText, 500),
                Truncate(source.SourceSection, 100),
                Math.Clamp((decimal)source.Confidence, 0m, 1m));
        }

        private static string? Truncate(string? value, int maxLength)
        {
            var cleaned = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
            return cleaned == null || cleaned.Length <= maxLength
                ? cleaned
                : cleaned[..maxLength];
        }

        private sealed record NormalizedObservation(
            string DisplayText,
            string NormalizedCandidate,
            string? EvidenceText,
            string? SourceSection,
            decimal Confidence);
    }
}
