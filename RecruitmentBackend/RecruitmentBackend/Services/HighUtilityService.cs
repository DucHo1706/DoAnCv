using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using RecruitmentBackend.Utilities;

namespace RecruitmentBackend.Services
{
    public class HighUtilityService : IHighUtilityService
    {
        private readonly AppDbContext _context;
        private readonly IAiService _aiService;

        public HighUtilityService(AppDbContext context, IAiService aiService)
        {
            _context = context;
            _aiService = aiService;
        }

        public async Task<(bool IsSuccess, string Message, object Data)> TrainHighUtilityModelAsync(double minUtility)
        {
            try
            {
                var jobRows = await (from job in _context.JobPostings.AsNoTracking()
                                     join category in _context.Categories.AsNoTracking()
                                         on job.CategoryID equals category.CategoryID
                                     where category.IsActive
                                           && job.JDExtractedSkills != null
                                           && job.SalaryMax > 0
                                           && (job.Status == "Published" || job.Status == "Closed")
                                     select new DomainJobRow
                                     {
                                         Domain = category.Name,
                                         JDExtractedSkills = job.JDExtractedSkills,
                                         SalaryMax = job.SalaryMax
                                     })
                    .ToListAsync();
                var domainRows = await _context.CandidateCvDomains.AsNoTracking()
                    .Where(row => row.Confidence >= 0.6m && row.Domain != "")
                    .Select(row => new { row.CVID, row.Domain })
                    .ToListAsync();
                var relevantCvIds = domainRows.Select(row => row.CVID).Distinct().ToList();
                var cvRows = await _context.CandidateCVs.AsNoTracking()
                    .Where(cv => relevantCvIds.Contains(cv.CVID) && string.IsNullOrEmpty(cv.CVExtractedSkills) == false)
                    .Select(cv => new { cv.CVID, cv.CVExtractedSkills })
                    .ToListAsync();
                var skillsByCv = cvRows.ToDictionary(row => row.CVID, row => row.CVExtractedSkills);

                var approvedSkills = await _context.Skills.AsNoTracking()
                    .Include(skill => skill.Aliases)
                    .Where(skill => skill.IsApproved)
                    .ToListAsync();
                var approvedTaxonomy = approvedSkills
                    .Select(skill => skill.Name.Trim().ToLowerInvariant())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(skill => skill, StringComparer.OrdinalIgnoreCase)
                    .ToList();
                if (approvedTaxonomy.Count == 0)
                {
                    return (false, "Chưa có taxonomy kỹ năng đã duyệt để huấn luyện HUIM.", null);
                }
                var canonicalMap = SkillTaxonomyNormalizer.BuildCanonicalMap(approvedSkills);
                var taxonomyAliases = SkillTaxonomyNormalizer.AliasMapForApi(canonicalMap, approvedTaxonomy);
                var trainedDomains = new List<object>();
                var failedDomains = new List<string>();
                var resetModels = true;
                foreach (var group in domainRows.GroupBy(row => row.Domain.Trim(), StringComparer.OrdinalIgnoreCase))
                {
                    var domainJobs = jobRows.Where(job => string.Equals(job.Domain, group.Key, StringComparison.OrdinalIgnoreCase)).ToList();
                    var externalUtilities = BuildExternalUtilities(domainJobs, canonicalMap);
                    var transactions = group
                        .Select(row => skillsByCv.TryGetValue(row.CVID, out var json)
                            ? BuildTransaction(json, canonicalMap)
                            : null)
                        .Where(transaction => transaction != null)
                        .Cast<object>()
                        .ToList();
                    if (transactions.Count < 5 || externalUtilities.Count == 0) continue;

                    var payload = new
                    {
                        transactions,
                        external_utilities = externalUtilities,
                        min_utility = minUtility,
                        domain = group.Key,
                        taxonomy_skills = approvedTaxonomy,
                        taxonomy_aliases = taxonomyAliases,
                        dataset_id = $"cv-jd-{BuildDomainCode(group.Key)}-{DateTime.UtcNow:yyyyMMddHHmmss}",
                        min_support_count = 2,
                        reset_models = resetModels
                    };
                    var isSuccess = await _aiService.TrainHuimAsync(payload);
                    if (isSuccess)
                    {
                        trainedDomains.Add(new { Domain = group.Key, CvCount = transactions.Count, JobCount = domainJobs.Count });
                        resetModels = false;
                    }
                    else
                        failedDomains.Add(group.Key);
                }

                if (trainedDomains.Count == 0)
                    return (false, "Chưa có ngành nào đồng thời đủ 5 CV, kỹ năng đã duyệt và JD có lương hợp lệ để chạy HUIM; không dùng dữ liệu giả.", null);
                if (failedDomains.Count > 0)
                    return (false, $"HUIM chưa hoàn tất cho các ngành: {string.Join(", ", failedDomains)}.", new { TrainedDomains = trainedDomains });
                return (true, $"Đã khai phá HUIM riêng cho {trainedDomains.Count} ngành.", new { TrainedDomains = trainedDomains });
            }
            catch (Exception ex)
            {
                return (false, "Lỗi hệ thống khi huấn luyện HUIM: " + ex.Message, null);
            }
        }

        private static Dictionary<string, double> BuildExternalUtilities(
            IEnumerable<DomainJobRow> jobs,
            IReadOnlyDictionary<string, string> canonicalMap)
        {
            var sum = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
            var count = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            foreach (var job in jobs)
            {
                foreach (var skill in SkillTaxonomyNormalizer.Canonicalize(
                    ParseSkills(job.JDExtractedSkills), canonicalMap))
                {
                    sum[skill] = sum.TryGetValue(skill, out var current) ? current + job.SalaryMax : job.SalaryMax;
                    count[skill] = count.TryGetValue(skill, out var currentCount) ? currentCount + 1 : 1;
                }
            }
            return sum.ToDictionary(pair => pair.Key, pair => Math.Round((double)(pair.Value / count[pair.Key]), 2), StringComparer.OrdinalIgnoreCase);
        }

        private static object? BuildTransaction(
            string json,
            IReadOnlyDictionary<string, string> canonicalMap)
        {
            var skills = SkillTaxonomyNormalizer.Canonicalize(ParseSkills(json), canonicalMap);
            if (skills.Count == 0) return null;
            return new { items = skills, quantities = skills.ToDictionary(skill => skill, _ => 1, StringComparer.OrdinalIgnoreCase) };
        }

        private static List<string> ParseSkills(string json)
        {
            try
            {
                return (JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>())
                    .Select(skill => skill.Trim().ToLowerInvariant())
                    .Where(skill => skill.Length > 0)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();
            }
            catch { return new List<string>(); }
        }

        private static string BuildDomainCode(string domain)
        {
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(domain.Trim().ToLowerInvariant()));
            return Convert.ToHexString(hash)[..10].ToLowerInvariant();
        }

        private sealed class DomainJobRow
        {
            public string Domain { get; set; } = string.Empty;
            public string JDExtractedSkills { get; set; } = string.Empty;
            public decimal SalaryMax { get; set; }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> GetHighUtilityItemsetsAsync()
        {
            try
            {
                var itemsetsJson = await _aiService.GetHighUtilityItemsetsJsonAsync();
                using var doc = JsonDocument.Parse(itemsetsJson);
                var root = doc.RootElement;
                if (root.TryGetProperty("itemsets", out var itemsetsProp))
                {
                    return (true, "Lấy danh sách tập kỹ năng lợi ích cao thành công.", itemsetsProp.Clone());
                }
                return (false, "Dịch vụ AI trả về dữ liệu không đúng định dạng.", null);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi lấy danh sách HUIM: " + ex.Message, null);
            }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> RecommendSkillsAsync(List<string> currentSkills, int topN)
        {
            try
            {
                if (currentSkills == null || currentSkills.Count == 0)
                {
                    return (true, "Danh sách kỹ năng đầu vào trống.", new List<object>());
                }

                var approvedSkills = await _context.Skills.AsNoTracking()
                    .Include(skill => skill.Aliases)
                    .Where(skill => skill.IsApproved)
                    .ToListAsync();
                var canonicalMap = SkillTaxonomyNormalizer.BuildCanonicalMap(approvedSkills);
                var canonicalSkills = SkillTaxonomyNormalizer.Canonicalize(currentSkills, canonicalMap);
                if (canonicalSkills.Count == 0)
                    return (true, "Không nhận diện được kỹ năng nào thuộc taxonomy đã duyệt.", new List<object>());

                var recsJson = await _aiService.RecommendHighUtilitySkillsAsync(canonicalSkills, topN);
                using var doc = JsonDocument.Parse(recsJson);
                var root = doc.RootElement;
                if (root.TryGetProperty("recommended_skills", out var recommendedProp))
                {
                    return (true, "Đề xuất kỹ năng lợi ích cao thành công.", recommendedProp.Clone());
                }
                return (false, "Dịch vụ AI trả về dữ liệu gợi ý không đúng định dạng.", null);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi gợi ý kỹ năng HUIM: " + ex.Message, null);
            }
        }
    }
}
