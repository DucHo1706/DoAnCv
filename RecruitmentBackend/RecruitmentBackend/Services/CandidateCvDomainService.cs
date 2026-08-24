using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using RecruitmentBackend.Utilities;

namespace RecruitmentBackend.Services
{
    public class CandidateCvDomainService : ICandidateCvDomainService
    {
        private readonly AppDbContext _context;

        public CandidateCvDomainService(AppDbContext context) => _context = context;

        public async Task<int> InferAndPersistAsync(CancellationToken cancellationToken = default)
        {
            var cvs = await _context.CandidateCVs.AsNoTracking()
                .Select(cv => new { cv.CVID, CVExtractedSkills = cv.CVExtractedSkills ?? "[]" })
                .ToListAsync(cancellationToken);
            if (cvs.Count == 0) return 0;

            var cvIds = cvs.Select(x => x.CVID).ToList();
            var categories = await _context.Categories.AsNoTracking()
                .Where(category => category.IsActive)
                .Select(category => new { category.CategoryID, category.Name })
                .ToListAsync(cancellationToken);
            var canonicalDomains = categories
                .Where(category => string.IsNullOrWhiteSpace(category.Name) == false)
                .GroupBy(category => category.Name.Trim(), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(group => group.Key, group => group.First().Name.Trim(), StringComparer.OrdinalIgnoreCase);

            var approvedSkillRows = await _context.Skills.AsNoTracking()
                .Include(skill => skill.Aliases)
                .Where(skill => skill.IsApproved)
                .ToListAsync(cancellationToken);
            var canonicalSkillMap = SkillTaxonomyNormalizer.BuildCanonicalMap(approvedSkillRows);

            var jobRows = await (from job in _context.JobPostings.AsNoTracking()
                                 join category in _context.Categories.AsNoTracking()
                                     on job.CategoryID equals category.CategoryID
                                 where category.IsActive && job.JDExtractedSkills != null
                                 select new { Domain = category.Name, job.JDExtractedSkills })
                .ToListAsync(cancellationToken);
            var jobSkillProfiles = jobRows
                .Where(row => string.IsNullOrWhiteSpace(row.Domain) == false)
                .GroupBy(row => row.Domain.Trim(), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(
                    group => canonicalDomains.TryGetValue(group.Key, out var canonical) ? canonical : group.Key,
                    group => group.SelectMany(row => SkillTaxonomyNormalizer.Canonicalize(
                            ParseSkills(row.JDExtractedSkills), canonicalSkillMap))
                        .ToHashSet(StringComparer.OrdinalIgnoreCase),
                    StringComparer.OrdinalIgnoreCase);

            var applicationDomains = await (from application in _context.Applications.AsNoTracking()
                                            join job in _context.JobPostings.AsNoTracking() on application.JobID equals job.JobID
                                            join category in _context.Categories.AsNoTracking() on job.CategoryID equals category.CategoryID into categoryJoin
                                            from category in categoryJoin.DefaultIfEmpty()
                                            where cvIds.Contains(application.CVID)
                                            select new { application.CVID, Domain = category == null ? null : category.Name })
                .ToListAsync(cancellationToken);
            var savedPoolDomains = await _context.TalentPoolCandidates.AsNoTracking()
                .Where(x => x.IsActive && cvIds.Contains(x.LatestCVID) && x.DomainJson != null)
                .Select(x => new { x.LatestCVID, x.DomainJson })
                .ToListAsync(cancellationToken);

            var existing = await _context.CandidateCvDomains
                .Where(x => cvIds.Contains(x.CVID))
                .ToListAsync(cancellationToken);
            var changed = 0;

            foreach (var cv in cvs)
            {
                var skills = SkillTaxonomyNormalizer.Canonicalize(
                        ParseSkills(cv.CVExtractedSkills), canonicalSkillMap)
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);
                var strongApplicationDomains = applicationDomains.Where(x => x.CVID == cv.CVID && !string.IsNullOrWhiteSpace(x.Domain))
                    .Select(x => CanonicalizeDomain(x.Domain!, canonicalDomains)).Where(x => x != null).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                var savedDomains = savedPoolDomains.Where(x => x.LatestCVID == cv.CVID)
                    .SelectMany(x => ParseSkills(x.DomainJson))
                    .Select(x => CanonicalizeDomain(x, canonicalDomains)).Where(x => x != null).Distinct(StringComparer.OrdinalIgnoreCase).ToList();

                var desired = new Dictionary<string, DomainEvidence>(StringComparer.OrdinalIgnoreCase);
                foreach (var domain in strongApplicationDomains.OfType<string>())
                    desired[domain] = new DomainEvidence(1.0m, "ApplicationJob", Array.Empty<string>(), true);
                foreach (var domain in savedDomains.OfType<string>())
                {
                    if (desired.ContainsKey(domain) == false)
                        desired[domain] = new DomainEvidence(0.95m, "RecruiterSaved", Array.Empty<string>(), true);
                }
                foreach (var profile in jobSkillProfiles)
                {
                    if (desired.ContainsKey(profile.Key) || profile.Value.Count == 0) continue;
                    var matched = profile.Value.Where(skills.Contains).OrderBy(value => value).ToList();
                    var confidence = CalculateConfidence(matched.Count);
                    if (confidence < 0.6m) continue;
                    desired[profile.Key] = new DomainEvidence(confidence, "CVJobSkillProfile", matched, false);
                }

                foreach (var (domain, evidence) in desired)
                {
                    var row = existing.FirstOrDefault(x => x.CVID == cv.CVID && x.Domain == domain);
                    var evidenceJson = JsonSerializer.Serialize(evidence.MatchedSkills);
                    if (row == null)
                    {
                        row = new Models.CandidateCvDomain
                        {
                            CVID = cv.CVID,
                            Domain = domain,
                            Confidence = evidence.Confidence,
                            Source = evidence.Source,
                            EvidenceJson = evidenceJson,
                            IsConfirmed = evidence.IsConfirmed,
                            UpdatedAt = DateTime.UtcNow
                        };
                        _context.CandidateCvDomains.Add(row);
                        existing.Add(row);
                        changed++;
                    }
                    else if (row.Confidence != evidence.Confidence
                        || row.Source != evidence.Source
                        || row.EvidenceJson != evidenceJson
                        || row.IsConfirmed != evidence.IsConfirmed)
                    {
                        row.Confidence = evidence.Confidence;
                        row.Source = evidence.Source;
                        row.EvidenceJson = evidenceJson;
                        row.IsConfirmed = evidence.IsConfirmed;
                        row.UpdatedAt = DateTime.UtcNow;
                        changed++;
                    }
                }

                var staleAutomaticRows = existing
                    .Where(row => row.CVID == cv.CVID && row.IsConfirmed == false && desired.ContainsKey(row.Domain) == false)
                    .ToList();
                if (staleAutomaticRows.Count > 0)
                {
                    _context.CandidateCvDomains.RemoveRange(staleAutomaticRows);
                    foreach (var stale in staleAutomaticRows) existing.Remove(stale);
                    changed += staleAutomaticRows.Count;
                }
            }

            if (changed > 0) await _context.SaveChangesAsync(cancellationToken);
            return changed;
        }

        private static HashSet<string> ParseSkills(string json)
        {
            try
            {
                var values = JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
                return values.Select(NormalizeSkill).Where(x => x.Length > 0).ToHashSet(StringComparer.OrdinalIgnoreCase);
            }
            catch { return new HashSet<string>(StringComparer.OrdinalIgnoreCase); }
        }

        private static string NormalizeSkill(string value) => string.Join(" ", (value ?? "").Trim().ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));

        private static string? CanonicalizeDomain(string value, IReadOnlyDictionary<string, string> canonicalDomains)
        {
            var name = value.Trim();
            return canonicalDomains.TryGetValue(name, out var canonical) ? canonical : null;
        }

        private static decimal CalculateConfidence(int matchedCount) => matchedCount switch
        {
            >= 5 => 0.9m,
            4 => 0.82m,
            3 => 0.74m,
            2 => 0.62m,
            _ => 0m
        };

        private sealed record DomainEvidence(decimal Confidence, string Source, IReadOnlyCollection<string> MatchedSkills, bool IsConfirmed);
    }
}
