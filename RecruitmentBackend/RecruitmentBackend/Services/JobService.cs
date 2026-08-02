using Microsoft.EntityFrameworkCore;
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
        private readonly INotificationService _notificationService;

        public JobService(
            AppDbContext context, 
            IAiService aiService, 
            ILogger<JobService> logger,
            INotificationService notificationService)
        {
            _context = context;
            _aiService = aiService;
            _logger = logger;
            _notificationService = notificationService;
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

            // Trigger notification to Admins
            try
            {
                var admins = await _context.Accounts.Where(a => a.Role == "Admin").ToListAsync();
                foreach (var admin in admins)
                {
                    await _notificationService.CreateNotificationAsync(
                        admin.AccountID,
                        "Tin tuyển dụng chờ duyệt",
                        $"Tin tuyển dụng {position.PositionName} do HR {recruiter.FullName} đăng tuyển đang chờ phê duyệt.",
                        "/admin/approval"
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError("Lỗi gửi thông báo tuyển dụng cho Admin: " + ex.Message);
            }

            return newJob.JobID;
        }

        public async Task<IEnumerable<object>> GetJobsByRecruiterAsync(string accountId)
        {
            var recruiter = await _context.Recruiters.FirstOrDefaultAsync(r => r.AccountID == accountId);
            if (recruiter == null) return new List<object>();

            var branchIds = await _context.RecruiterBranches
                .Where(rb => rb.RecruiterID == recruiter.RecruiterID)
                .Select(rb => rb.BranchID)
                .ToListAsync();

            return await (from j in _context.JobPostings
                          join p in _context.Positions on j.PositionID equals p.PositionID into pj
                          from p in pj.DefaultIfEmpty()
                          join c in _context.Categories on p.CategoryID equals c.CategoryID into cj
                          from c in cj.DefaultIfEmpty()
                          join b in _context.Branches on j.BranchID equals b.BranchID into bj
                          from b in bj.DefaultIfEmpty()
                          where j.RecruiterID == recruiter.RecruiterID || string.IsNullOrEmpty(j.RecruiterID) || branchIds.Contains(j.BranchID)
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
                              rejectReason = j.RejectReason,
                              isApproved = j.Status == "Published",
                              position = p != null ? new { id = p.PositionID, name = p.PositionName } : null,
                              branch = b != null ? new { id = b.BranchID, name = b.BranchName } : null,
                              category = c != null ? new { id = c.CategoryID, name = c.Name } : null
                          }).ToListAsync();
        }

        public async Task<IEnumerable<object>> GetAdminJobsAsync()
        {
            var defaultRecruiter = await _context.Recruiters.FirstOrDefaultAsync();

            var rawJobs = await (from j in _context.JobPostings
                                 join p in _context.Positions on j.PositionID equals p.PositionID into pj
                                 from p in pj.DefaultIfEmpty()
                                 join b in _context.Branches on j.BranchID equals b.BranchID into bj
                                 from b in bj.DefaultIfEmpty()
                                 join r in _context.Recruiters on j.RecruiterID equals r.RecruiterID into rj
                                 from r in rj.DefaultIfEmpty()
                                 join acc in _context.Accounts on r.AccountID equals acc.AccountID into accj
                                 from acc in accj.DefaultIfEmpty()
                                 join c in _context.Categories on j.CategoryID equals c.CategoryID into cj
                                 from c in cj.DefaultIfEmpty()
                                 orderby j.CreatedAt descending
                                 select new {
                                     id = j.JobID,
                                     salaryRange = (j.SalaryMin == 0 && j.SalaryMax == 0) ? "Thỏa thuận" : (j.SalaryMax == 0 ? j.SalaryMin + " triệu" : j.SalaryMin + " - " + j.SalaryMax + " triệu"),
                                     createdAt = j.CreatedAt,
                                     deadline = j.Deadline,
                                     startDate = j.StartDate,
                                     maxCandidates = j.MaxCandidates,
                                     status = j.Status,
                                     rejectReason = j.RejectReason,
                                     description = j.JobDescription,
                                     requirements = j.JobRequirement,
                                     position = p != null ? new { id = p.PositionID, name = p.PositionName, categoryId = p.CategoryID } : null,
                                     branch = b != null ? new { id = b.BranchID, name = b.BranchName } : null,
                                     category = c != null ? new { id = c.CategoryID, name = c.Name } : null,
                                     recruiter = r != null ? new { id = r.RecruiterID, name = r.FullName, email = acc != null ? acc.Email : "hr@system.com" } : 
                                                 (defaultRecruiter != null ? new { id = defaultRecruiter.RecruiterID, name = defaultRecruiter.FullName, email = "hr@system.com" } : 
                                                 new { id = "HR_SYSTEM", name = "Chuyên viên HR (Hệ thống)", email = "hr@system.com" })
                                 }).ToListAsync();

            return rawJobs;
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

        public async Task<bool> ToggleRecruiterJobStatusAsync(string jobId, string accountId)
        {
            var recruiter = await _context.Recruiters.FirstOrDefaultAsync(r => r.AccountID == accountId);
            if (recruiter == null) return false;

            var job = await _context.JobPostings.FindAsync(jobId);
            if (job == null || job.Status == "Pending") return false;

            var isDirectOwner = job.RecruiterID == recruiter.RecruiterID;
            var isAssignedToBranch = await _context.RecruiterBranches.AnyAsync(rb => 
                rb.RecruiterID == recruiter.RecruiterID && rb.BranchID == job.BranchID);

            if (!isDirectOwner && !isAssignedToBranch) return false;

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
                        join c in _context.Categories on j.CategoryID equals c.CategoryID into cj
                        from c in cj.DefaultIfEmpty()
                        join jl in _context.JobLevels on j.JobLevelID equals jl.JobLevelID into jlj
                        from jl in jlj.DefaultIfEmpty()
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
                            rejectReason = j.RejectReason,
                            isApproved = j.Status == "Published",
                            position = p != null ? new { name = p.PositionName } : null,
                            branch = b != null ? new { name = b.BranchName } : null,
                            category = c != null ? new { name = c.Name } : null,
                            jobLevel = jl != null ? new { name = jl.Name } : null,
                            viewCount = j.ViewCount
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

            var applicationCount = await _context.Applications.CountAsync(a => a.JobID == jobId);
            double applyRate = jobInfo.viewCount > 0 ? Math.Round(((double)applicationCount / jobInfo.viewCount) * 100, 1) : 0;
            int interestedCount = (int)Math.Round(jobInfo.viewCount * 0.12);

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
                    jobInfo.rejectReason,
                    jobInfo.isApproved,
                    jobInfo.position,
                    jobInfo.branch,
                    jobInfo.category,
                    jobInfo.jobLevel,
                    viewCount = jobInfo.viewCount,
                    criteria = criteria
                },
                wordsToHighlight = new List<string>(),
                stats = new
                {
                    applicationsCount = applicationCount,
                    viewsCount = jobInfo.viewCount,
                    interestedCount = interestedCount,
                    applyRate = applyRate
                }
            };
        }

        public async Task<bool> ApproveJobAndSyncAiAsync(string jobId)
        {
            var job = await _context.JobPostings.FindAsync(jobId);
            if (job == null || job.Status == "Published") return false;

            job.Status = "Published";
            job.ApprovedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            // Trigger notification to Recruiter
            try
            {
                var recruiter = await _context.Recruiters.FindAsync(job.RecruiterID);
                if (recruiter != null)
                {
                    string positionName = "Chưa cập nhật";
                    var position = await _context.Positions.FindAsync(job.PositionID);
                    if (position != null) positionName = position.PositionName;

                    await _notificationService.CreateNotificationAsync(
                        recruiter.AccountID,
                        "Tin tuyển dụng đã được duyệt",
                        $"Tin tuyển dụng {positionName} của bạn đã được phê duyệt và hiển thị công khai.",
                        "/recruiter/jobs"
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError("Lỗi gửi thông báo duyệt tin tuyển dụng cho HR: " + ex.Message);
            }

            return true;
        }

        public async Task<bool> RejectJobAsync(string jobId, string reason)
        {
            var job = await _context.JobPostings.FindAsync(jobId);
            if (job == null || job.Status != "Pending") return false;

            job.Status = "Rejected";
            job.RejectReason = reason ?? "";
            await _context.SaveChangesAsync();

            // Trigger notification to Recruiter kèm lý do cụ thể
            try
            {
                var recruiter = await _context.Recruiters.FindAsync(job.RecruiterID);
                if (recruiter != null)
                {
                    string positionName = "Chưa cập nhật";
                    var position = await _context.Positions.FindAsync(job.PositionID);
                    if (position != null) positionName = position.PositionName;

                    await _notificationService.CreateNotificationAsync(
                        recruiter.AccountID,
                        "Tin tuyển dụng bị từ chối",
                        $"Tin tuyển dụng {positionName} của bạn đã bị từ chối. Lý do: {job.RejectReason}",
                        "/recruiter/jobs"
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError("Lỗi gửi thông báo từ chối tin tuyển dụng cho HR: " + ex.Message);
            }

            return true;
        }

        public async Task<bool> FlagJobAsync(string jobId, string reason)
        {
            var job = await _context.JobPostings.FindAsync(jobId);
            if (job == null) return false;

            job.Status = "Flagged";
            job.RejectReason = reason ?? "Cần kiểm duyệt nội dung";
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UnflagJobAsync(string jobId)
        {
            var job = await _context.JobPostings.FindAsync(jobId);
            if (job == null || job.Status != "Flagged") return false;

            job.Status = "Published";
            job.RejectReason = "";
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(int successCount, int failCount)> BulkApproveJobsAsync(List<string> jobIds)
        {
            int successCount = 0;
            int failCount = 0;

            foreach (var jobId in jobIds)
            {
                try
                {
                    var ok = await ApproveJobAndSyncAiAsync(jobId);
                    if (ok) successCount++;
                    else failCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Lỗi khi duyệt hàng loạt tin {jobId}: " + ex.Message);
                    failCount++;
                }
            }

            return (successCount, failCount);
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
                              position = p != null ? new { id = p.PositionID, name = p.PositionName } : null,
                              branch = b != null ? new { id = b.BranchID, name = b.BranchName } : null
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
                              position = p != null ? new { id = p.PositionID, name = p.PositionName } : null,
                              branch = b != null ? new { id = b.BranchID, name = b.BranchName } : null
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
                var rawKw = request.Keyword.ToLower().Trim();
                var kw = rawKw.Replace("địa điểm", "").Replace("tại", "").Replace("ở", "").Trim();
                if (string.IsNullOrWhiteSpace(kw)) kw = rawKw;

                query = query.Where(x => 
                    (x.p != null && x.p.PositionName.ToLower().Contains(kw)) ||
                    (x.b != null && x.b.BranchName.ToLower().Contains(kw)) ||
                    (x.j.JobDescription != null && x.j.JobDescription.ToLower().Contains(kw)) ||
                    (x.j.JobRequirement != null && x.j.JobRequirement.ToLower().Contains(kw)) ||
                    (x.j.JDExtractedSkills != null && x.j.JDExtractedSkills.ToLower().Contains(kw)) ||
                    (x.p != null && x.p.PositionName.ToLower().Contains(rawKw)));
            }

            if (!string.IsNullOrWhiteSpace(request.Location))
            {
                var loc = request.Location.ToLower().Trim();
                if (loc == "hcm" || loc == "tphcm" || loc == "tp.hcm" || loc == "hồ chí minh")
                {
                    query = query.Where(x => x.b != null && (x.b.BranchName.ToLower().Contains("hồ chí minh") || x.b.BranchName.ToLower().Contains("hcm")));
                }
                else if (loc == "hn" || loc == "hà nội")
                {
                    query = query.Where(x => x.b != null && (x.b.BranchName.ToLower().Contains("hà nội") || x.b.BranchName.ToLower().Contains("hn")));
                }
                else if (loc == "dn" || loc == "đà nẵng")
                {
                    query = query.Where(x => x.b != null && (x.b.BranchName.ToLower().Contains("đà nẵng") || x.b.BranchName.ToLower().Contains("dn")));
                }
                else
                {
                    query = query.Where(x => x.b != null && x.b.BranchName.ToLower().Contains(loc));
                }
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
                // Fallback: Lấy Top 6 tin tuyển dụng có GIÁ TRỊ LỢI ÍCH cao nhất (High-Utility: Lương * Lượt xem)
                var fallbackQuery = from j in _context.JobPostings
                                    join p in _context.Positions on j.PositionID equals p.PositionID into pj
                                    from p in pj.DefaultIfEmpty()
                                    join b in _context.Branches on j.BranchID equals b.BranchID into bj
                                    from b in bj.DefaultIfEmpty()
                                    where j.Status == "Published"
                                    orderby (j.SalaryMax > 0 ? (double)j.SalaryMax : 15.0) * j.ViewCount descending, j.CreatedAt descending
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
                        AiScore = 0,
                        RecommendationType = "HighUtility",
                        UtilityScore = (double)(x.j.SalaryMax > 0 ? x.j.SalaryMax : 15.0m) * x.j.ViewCount
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

            // Load all matched jobs into memory to apply semantic search if keyword exists
            var allRawJobs = await query
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
                    Description = x.j.JobDescription ?? "",
                    Skills = new List<string> { "Đang tuyển dụng" },
                    AiScore = 0,
                    RecommendationType = "Normal",
                    UtilityScore = 0
                })
                .ToListAsync();

            List<JobSummaryDto> processedJobs = allRawJobs;
            bool isFallbackUsed = false;

            if (!string.IsNullOrWhiteSpace(request.Keyword))
            {
                var searchItems = allRawJobs.Select(job => new DTOs.Requests.SemanticSearchJobItemDto
                {
                    Id = job.Id,
                    Text = $"Tiêu đề: {job.Title}. Địa điểm: {job.Location}. Mô tả: {job.Description}."
                }).ToList();

                var searchResults = await _aiService.SearchSemanticAsync(request.Keyword, searchItems);

                if (searchResults != null && searchResults.Count > 0)
                {
                    var scoreMap = new Dictionary<string, double>();
                    foreach (var res in searchResults)
                    {
                        scoreMap[res.Id] = res.Score;
                    }

                    // Assign scores and filter by minimum similarity threshold of 0.40
                    foreach (var job in processedJobs)
                    {
                        if (scoreMap.TryGetValue(job.Id, out double score))
                        {
                            job.AiScore = (int)Math.Round(score * 100);
                        }
                    }

                    processedJobs = processedJobs
                        .Where(job => job.AiScore >= 40)
                        .OrderByDescending(job => job.AiScore)
                        .ThenByDescending(job => job.UpdatedAt)
                        .ToList();

                    if (processedJobs.Count == 0)
                    {
                        // If no job meets the 40% similarity threshold, fallback to High-Utility jobs
                        isFallbackUsed = true;
                        var fallbackQuery = from j in _context.JobPostings
                                            join p in _context.Positions on j.PositionID equals p.PositionID into pj
                                            from p in pj.DefaultIfEmpty()
                                            join b in _context.Branches on j.BranchID equals b.BranchID into bj
                                            from b in bj.DefaultIfEmpty()
                                            where j.Status == "Published"
                                            orderby (j.SalaryMax > 0 ? (double)j.SalaryMax : 15.0) * j.ViewCount descending, j.CreatedAt descending
                                            select new { j, p, b };

                        processedJobs = await fallbackQuery
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
                                AiScore = 0,
                                RecommendationType = "HighUtility",
                                UtilityScore = (double)(x.j.SalaryMax > 0 ? x.j.SalaryMax : 15.0m) * x.j.ViewCount
                            })
                            .ToListAsync();
                    }
                }
            }
            else
            {
                // No keyword, sort by update date descending
                processedJobs = processedJobs.OrderByDescending(j => j.UpdatedAt).ToList();
            }

            // Refactor descriptions to fit search list display preview
            foreach (var job in processedJobs)
            {
                if (job.Description.Length > 200)
                {
                    job.Description = job.Description.Substring(0, 200) + "...";
                }
            }

            var paginatedJobs = processedJobs
                .Skip((request.PageIndex - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToList();

            return new PagedResult<JobSummaryDto>
            {
                Items = paginatedJobs,
                TotalCount = isFallbackUsed ? processedJobs.Count : (string.IsNullOrWhiteSpace(request.Keyword) ? totalCount : processedJobs.Count),
                PageIndex = request.PageIndex,
                PageSize = request.PageSize,
                IsFallback = isFallbackUsed
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

        public async Task<bool> SaveJobAsync(string jobId, string accountId)
        {
            var candidate = await _context.Candidates.FirstOrDefaultAsync(c => c.AccountID == accountId);
            if (candidate == null) return false;

            var exists = await _context.SavedJobs.AnyAsync(sj => sj.CandidateID == candidate.CandidateID && sj.JobID == jobId);
            if (exists) return true; // Already saved

            var savedJob = new SavedJob
            {
                CandidateID = candidate.CandidateID,
                JobID = jobId,
                SavedAt = DateTime.Now
            };

            _context.SavedJobs.Add(savedJob);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UnsaveJobAsync(string jobId, string accountId)
        {
            var candidate = await _context.Candidates.FirstOrDefaultAsync(c => c.AccountID == accountId);
            if (candidate == null) return false;

            var savedJob = await _context.SavedJobs.FirstOrDefaultAsync(sj => sj.CandidateID == candidate.CandidateID && sj.JobID == jobId);
            if (savedJob == null) return true; // Already unsaved

            _context.SavedJobs.Remove(savedJob);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<object>> GetSavedJobsAsync(string accountId)
        {
            var candidate = await _context.Candidates.FirstOrDefaultAsync(c => c.AccountID == accountId);
            if (candidate == null) return new List<object>();

            var jobs = await (from sj in _context.SavedJobs
                              join j in _context.JobPostings on sj.JobID equals j.JobID
                              join p in _context.Positions on j.PositionID equals p.PositionID into pj
                              from p in pj.DefaultIfEmpty()
                              join b in _context.Branches on j.BranchID equals b.BranchID into bj
                              from b in bj.DefaultIfEmpty()
                              where sj.CandidateID == candidate.CandidateID && j.Status == "Published"
                              orderby sj.SavedAt descending
                              select new
                              {
                                  id = j.JobID,
                                  description = j.JobDescription,
                                  salaryRange = (j.SalaryMin == 0 && j.SalaryMax == 0) ? "Thỏa thuận" : (j.SalaryMax == 0 ? j.SalaryMin + " triệu" : j.SalaryMin + " - " + j.SalaryMax + " triệu"),
                                  createdAt = j.CreatedAt,
                                  deadline = j.Deadline,
                                  startDate = j.StartDate,
                                  maxCandidates = j.MaxCandidates,
                                  position = p != null ? new { id = p.PositionID, name = p.PositionName } : null,
                                  branch = b != null ? new { id = b.BranchID, name = b.BranchName } : null,
                                  savedAt = sj.SavedAt
                              }).ToListAsync();

            return jobs;
        }
    }
}
