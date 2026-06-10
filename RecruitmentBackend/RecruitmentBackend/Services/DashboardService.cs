using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Interfaces;
using System;
using System.Linq;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;

namespace RecruitmentBackend.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;

        public DashboardService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetAdminDashboardStatsAsync(string? jobId, string? timeRange)
        {
            // Kết hợp CV và Đơn ứng tuyển để lấy JobId
            var query = from cv in _context.CandidateCVs
                        join app in _context.Applications on cv.CVID equals app.CVID
                        select new { cv, app };

            // BỘ LỌC 1: Theo Tin Tuyển Dụng (JD)
            if (!string.IsNullOrEmpty(jobId))
            {
                query = query.Where(x => x.app.JobID == jobId);
            }

            // BỘ LỌC 2: Theo Thời gian (Tùy chọn)
            // (Nếu bảng Application của bạn chưa có trường CreatedAt thì bạn có thể tạm bỏ qua khối if này)
            /*
            var now = DateTime.Now;
            if (timeRange == "month")
                query = query.Where(x => x.app.CreatedAt.Month == now.Month && x.app.CreatedAt.Year == now.Year);
            else if (timeRange == "quarter")
                query = query.Where(x => x.app.CreatedAt.Month >= now.Month - 2 && x.app.CreatedAt.Year == now.Year);
            else if (timeRange == "year")
                query = query.Where(x => x.app.CreatedAt.Year == now.Year);
            */

            // Lấy danh sách CV đã lọc
            var filteredCVs = await query.Select(x => x.cv).ToListAsync();

            // Tổng quan (Không bị ảnh hưởng bởi bộ lọc CV)
            var totalUsers = await _context.Accounts.CountAsync();
            var totalJobs = await _context.JobPostings.CountAsync();
            var totalAnalyzedCVs = filteredCVs.Count;

            // Nhóm dữ liệu: Bằng cấp
            var degreeStats = filteredCVs
                .Where(x => !string.IsNullOrEmpty(x.Degree))
                .GroupBy(x => x.Degree)
                .Select(g => new { type = g.Key, value = g.Count() }).ToList();

            // Nhóm dữ liệu: Chuyên ngành (Chỉ lấy Top 5 để biểu đồ tròn không bị rối)
            var majorStats = filteredCVs
                .Where(x => !string.IsNullOrEmpty(x.Major))
                .GroupBy(x => x.Major)
                .Select(g => new { type = g.Key, value = g.Count() })
                .OrderByDescending(x => x.value).Take(5).ToList();

            // Nhóm dữ liệu: Trường Đại học (Chỉ lấy Top 5)
            var uniStats = filteredCVs
                .Where(x => !string.IsNullOrEmpty(x.University))
                .GroupBy(x => x.University)
                .Select(g => new { type = g.Key, value = g.Count() })
                .OrderByDescending(x => x.value).Take(5).ToList();

            // Nhóm dữ liệu: Số năm kinh nghiệm (Chia khoảng)
            var expStats = new[]
            {
                new { range = "Dưới 1 năm", count = filteredCVs.Count(e => e.YearsOfExperience < 1) },
                new { range = "1-3 năm", count = filteredCVs.Count(e => e.YearsOfExperience >= 1 && e.YearsOfExperience <= 3) },
                new { range = "3-5 năm", count = filteredCVs.Count(e => e.YearsOfExperience > 3 && e.YearsOfExperience <= 5) },
                new { range = "Trên 5 năm", count = filteredCVs.Count(e => e.YearsOfExperience > 5) }
            };

            // Trả về gói JSON lớn cho Frontend
            return new
            {
                totalUsers,
                totalJobs,
                totalAnalyzedCVs,
                degreeData = degreeStats,
                majorData = majorStats,
                universityData = uniStats,
                expData = expStats
            };
        }

        public async Task<object> GetHrDashboardStatsAsync(string accountId, string? jobId, string? timeRange)
        {
            var recruiter = await _context.Recruiters.FirstOrDefaultAsync(r => r.AccountID == accountId);
            if (recruiter == null) return null;

            // 1. Chỉ lấy các Job do HR này đăng
            var hrJobIds = await _context.JobPostings
                .Where(j => j.RecruiterID == recruiter.RecruiterID)
                .Select(j => j.JobID)
                .ToListAsync();

            var query = from cv in _context.CandidateCVs
                        join app in _context.Applications on cv.CVID equals app.CVID
                        where hrJobIds.Contains(app.JobID)
                        select new { cv, app };

            if (!string.IsNullOrEmpty(jobId))
            {
                query = query.Where(x => x.app.JobID == jobId);
            }

            var filteredData = await query.ToListAsync();
            var filteredCVs = filteredData.Select(x => x.cv).ToList();
            var filteredApps = filteredData.Select(x => x.app).ToList();

            // 2. Tổng quan
            var totalJobs = hrJobIds.Count;
            var totalApplications = filteredApps.Count;

            // 3. Số lượng ứng tuyển theo từng Tin tuyển dụng (Job)
            var applicationsPerJob = await (from app in _context.Applications
                                            where hrJobIds.Contains(app.JobID)
                                            join j in _context.JobPostings on app.JobID equals j.JobID
                                            join p in _context.Positions on j.PositionID equals p.PositionID into pj
                                            from p in pj.DefaultIfEmpty()
                                            group app by p != null ? p.PositionName : "Khác" into g
                                            select new { jobName = g.Key, count = g.Count() }).ToListAsync();

            // 4. Các thống kê Pie Chart (Bằng cấp, Chuyên ngành)
            var degreeStats = filteredCVs.Where(x => !string.IsNullOrEmpty(x.Degree)).GroupBy(x => x.Degree).Select(g => new { type = g.Key, value = g.Count() }).ToList();
            var majorStats = filteredCVs.Where(x => !string.IsNullOrEmpty(x.Major)).GroupBy(x => x.Major).Select(g => new { type = g.Key, value = g.Count() }).OrderByDescending(x => x.value).Take(5).ToList();
            var uniStats = filteredCVs.Where(x => !string.IsNullOrEmpty(x.University)).GroupBy(x => x.University).Select(g => new { type = g.Key, value = g.Count() }).OrderByDescending(x => x.value).Take(5).ToList();

            // Xử lý Group By cho chuỗi JSON Certificates
            var certList = new List<string>();
            foreach (var cv in filteredCVs)
            {
                // Dùng reflection hoặc dynamic nếu bạn đặt tên properties là certificates
                var certJson = cv.GetType().GetProperty("Certificates")?.GetValue(cv, null) as string;
                if (!string.IsNullOrEmpty(certJson) && certJson != "[]")
                {
                    try {
                        var parsed = JsonSerializer.Deserialize<List<string>>(certJson);
                        if (parsed != null) certList.AddRange(parsed);
                    } catch { }
                }
            }
            var certStats = certList
                .GroupBy(c => c)
                .Select(g => new { type = g.Key, value = g.Count() })
                .OrderByDescending(x => x.value)
                .Take(5).ToList();

            var expStats = new[] {
                new { range = "Dưới 1 năm", count = filteredCVs.Count(e => e.YearsOfExperience < 1) },
                new { range = "1-3 năm", count = filteredCVs.Count(e => e.YearsOfExperience >= 1 && e.YearsOfExperience <= 3) },
                new { range = "3-5 năm", count = filteredCVs.Count(e => e.YearsOfExperience > 3 && e.YearsOfExperience <= 5) },
                new { range = "Trên 5 năm", count = filteredCVs.Count(e => e.YearsOfExperience > 5) }
            };

            // 5. Danh sách ứng viên đã nộp (Biết ai nộp vào Job nào, xếp hạng theo điểm AI)
            var recentApplications = await (from app in _context.Applications
                                            where hrJobIds.Contains(app.JobID)
                                            join cv in _context.CandidateCVs on app.CVID equals cv.CVID
                                            join cand in _context.Candidates on cv.CandidateID equals cand.CandidateID
                                            join j in _context.JobPostings on app.JobID equals j.JobID
                                            join p in _context.Positions on j.PositionID equals p.PositionID into pj
                                            from p in pj.DefaultIfEmpty()
                                            join ai in _context.AIEvaluations on app.ApplicationID equals ai.ApplicationID into aiGrp
                                            from ai in aiGrp.DefaultIfEmpty()
                                            orderby ai != null ? ai.FitScore : 0m descending
                                            select new {
                                                id = app.ApplicationID,
                                                candidateName = cand.FullName,
                                                jobTitle = p != null ? p.PositionName : "Chưa cập nhật",
                                                aiScore = ai != null ? ai.FitScore : 0m,
                                                classification = ai != null ? ai.Classification : "Chưa phân loại"
                                            }).Take(10).ToListAsync();

            return new {
                totalJobs, totalApplications,
                applicationsPerJob, recentApplications,
                degreeData = degreeStats, majorData = majorStats, expData = expStats, 
                universityData = uniStats, certificateData = certStats
            };
        }
    }
}
