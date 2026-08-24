using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;

namespace RecruitmentBackend.Services
{
    /// <summary>
    /// Bảo đảm danh mục cấp bậc dùng chung có đủ các cấp phổ biến. Seeder nhận
    /// diện cả tên Việt/Anh cũ, chuyển tham chiếu tin tuyển dụng về một bản ghi
    /// chuẩn và vô hiệu hóa bản ghi đồng nghĩa thay vì xóa dữ liệu.
    /// </summary>
    public static class JobLevelCatalogSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            JobLevelCatalog.ValidateDefinitions();
            var levels = await context.JobLevels.ToListAsync();
            var jobs = await context.JobPostings
                .Where(job => job.JobLevelID != null)
                .ToListAsync();
            var jobCounts = jobs
                .Where(job => !string.IsNullOrWhiteSpace(job.JobLevelID))
                .GroupBy(job => job.JobLevelID!)
                .ToDictionary(group => group.Key, group => group.Count());
            Dictionary<string, JobLevel> canonicalByKey = new(StringComparer.OrdinalIgnoreCase);
            bool changed = false;

            foreach (JobLevelCatalog.Definition definition in JobLevelCatalog.Definitions.Where(item => item.IsGroup))
            {
                var matches = levels
                    .Where(level => JobLevelCatalog.FindDefinition(level.Name)?.Key == definition.Key)
                    .ToList();
                JobLevel canonical = ChooseCanonical(matches, jobCounts) ?? new JobLevel
                {
                    JobLevelID = Guid.NewGuid().ToString(),
                    Name = definition.Name,
                    ParentId = null,
                    IsActive = true
                };
                if (!levels.Contains(canonical))
                {
                    context.JobLevels.Add(canonical);
                    levels.Add(canonical);
                    changed = true;
                }

                changed |= ApplyCanonicalValues(canonical, definition.Name, null);
                canonicalByKey[definition.Key] = canonical;
                changed |= MergeDuplicates(levels, jobs, matches, canonical);
            }

            foreach (JobLevelCatalog.Definition definition in JobLevelCatalog.Definitions.Where(item => !item.IsGroup))
            {
                JobLevel parent = canonicalByKey[definition.ParentKey!];
                var matches = levels
                    .Where(level => JobLevelCatalog.FindDefinition(level.Name)?.Key == definition.Key)
                    .ToList();
                JobLevel canonical = ChooseCanonical(matches, jobCounts) ?? new JobLevel
                {
                    JobLevelID = Guid.NewGuid().ToString(),
                    Name = definition.Name,
                    ParentId = parent.JobLevelID,
                    IsActive = true
                };
                if (!levels.Contains(canonical))
                {
                    context.JobLevels.Add(canonical);
                    levels.Add(canonical);
                    changed = true;
                }

                changed |= ApplyCanonicalValues(canonical, definition.Name, parent.JobLevelID);
                canonicalByKey[definition.Key] = canonical;
                changed |= MergeDuplicates(levels, jobs, matches, canonical);
            }

            if (changed)
            {
                await context.SaveChangesAsync();
            }
        }

        private static JobLevel? ChooseCanonical(
            IReadOnlyCollection<JobLevel> matches,
            IReadOnlyDictionary<string, int> jobCounts)
        {
            return matches
                .OrderByDescending(level => jobCounts.GetValueOrDefault(level.JobLevelID))
                .ThenByDescending(level => level.IsActive)
                .ThenBy(level => level.JobLevelID, StringComparer.Ordinal)
                .FirstOrDefault();
        }

        private static bool ApplyCanonicalValues(JobLevel level, string name, string? parentId)
        {
            bool changed = false;
            if (!string.Equals(level.Name, name, StringComparison.Ordinal))
            {
                level.Name = name;
                changed = true;
            }
            if (!string.Equals(level.ParentId, parentId, StringComparison.Ordinal))
            {
                level.ParentId = parentId;
                changed = true;
            }
            if (!level.IsActive)
            {
                level.IsActive = true;
                changed = true;
            }
            return changed;
        }

        private static bool MergeDuplicates(
            IReadOnlyCollection<JobLevel> allLevels,
            IReadOnlyCollection<JobPosting> jobs,
            IReadOnlyCollection<JobLevel> matches,
            JobLevel canonical)
        {
            bool changed = false;
            foreach (JobLevel duplicate in matches.Where(level => level.JobLevelID != canonical.JobLevelID))
            {
                foreach (JobPosting job in jobs.Where(job => job.JobLevelID == duplicate.JobLevelID))
                {
                    job.JobLevelID = canonical.JobLevelID;
                    changed = true;
                }
                foreach (JobLevel child in allLevels.Where(level => level.ParentId == duplicate.JobLevelID))
                {
                    child.ParentId = canonical.JobLevelID;
                    changed = true;
                }
                if (duplicate.IsActive)
                {
                    duplicate.IsActive = false;
                    changed = true;
                }
                duplicate.ParentId = null;
                string mergedName = $"[Đã hợp nhất] {duplicate.Name}";
                if (mergedName.Length > 100)
                {
                    mergedName = mergedName[..100];
                }
                if (!duplicate.Name.StartsWith("[Đã hợp nhất]", StringComparison.Ordinal))
                {
                    duplicate.Name = mergedName;
                    changed = true;
                }
            }
            return changed;
        }
    }
}
