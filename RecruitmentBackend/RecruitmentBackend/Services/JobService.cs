﻿﻿﻿﻿﻿using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;

namespace RecruitmentBackend.Services
{
    public class JobService : IJobService
    {
        private readonly AppDbContext _context;
        private readonly IAiService _aiService;
        private readonly ILogger<JobService> _logger;

        public JobService(AppDbContext context, IAiService aiService, ILogger<JobService> logger)
        {
            _context = context;
            _aiService = aiService;
            _logger = logger;
        }

        public async Task<string> CreatePendingJobAsync(CreateJobRequest request, string accountId)
        {
            var recruiter = await _context.Recruiters.FirstOrDefaultAsync(r => r.AccountID == accountId);
            if (recruiter == null) throw new Exception("Không tìm thấy thông tin Nhà tuyển dụng hợp lệ!");

            var position = await _context.Positions.FindAsync(request.PositionId);
            if (position == null) throw new Exception("Vị trí không tồn tại");
            
            decimal minSal = 0, maxSal = 0;
            if (!string.IsNullOrWhiteSpace(request.SalaryRange))
            {
                
                var cleanText = request.SalaryRange.Replace(",", "").Replace(".", "");
                
                var matches = System.Text.RegularExpressions.Regex.Matches(cleanText, @"\d+");
                
                if (matches.Count >= 2)
                {
                    decimal.TryParse(matches[0].Value, out minSal);
                    decimal.TryParse(matches[1].Value, out maxSal);
                    if (minSal > maxSal) { var temp = minSal; minSal = maxSal; maxSal = temp; }
                }
                else if (matches.Count == 1)
                {
                    decimal.TryParse(matches[0].Value, out minSal);
                }

                if (minSal >= 1000) minSal /= 1000000;
                if (maxSal >= 1000) maxSal /= 1000000;
            }

            var newJob = new JobPosting
            {
                JobID = Guid.NewGuid().ToString(),
                PositionID = request.PositionId,
                BranchID = request.BranchId,
                RecruiterID = recruiter.RecruiterID,
                JobDescription = request.Description,
                JobRequirement = request.Requirements,
                SalaryMin = minSal, 
                SalaryMax = maxSal,
                StartDate = request.StartDate,
                MaxCandidates = request.MaxCandidates,
                Deadline = request.Deadline ?? DateTime.Now.AddDays(30),
                Status = "Pending",
                RejectReason = "",
                ApprovedBy = "",
                JDExtractedSkills = "[]"
            };

            _context.JobPostings.Add(newJob);
            await _context.SaveChangesAsync();

            return newJob.JobID;
        }

        public async Task<IEnumerable<object>> GetJobsByRecruiterAsync(string accountId)
        {
            var recruiter = await _context.Recruiters.FirstOrDefaultAsync(r => r.AccountID == accountId);
            if (recruiter == null) return new List<object>();

            return await (from j in _context.JobPostings
                          join p in _context.Positions on j.PositionID equals p.PositionID into pj
                          from p in pj.DefaultIfEmpty()
                          join b in _context.Branches on j.BranchID equals b.BranchID into bj
                          from b in bj.DefaultIfEmpty()
                          where j.RecruiterID == recruiter.RecruiterID
                          orderby j.CreatedAt descending
                          select new {
                              id = j.JobID,
                              description = j.JobDescription,
                              salaryRange = (j.SalaryMin == 0 && j.SalaryMax == 0) ? "Thỏa thuận" : (j.SalaryMax == 0 ? j.SalaryMin + " triệu" : j.SalaryMin + " - " + j.SalaryMax + " triệu"),
                              createdAt = j.CreatedAt,
                              deadline = j.Deadline,
                              startDate = j.StartDate,
                              maxCandidates = j.MaxCandidates,
                              status = j.Status,
                              isApproved = j.Status == "Published",
                              position = p != null ? new { name = p.PositionName } : null,
                              branch = b != null ? new { name = b.BranchName } : null
                          }).ToListAsync();
        }

        public async Task<IEnumerable<object>> GetAdminJobsAsync()
        {
            return await (from j in _context.JobPostings
                          join p in _context.Positions on j.PositionID equals p.PositionID into pj
                          from p in pj.DefaultIfEmpty()
                          join b in _context.Branches on j.BranchID equals b.BranchID into bj
                          from b in bj.DefaultIfEmpty()
                          orderby j.CreatedAt descending
                          select new {
                              id = j.JobID,
                              salaryRange = (j.SalaryMin == 0 && j.SalaryMax == 0) ? "Thỏa thuận" : (j.SalaryMax == 0 ? j.SalaryMin + " triệu" : j.SalaryMin + " - " + j.SalaryMax + " triệu"),
                              createdAt = j.CreatedAt,
                              deadline = j.Deadline,
                              startDate = j.StartDate,
                              maxCandidates = j.MaxCandidates,
                              status = j.Status,
                              position = p != null ? new { name = p.PositionName } : null,
                              branch = b != null ? new { name = b.BranchName } : null
                          }).ToListAsync();
        }

        public async Task<bool> ToggleJobStatusAsync(string jobId)
        {
            var job = await _context.JobPostings.FindAsync(jobId);
            if (job == null || job.Status == "Pending") return false;

            // Nếu đang mở thì khóa, nếu đang khóa thì mở lại
            job.Status = job.Status == "Published" ? "Closed" : "Published";
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<object> ReviewJobAsync(string jobId)
        {
            var query = from j in _context.JobPostings
                        join p in _context.Positions on j.PositionID equals p.PositionID into pj
                        from p in pj.DefaultIfEmpty()
                        join b in _context.Branches on j.BranchID equals b.BranchID into bj
                        from b in bj.DefaultIfEmpty()
                        where j.JobID == jobId
                        select new {
                            id = j.JobID,
                            description = j.JobDescription,
                            requirements = j.JobRequirement,
                            salaryRange = (j.SalaryMin == 0 && j.SalaryMax == 0) ? "Thỏa thuận" : (j.SalaryMax == 0 ? j.SalaryMin + " triệu" : j.SalaryMin + " - " + j.SalaryMax + " triệu"),
                            createdAt = j.CreatedAt,
                            deadline = j.Deadline,
                            startDate = j.StartDate,
                            maxCandidates = j.MaxCandidates,
                            status = j.Status,
                            isApproved = j.Status == "Published",
                            position = p != null ? new { name = p.PositionName } : null,
                            branch = b != null ? new { name = b.BranchName } : null
                        };

            var jobInfo = await query.FirstOrDefaultAsync();
            if (jobInfo == null) return null;

            return new {
                jobInfo = jobInfo,
                wordsToHighlight = new List<string>() // Tạm thời rỗng, chờ AI bóc tách
            };
        }

        public async Task<bool> ApproveJobAndSyncAiAsync(string jobId)
        {
            var job = await _context.JobPostings.FindAsync(jobId);
            if (job == null || job.Status == "Published") return false;

            job.Status = "Published";
            job.ApprovedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<object>> GetAllJobsAsync()
        {
            return await (from j in _context.JobPostings
                          join p in _context.Positions on j.PositionID equals p.PositionID into pj
                          from p in pj.DefaultIfEmpty()
                          join b in _context.Branches on j.BranchID equals b.BranchID into bj
                          from b in bj.DefaultIfEmpty()
                          where j.Status == "Published"
                          orderby j.CreatedAt descending
                          select new {
                              id = j.JobID,
                              description = j.JobDescription,
                              requirements = j.JobRequirement,
                              salaryRange = (j.SalaryMin == 0 && j.SalaryMax == 0) ? "Thỏa thuận" : (j.SalaryMax == 0 ? j.SalaryMin + " triệu" : j.SalaryMin + " - " + j.SalaryMax + " triệu"),
                              createdAt = j.CreatedAt,
                              deadline = j.Deadline,
                              startDate = j.StartDate,
                              maxCandidates = j.MaxCandidates,
                              position = p != null ? new { name = p.PositionName } : null,
                              branch = b != null ? new { name = b.BranchName } : null
                          }).ToListAsync();
        }

        public async Task<IEnumerable<object>> GetPendingJobsAsync()
        {
            return await (from j in _context.JobPostings
                          join p in _context.Positions on j.PositionID equals p.PositionID into pj
                          from p in pj.DefaultIfEmpty()
                          join b in _context.Branches on j.BranchID equals b.BranchID into bj
                          from b in bj.DefaultIfEmpty()
                          where j.Status == "Pending"
                          orderby j.CreatedAt descending
                          select new {
                              id = j.JobID,
                              salaryRange = (j.SalaryMin == 0 && j.SalaryMax == 0) ? "Thỏa thuận" : (j.SalaryMax == 0 ? j.SalaryMin + " triệu" : j.SalaryMin + " - " + j.SalaryMax + " triệu"),
                              createdAt = j.CreatedAt,
                              deadline = j.Deadline,
                              position = p != null ? new { name = p.PositionName } : null,
                              branch = b != null ? new { name = b.BranchName } : null
                          }).ToListAsync();
        }
    }
}