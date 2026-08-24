using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;

namespace RecruitmentBackend.Services;

/// <summary>
/// Chuẩn hóa các tên chi nhánh bị nhập trùng trong dữ liệu local.
/// </summary>
public static class BranchCatalogSeeder
{
    public static async Task NormalizeAsync(AppDbContext context)
    {
        var candidates = (await context.Branches.ToListAsync())
            .Where(branch =>
                branch.BranchName.Contains("Hồ Chí Minh", StringComparison.OrdinalIgnoreCase) ||
                branch.BranchName.Contains("Ho Chi Minh", StringComparison.OrdinalIgnoreCase))
            .OrderBy(branch => branch.BranchID)
            .ToList();

        if (candidates.Count == 0) return;

        var canonical = candidates.First();
        canonical.BranchName = "TP. Hồ Chí Minh";
        var linksToAdd = new List<(string RecruiterId, string BranchId)>();
        var canonicalRecruiterIds = (await context.RecruiterBranches
                .Where(link => link.BranchID == canonical.BranchID)
                .Select(link => link.RecruiterID)
                .ToListAsync())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var duplicate in candidates.Skip(1).ToList())
        {
            var jobs = await context.JobPostings
                .Where(job => job.BranchID == duplicate.BranchID)
                .ToListAsync();
            foreach (var job in jobs) job.BranchID = canonical.BranchID;

            var duplicateLinks = await context.RecruiterBranches
                .Where(link => link.BranchID == duplicate.BranchID)
                .ToListAsync();
            foreach (var link in duplicateLinks)
            {
                // BranchID là một phần khóa chính: không đổi trực tiếp. Xóa
                // liên kết trước, sau SaveChanges sẽ tạo lại bằng khóa mới.
                if (canonicalRecruiterIds.Add(link.RecruiterID))
                {
                    linksToAdd.Add((link.RecruiterID, canonical.BranchID));
                }
                context.RecruiterBranches.Remove(link);
            }

            context.Branches.Remove(duplicate);
        }

        await context.SaveChangesAsync();
        if (linksToAdd.Count > 0)
        {
            context.RecruiterBranches.AddRange(linksToAdd.Select(link => new RecruiterBranch
            {
                RecruiterID = link.RecruiterId,
                BranchID = link.BranchId
            }));
            await context.SaveChangesAsync();
        }
    }
}
