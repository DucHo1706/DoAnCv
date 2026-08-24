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
    public class AprioriService : IAprioriService
    {
        private readonly AppDbContext _context;
        private readonly IAiService _aiService;

        public AprioriService(AppDbContext context, IAiService aiService)
        {
            _context = context;
            _aiService = aiService;
        }

        public async Task<(bool IsSuccess, string Message, object Data)> TrainAprioriModelAsync()
        {
            try
            {
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
                    return (false, "Chưa có taxonomy kỹ năng đã duyệt để huấn luyện Apriori.", null);
                }

                var canonicalMap = SkillTaxonomyNormalizer.BuildCanonicalMap(approvedSkills);
                var taxonomyAliases = SkillTaxonomyNormalizer.AliasMapForApi(canonicalMap, approvedTaxonomy);
                var trainedDomains = new List<object>();
                var failedDomains = new List<string>();
                var resetModels = true;
                foreach (var group in domainRows.GroupBy(row => row.Domain.Trim(), StringComparer.OrdinalIgnoreCase))
                {
                    var transactions = group
                        .Select(row => skillsByCv.TryGetValue(row.CVID, out var json)
                            ? SkillTaxonomyNormalizer.Canonicalize(ParseSkills(json), canonicalMap)
                            : new List<string>())
                        .Where(skills => skills.Count > 0)
                        .ToList();
                    if (transactions.Count < 5) continue;

                    var domainCode = BuildDomainCode(group.Key);
                    var isSuccess = await _aiService.TrainAprioriAsync(
                        transactions,
                        group.Key,
                        $"cv-{domainCode}-{DateTime.UtcNow:yyyyMMddHHmmss}",
                        approvedTaxonomy,
                        taxonomyAliases,
                        resetModels);
                    if (isSuccess)
                    {
                        trainedDomains.Add(new { Domain = group.Key, CvCount = transactions.Count });
                        resetModels = false;
                    }
                    else
                        failedDomains.Add(group.Key);
                }

                if (trainedDomains.Count == 0)
                    return (false, "Chưa có ngành nào đủ tối thiểu 5 CV có kỹ năng hợp lệ để chạy Apriori; không dùng dữ liệu giả.", null);
                if (failedDomains.Count > 0)
                    return (false, $"Apriori chưa hoàn tất cho các ngành: {string.Join(", ", failedDomains)}.", new { TrainedDomains = trainedDomains });

                return (true, $"Đã khai phá Apriori riêng cho {trainedDomains.Count} ngành.", new { TrainedDomains = trainedDomains });
            }
            catch (Exception ex)
            {
                return (false, "Lỗi hệ thống khi huấn luyện Apriori: " + ex.Message, null);
            }
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

        public async Task<(bool IsSuccess, string Message, object Data)> GetAssociationRulesAsync()
        {
            try
            {
                var rulesJson = await _aiService.GetAssociationRulesJsonAsync();
                using var doc = JsonDocument.Parse(rulesJson);
                var root = doc.RootElement;
                if (root.TryGetProperty("rules", out var rulesProp))
                {
                    return (true, "Lấy danh sách luật kết hợp thành công.", rulesProp.Clone());
                }
                return (false, "Dịch vụ AI trả về dữ liệu không đúng định dạng.", null);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi lấy danh sách luật kết hợp: " + ex.Message, null);
            }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> RecommendSkillsAsync(List<string> currentSkills, int topN)
        {
            try
            {
                if (currentSkills == null || currentSkills.Count == 0)
                {
                    return (true, "Danh sách kỹ năng đầu vào trống.", new List<string>());
                }

                var approvedSkills = await _context.Skills.AsNoTracking()
                    .Include(skill => skill.Aliases)
                    .Where(skill => skill.IsApproved)
                    .ToListAsync();
                var canonicalMap = SkillTaxonomyNormalizer.BuildCanonicalMap(approvedSkills);
                var canonicalSkills = SkillTaxonomyNormalizer.Canonicalize(currentSkills, canonicalMap);
                if (canonicalSkills.Count == 0)
                    return (true, "Không nhận diện được kỹ năng nào thuộc taxonomy đã duyệt.", new List<string>());

                var recommendations = await _aiService.RecommendSkillsAsync(canonicalSkills, topN);
                return (true, "Đề xuất kỹ năng đi kèm thành công.", recommendations);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi lấy đề xuất kỹ năng: " + ex.Message, null);
            }
        }
    }
}
