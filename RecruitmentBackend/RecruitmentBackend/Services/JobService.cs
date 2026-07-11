﻿﻿﻿using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.DTOs.Responses;
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

            // Kiểm tra danh sách tiêu chí
            if (request.Criteria == null || !request.Criteria.Any())
            {
                throw new Exception("Vui lòng thêm ít nhất 1 tiêu chí đánh giá CV.");
            }

            var totalWeight = request.Criteria.Sum(c => c.Weight);
            if (totalWeight != 100)
            {
                throw new Exception($"Tổng trọng số tiêu chí phải bằng 100%. Hiện tại đang là {totalWeight}%.");
            }

            if (request.Criteria.Any(c => string.IsNullOrWhiteSpace(c.Name)))
            {
                throw new Exception("Tên tiêu chí đánh giá không được để trống.");
            }

            _context.JobPostings.Add(newJob);

            var criteriaEntities = request.Criteria.Select(c => new JobCriterion
            {
                CriterionID = Guid.NewGuid().ToString(),
                JobID = newJob.JobID,
                Name = c.Name.Trim(),
                Weight = c.Weight
            }).ToList();

            _context.JobCriteria.AddRange(criteriaEntities);
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
                          join c in _context.Categories on p.CategoryID equals c.CategoryID into cj
                          from c in cj.DefaultIfEmpty()
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
                              branch = b != null ? new { name = b.BranchName } : null,
                              category = c != null ? new { name = c.Name } : null
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

            var criteria = await _context.JobCriteria
                .Where(c => c.JobID == jobId)
                .OrderByDescending(c => c.Weight)
                .Select(c => new
                {
                    id = c.CriterionID,
                    name = c.Name,
                    weight = c.Weight
                })
                .ToListAsync();

            return new
            {
                jobInfo = new
                {
                    jobInfo.id,
                    jobInfo.description,
                    jobInfo.requirements,
                    jobInfo.salaryRange,
                    jobInfo.createdAt,
                    jobInfo.deadline,
                    jobInfo.startDate,
                    jobInfo.maxCandidates,
                    jobInfo.status,
                    jobInfo.isApproved,
                    jobInfo.position,
                    jobInfo.branch,
                    criteria = criteria
                },
                wordsToHighlight = new List<string>()
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

        public async Task<PagedResult<JobSummaryDto>> GetPublishedJobsAsync(JobFilterRequest request)
        {
            // 1. Sử dụng LINQ Join thay vì .Include()
            var query = from j in _context.JobPostings
                        join p in _context.Positions on j.PositionID equals p.PositionID into pj
                        from p in pj.DefaultIfEmpty()
                        join b in _context.Branches on j.BranchID equals b.BranchID into bj
                        from b in bj.DefaultIfEmpty()
                        where j.Status == "Published"
                        select new { j, p, b };

            // 2. Áp dụng các Bộ Lọc (Filter)
            if (!string.IsNullOrWhiteSpace(request.Keyword))
            {
                var kw = request.Keyword.ToLower();
                query = query.Where(x => 
                    (x.p != null && x.p.PositionName.ToLower().Contains(kw)) ||
                    (x.b != null && x.b.BranchName.ToLower().Contains(kw)));
            }

            if (!string.IsNullOrWhiteSpace(request.Location))
            {
                var loc = request.Location.ToLower();
                query = query.Where(x => x.b != null && x.b.BranchName.ToLower().Contains(loc));
            }

            // Lọc theo Lĩnh vực công việc
            if (!string.IsNullOrWhiteSpace(request.CategoryId))
            {
                query = query.Where(x => x.p != null && x.p.CategoryID == request.CategoryId);
            }

            // Lọc theo Cấp bậc
            if (!string.IsNullOrWhiteSpace(request.JobLevelId))
            {
                query = query.Where(x => x.j.JobLevelID == request.JobLevelId);
            }

            // Lọc theo Mức lương
            if (request.SalaryMin.HasValue)
            {
                query = query.Where(x => x.j.SalaryMax >= request.SalaryMin.Value || (x.j.SalaryMin == 0 && x.j.SalaryMax == 0));
            }
            if (request.SalaryMax.HasValue)
            {
                query = query.Where(x => x.j.SalaryMin <= request.SalaryMax.Value || (x.j.SalaryMin == 0 && x.j.SalaryMax == 0));
            }

            var totalCount = await query.CountAsync();

            if (totalCount == 0)
            {
                // Fallback: Lấy Top 6 tin tuyển dụng nổi bật nhất (ViewCount cao nhất)
                var fallbackQuery = from j in _context.JobPostings
                                    join p in _context.Positions on j.PositionID equals p.PositionID into pj
                                    from p in pj.DefaultIfEmpty()
                                    join b in _context.Branches on j.BranchID equals b.BranchID into bj
                                    from b in bj.DefaultIfEmpty()
                                    where j.Status == "Published"
                                    orderby j.ViewCount descending, j.CreatedAt descending
                                    select new { j, p, b };

                var fallbackJobs = await fallbackQuery
                    .Take(6)
                    .Select(x => new JobSummaryDto
                    {
                        Id = x.j.JobID,
                        Title = x.p != null ? x.p.PositionName : "Vị trí chưa cập nhật",
                        Company = "Công Ty AI Recruitment", 
                        Salary = (x.j.SalaryMin == 0 && x.j.SalaryMax == 0) ? "Thỏa thuận" : $"{x.j.SalaryMin:N0} - {x.j.SalaryMax:N0} triệu",
                        Location = x.b != null ? x.b.BranchName : "Chưa cập nhật",
                        Type = "Toàn thời gian", 
                        UpdatedAt = x.j.ApprovedAt ?? x.j.CreatedAt,
                        Logo = "https://cdn-icons-png.flaticon.com/512/3061/3061341.png",
                        Description = x.j.JobDescription != null && x.j.JobDescription.Length > 200 
                                        ? x.j.JobDescription.Substring(0, 200) + "..." 
                                        : x.j.JobDescription ?? "",
                        Skills = new List<string> { "Đang tuyển dụng" },
                        AiScore = 0
                    })
                    .ToListAsync();

                return new PagedResult<JobSummaryDto>
                {
                    Items = fallbackJobs,
                    TotalCount = fallbackJobs.Count,
                    PageIndex = 1,
                    PageSize = request.PageSize,
                    IsFallback = true
                };
            }

            // 4. Phân trang & Chuyển đổi dữ liệu
            var jobs = await query
                .OrderByDescending(x => x.j.CreatedAt)
                .Skip((request.PageIndex - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(x => new JobSummaryDto
                {
                    Id = x.j.JobID,
                    Title = x.p != null ? x.p.PositionName : "Vị trí chưa cập nhật",
                    Company = "Công Ty AI Recruitment", 
                    Salary = (x.j.SalaryMin == 0 && x.j.SalaryMax == 0) ? "Thỏa thuận" : $"{x.j.SalaryMin:N0} - {x.j.SalaryMax:N0} triệu",
                    Location = x.b != null ? x.b.BranchName : "Chưa cập nhật",
                    Type = "Toàn thời gian", 
                    UpdatedAt = x.j.ApprovedAt ?? x.j.CreatedAt,
                    Logo = "https://cdn-icons-png.flaticon.com/512/3061/3061341.png", // Logo mặc định
                    Description = x.j.JobDescription != null && x.j.JobDescription.Length > 200 
                                    ? x.j.JobDescription.Substring(0, 200) + "..." 
                                    : x.j.JobDescription ?? "",
                    Skills = new List<string> { "Đang tuyển dụng" },
                    AiScore = 0 // Tương lai có thể tích hợp chấm điểm tự động tại đây
                })
                .ToListAsync();

            return new PagedResult<JobSummaryDto>
            {
                Items = jobs,
                TotalCount = totalCount,
                PageIndex = request.PageIndex,
                PageSize = request.PageSize,
                IsFallback = false
            };
        }

        public async Task<object?> GetPublishedJobByIdAsync(string jobId)
        {
            var job = await _context.JobPostings.FindAsync(jobId);
            if (job != null && job.Status == "Published")
            {
                job.ViewCount += 1;
                await _context.SaveChangesAsync();
            }

            var query = from j in _context.JobPostings
                        join p in _context.Positions on j.PositionID equals p.PositionID into pj
                        from p in pj.DefaultIfEmpty()
                        join b in _context.Branches on j.BranchID equals b.BranchID into bj
                        from b in bj.DefaultIfEmpty()
                        where j.JobID == jobId && j.Status == "Published"
                        select new {
                            id = j.JobID,
                            title = p != null ? p.PositionName : "Vị trí chưa cập nhật",
                            company = "Công Ty AI Recruitment", 
                            salary = (j.SalaryMin == 0 && j.SalaryMax == 0) ? "Thỏa thuận" : $"{j.SalaryMin:N0} - {j.SalaryMax:N0} triệu",
                            location = b != null ? b.BranchName : "Chưa cập nhật",
                            type = "Toàn thời gian", 
                            updatedAt = j.ApprovedAt ?? j.CreatedAt,
                            deadline = j.Deadline,
                            maxCandidates = j.MaxCandidates,
                            description = j.JobDescription,
                            requirements = j.JobRequirement,
                            logo = "https://cdn-icons-png.flaticon.com/512/3061/3061341.png",
                            viewCount = j.ViewCount
                        };

            return await query.FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<object>> GetTrendingCategoriesAsync(int limit = 8)
        {
            // Gom nhóm các công việc đã duyệt theo Lĩnh vực (Category) và đếm số lượng
            var query = await (from j in _context.JobPostings
                               join p in _context.Positions on j.PositionID equals p.PositionID
                               join c in _context.Categories on p.CategoryID equals c.CategoryID
                               where j.Status == "Published"
                               group j by new { c.CategoryID, c.Name } into g
                               orderby g.Count() descending
                               select new {
                                   id = g.Key.CategoryID,
                                   name = g.Key.Name,
                                   count = g.Count()
                               }).Take(limit).ToListAsync();
            return query;
        }

        public async Task<IEnumerable<JobSummaryDto>> GetTrendingJobsAsync(int limit = 6)
        {
            var query = from j in _context.JobPostings
                        join p in _context.Positions on j.PositionID equals p.PositionID into pj
                        from p in pj.DefaultIfEmpty()
                        join b in _context.Branches on j.BranchID equals b.BranchID into bj
                        from b in bj.DefaultIfEmpty()
                        where j.Status == "Published"
                        orderby j.ViewCount descending, j.CreatedAt descending
                        select new { j, p, b };

            return await query
                .Take(limit)
                .Select(x => new JobSummaryDto
                {
                    Id = x.j.JobID,
                    Title = x.p != null ? x.p.PositionName : "Vị trí chưa cập nhật",
                    Company = "Công Ty AI Recruitment", 
                    Salary = (x.j.SalaryMin == 0 && x.j.SalaryMax == 0) ? "Thỏa thuận" : $"{x.j.SalaryMin:N0} - {x.j.SalaryMax:N0} triệu",
                    Location = x.b != null ? x.b.BranchName : "Chưa cập nhật",
                    Type = "Toàn thời gian", 
                    UpdatedAt = x.j.ApprovedAt ?? x.j.CreatedAt,
                    Logo = "https://cdn-icons-png.flaticon.com/512/3061/3061341.png",
                    Description = x.j.JobDescription != null && x.j.JobDescription.Length > 200 
                                    ? x.j.JobDescription.Substring(0, 200) + "..." 
                                    : x.j.JobDescription ?? "",
                    Skills = new List<string> { "Đang tuyển dụng" },
                    AiScore = 0
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<JobSummaryDto>> GetRelatedJobsAsync(string jobId, int limit = 3)
        {
            var targetJob = await _context.JobPostings.FindAsync(jobId);
            string? categoryId = targetJob?.CategoryID;

            var query = from j in _context.JobPostings
                        join p in _context.Positions on j.PositionID equals p.PositionID into pj
                        from p in pj.DefaultIfEmpty()
                        join b in _context.Branches on j.BranchID equals b.BranchID into bj
                        from b in bj.DefaultIfEmpty()
                        where j.Status == "Published" && j.JobID != jobId
                        select new { j, p, b };

            if (!string.IsNullOrEmpty(categoryId))
            {
                query = query.OrderByDescending(x => x.j.CategoryID == categoryId)
                             .ThenByDescending(x => x.j.ViewCount);
            }
            else
            {
                query = query.OrderByDescending(x => x.j.ViewCount);
            }

            return await query
                .Take(limit)
                .Select(x => new JobSummaryDto
                {
                    Id = x.j.JobID,
                    Title = x.p != null ? x.p.PositionName : "Vị trí chưa cập nhật",
                    Company = "Công Ty AI Recruitment", 
                    Salary = (x.j.SalaryMin == 0 && x.j.SalaryMax == 0) ? "Thỏa thuận" : $"{x.j.SalaryMin:N0} - {x.j.SalaryMax:N0} triệu",
                    Location = x.b != null ? x.b.BranchName : "Chưa cập nhật",
                    Type = "Toàn thời gian", 
                    UpdatedAt = x.j.ApprovedAt ?? x.j.CreatedAt,
                    Logo = "https://cdn-icons-png.flaticon.com/512/3061/3061341.png",
                    Description = x.j.JobDescription != null && x.j.JobDescription.Length > 200 
                                    ? x.j.JobDescription.Substring(0, 200) + "..." 
                                    : x.j.JobDescription ?? "",
                    Skills = new List<string> { "Đang tuyển dụng" },
                    AiScore = 0
                })
                .ToListAsync();
        }
    }
}