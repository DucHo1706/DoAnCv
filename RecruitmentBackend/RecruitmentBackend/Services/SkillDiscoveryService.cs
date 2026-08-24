using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace RecruitmentBackend.Services
{
    /// <summary>
    /// Thu gom skill mới theo batch. Không tự duyệt skill chưa đủ bằng chứng.
    /// </summary>
    public class SkillDiscoveryService : ISkillDiscoveryService
    {
        private static readonly Regex Mojibake = new(@"(?:Ã.|Â.|áº|Ä.|�)", RegexOptions.Compiled);
        private readonly AppDbContext _context;
        private readonly string _queuePath;

        public SkillDiscoveryService(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            var directory = Path.Combine(environment.ContentRootPath, "App_Data");
            Directory.CreateDirectory(directory);
            _queuePath = Path.Combine(directory, "skill-discovery-queue.json");
        }

        public async Task<int> CollectAsync(CancellationToken cancellationToken = default)
        {
            var approvedSkills = (await _context.Skills.AsNoTracking()
                .Where(skill => skill.IsApproved)
                .Select(skill => skill.Name)
                .ToListAsync(cancellationToken))
                .Select(Normalize)
                .Where(skill => skill.Length > 0)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
            var raw = await _context.CandidateCVs.AsNoTracking()
                .Where(cv => cv.CVExtractedSkills != null && cv.CVExtractedSkills != "[]")
                .Select(cv => cv.CVExtractedSkills)
                .ToListAsync(cancellationToken);
            var counts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            foreach (var json in raw)
            {
                try
                {
                    var skills = JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
                    foreach (var value in skills.Select(Normalize).Where(x => x.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase))
                        counts[value] = counts.TryGetValue(value, out var count) ? count + 1 : 1;
                }
                catch { }
            }

            var pending = counts
                .Where(x => !approvedSkills.Contains(x.Key) && !IsSuspicious(x.Key))
                .OrderByDescending(x => x.Value)
                .Select(x => new
                {
                    rawSkill = x.Key,
                    occurrences = x.Value,
                    status = x.Value >= 3 ? "candidate_for_review" : "quarantine",
                    reason = x.Value >= 3 ? "Xuất hiện ở nhiều CV, cần chuẩn hóa trước khi duyệt." : "Chưa đủ tần suất để kết luận skill hợp lệ."
                })
                .ToList();

            var payload = new
            {
                generatedAtUtc = DateTime.UtcNow,
                totalCvTransactions = raw.Count,
                pendingCount = pending.Count,
                pending
            };
            var tempPath = _queuePath + ".tmp";
            await File.WriteAllTextAsync(tempPath, JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = true }), cancellationToken);
            File.Move(tempPath, _queuePath, true);
            return pending.Count;
        }

        private static string Normalize(string value) => string.Join(" ", (value ?? "").Trim().ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));
        private static bool IsSuspicious(string value) => value.Length > 64 || value.Split(' ').Length > 5 || Mojibake.IsMatch(value);
    }
}
