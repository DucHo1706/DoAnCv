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

            var recruitmentDates = NormalizeRecruitmentDates(request.StartDate, request.Deadline);
            
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
                CategoryID = request.CategoryId,
                JobLevelID = request.JobLevelId,
                RecruiterID = recruiter.RecruiterID,
                JobDescription = request.Description,
                JobRequirement = request.Requirements,
                SalaryMin = minSal, 
                SalaryMax = maxSal,
                StartDate = recruitmentDates.StartDate,
                MaxCandidates = request.MaxCandidates,
                Deadline = recruitmentDates.Deadline,
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

            ValidateStructuredCriteria(request.Criteria);

            _context.JobPostings.Add(newJob);

            var criteriaEntities = request.Criteria
                .Select((criterion, index) => CreateCriterionEntity(criterion, newJob.JobID, index))
                .ToList();

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

        public async Task<(bool Success, string Message, string? JobId, int? RecruitmentRound)> RepostJobAsync(
            string sourceJobId,
            RepostJobRequest request,
            string accountId)
        {
            if (request == null)
            {
                return (false, "Dữ liệu đăng lại tin tuyển dụng không hợp lệ.", null, null);
            }

            var recruiter = await _context.Recruiters.FirstOrDefaultAsync(item => item.AccountID == accountId);
            if (recruiter == null)
            {
                return (false, "Không tìm thấy thông tin HR.", null, null);
            }

            var sourceJob = await _context.JobPostings
                .Include(job => job.Criteria)
                .FirstOrDefaultAsync(job => job.JobID == sourceJobId);
            if (sourceJob == null)
            {
                return (false, "Không tìm thấy tin tuyển dụng cần đăng lại.", null, null);
            }

            bool isAssignedToBranch = await _context.RecruiterBranches.AnyAsync(item =>
                item.RecruiterID == recruiter.RecruiterID && item.BranchID == sourceJob.BranchID);
            if (sourceJob.RecruiterID != recruiter.RecruiterID && !isAssignedToBranch)
            {
                return (false, "Bạn không có quyền đăng lại tin tuyển dụng này.", null, null);
            }

            if (!JobLifecyclePolicy.IsExpired(sourceJob))
            {
                return (false, "Chỉ có thể đăng lại tin đã hết hạn. Tin đang tuyển có thể được quản lý bằng chức năng tạm ẩn.", null, null);
            }

            if (request.Criteria == null || request.Criteria.Count == 0 || request.Criteria.Sum(item => item.Weight) != 100)
            {
                return (false, "Tin đăng lại phải có ít nhất một tiêu chí và tổng trọng số phải bằng 100%.", null, null);
            }

            try
            {
                ValidateStructuredCriteria(request.Criteria);
            }
            catch (Exception exception)
            {
                return (false, exception.Message, null, null);
            }

            bool positionExists = await _context.Positions.AnyAsync(item => item.PositionID == request.PositionId);
            bool branchExists = await _context.Branches.AnyAsync(item => item.BranchID == request.BranchId);
            if (!positionExists || !branchExists)
            {
                return (false, "Vị trí hoặc chi nhánh của đợt tuyển dụng mới không hợp lệ.", null, null);
            }

            (DateTime? startDate, DateTime deadline) recruitmentDates;
            try
            {
                recruitmentDates = NormalizeRecruitmentDates(request.StartDate, request.Deadline);
            }
            catch (Exception exception)
            {
                return (false, exception.Message, null, null);
            }

            string campaignGroupId = string.IsNullOrWhiteSpace(sourceJob.CampaignGroupID)
                ? sourceJob.JobID
                : sourceJob.CampaignGroupID;
            int maxExistingRound = await _context.JobPostings
                .Where(job => job.CampaignGroupID == campaignGroupId)
                .Select(job => (int?)job.RecruitmentRound)
                .MaxAsync() ?? 1;
            int newRound = Math.Max(sourceJob.RecruitmentRound, maxExistingRound) + 1;

            decimal minSalary = 0;
            decimal maxSalary = 0;
            string salaryText = (request.SalaryRange ?? string.Empty).Replace(",", string.Empty).Replace(".", string.Empty);
            var salaryMatches = System.Text.RegularExpressions.Regex.Matches(salaryText, @"\d+");
            if (salaryMatches.Count >= 2)
            {
                decimal.TryParse(salaryMatches[0].Value, out minSalary);
                decimal.TryParse(salaryMatches[1].Value, out maxSalary);
                if (minSalary > maxSalary) (minSalary, maxSalary) = (maxSalary, minSalary);
            }
            else if (salaryMatches.Count == 1)
            {
                decimal.TryParse(salaryMatches[0].Value, out minSalary);
            }
            if (minSalary >= 1000) minSalary /= 1000000;
            if (maxSalary >= 1000) maxSalary /= 1000000;

            var repostedJob = new JobPosting
            {
                JobID = Guid.NewGuid().ToString(),
                RecruiterID = recruiter.RecruiterID,
                PositionID = request.PositionId,
                BranchID = request.BranchId,
                CategoryID = request.CategoryId,
                JobLevelID = request.JobLevelId,
                StartDate = recruitmentDates.startDate,
                Deadline = recruitmentDates.deadline,
                MaxCandidates = request.MaxCandidates,
                SalaryMin = minSalary,
                SalaryMax = maxSalary,
                JobDescription = request.Description.Trim(),
                JobRequirement = request.Requirements.Trim(),
                JDExtractedSkills = "[]",
                Status = "Pending",
                RejectReason = string.Empty,
                ApprovedBy = string.Empty,
                ApprovedAt = null,
                CreatedAt = VietnamTimeService.NowLocal,
                ViewCount = 0,
                RepostedFromJobID = sourceJob.JobID,
                CampaignGroupID = campaignGroupId,
                RecruitmentRound = newRound
            };

            _context.JobPostings.Add(repostedJob);
            _context.JobCriteria.AddRange(request.Criteria.Select((criterion, index) =>
                CreateCriterionEntity(criterion, repostedJob.JobID, index)));

            await _context.SaveChangesAsync();

            try
            {
                string positionName = await _context.Positions
                    .Where(position => position.PositionID == repostedJob.PositionID)
                    .Select(position => position.PositionName)
                    .FirstOrDefaultAsync() ?? "Chưa cập nhật vị trí";
                var adminIds = await _context.Accounts
                    .Where(account => account.Role == "Admin")
                    .Select(account => account.AccountID)
                    .ToListAsync();
                foreach (string adminId in adminIds)
                {
                    await _notificationService.CreateNotificationAsync(
                        adminId,
                        "Tin đăng lại chờ duyệt",
                        $"Đợt {newRound} của tin {positionName} đang chờ phê duyệt.",
                        "/admin/approval");
                }
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Không gửi được thông báo Admin cho tin đăng lại {JobId}.", repostedJob.JobID);
            }

            return (
                true,
                $"Đã tạo đợt tuyển dụng {newRound} và gửi quản trị viên duyệt. Hồ sơ của đợt cũ được giữ riêng.",
                repostedJob.JobID,
                newRound);
        }

        public async Task<(bool Success, string Message)> UpdateRecruiterJobAsync(string jobId, CreateJobRequest request, string accountId)
        {
            var recruiter = await _context.Recruiters.FirstOrDefaultAsync(r => r.AccountID == accountId);
            if (recruiter == null) return (false, "Không tìm thấy thông tin HR.");

            var job = await _context.JobPostings.Include(j => j.Criteria).FirstOrDefaultAsync(j => j.JobID == jobId);
            if (job == null) return (false, "Không tìm thấy tin tuyển dụng.");

            var isAssignedToBranch = await _context.RecruiterBranches.AnyAsync(rb =>
                rb.RecruiterID == recruiter.RecruiterID && rb.BranchID == job.BranchID);
            if (job.RecruiterID != recruiter.RecruiterID && !isAssignedToBranch)
                return (false, "Bạn không có quyền chỉnh sửa tin tuyển dụng này.");

            if (job.Status == "Archived" || job.Status == "Flagged")
                return (false, "Tin đang được lưu trữ hoặc kiểm duyệt nên chưa thể chỉnh sửa.");

            if (JobLifecyclePolicy.IsExpired(job))
                return (false, "Tin đã hết hạn và được giữ làm lịch sử. Vui lòng dùng chức năng Đăng lại để tạo đợt tuyển dụng mới.");

            if (request.Criteria == null || request.Criteria.Count == 0 || request.Criteria.Sum(c => c.Weight) != 100)
                return (false, "Tin phải có ít nhất một tiêu chí và tổng trọng số phải bằng 100%.");

            try
            {
                ValidateStructuredCriteria(request.Criteria);
            }
            catch (Exception exception)
            {
                return (false, exception.Message);
            }

            var positionExists = await _context.Positions.AnyAsync(p => p.PositionID == request.PositionId);
            var branchExists = await _context.Branches.AnyAsync(b => b.BranchID == request.BranchId);
            if (!positionExists || !branchExists) return (false, "Vị trí hoặc chi nhánh không hợp lệ.");

            var applicationCount = await _context.Applications.CountAsync(a => a.JobID == jobId);
            var changesScoringContext = job.PositionID != request.PositionId
                || job.CategoryID != request.CategoryId
                || job.JobLevelID != request.JobLevelId
                || job.JobDescription != request.Description
                || job.JobRequirement != request.Requirements
                || job.Criteria.Count != request.Criteria.Count
                || job.Criteria.OrderBy(c => c.DisplayOrder).Select(BuildCriterionSignature)
                    .SequenceEqual(request.Criteria.Select(BuildCriterionSignature)) == false;

            if (applicationCount > 0 && changesScoringContext)
                return (false, "Tin đã có ứng viên. Không thể thay đổi vị trí, mô tả, yêu cầu hoặc tiêu chí vì sẽ làm sai lệch kết quả AI hiện có.");

            decimal minSal = 0, maxSal = 0;
            var cleanText = (request.SalaryRange ?? "").Replace(",", "").Replace(".", "");
            var matches = System.Text.RegularExpressions.Regex.Matches(cleanText, @"\d+");
            if (matches.Count >= 2)
            {
                decimal.TryParse(matches[0].Value, out minSal);
                decimal.TryParse(matches[1].Value, out maxSal);
                if (minSal > maxSal) (minSal, maxSal) = (maxSal, minSal);
            }
            else if (matches.Count == 1) decimal.TryParse(matches[0].Value, out minSal);
            if (minSal >= 1000) minSal /= 1000000;
            if (maxSal >= 1000) maxSal /= 1000000;

            job.PositionID = request.PositionId;
            job.BranchID = request.BranchId;
            job.CategoryID = request.CategoryId;
            job.JobLevelID = request.JobLevelId;
            job.JobDescription = request.Description.Trim();
            job.JobRequirement = request.Requirements.Trim();
            job.SalaryMin = minSal;
            job.SalaryMax = maxSal;
            (DateTime? StartDate, DateTime Deadline) recruitmentDates;
            try
            {
                recruitmentDates = NormalizeRecruitmentDates(request.StartDate, request.Deadline ?? job.Deadline);
            }
            catch (Exception exception)
            {
                return (false, exception.Message);
            }

            job.StartDate = recruitmentDates.StartDate;
            job.Deadline = recruitmentDates.Deadline;
            job.MaxCandidates = request.MaxCandidates;
            job.RejectReason = "";

            if (applicationCount == 0)
            {
                _context.JobCriteria.RemoveRange(job.Criteria);
                _context.JobCriteria.AddRange(request.Criteria.Select((criterion, index) =>
                    CreateCriterionEntity(criterion, job.JobID, index)));
            }

            // Mọi thay đổi trước khi có ứng viên đều phải được Admin duyệt lại.
            if (applicationCount == 0) job.Status = "Pending";
            await _context.SaveChangesAsync();
            return (true, applicationCount == 0
                ? "Đã cập nhật và gửi lại tin để Admin duyệt."
                : "Đã cập nhật các thông tin vận hành của tin tuyển dụng.");
        }

        public async Task<(bool Success, string Message)> ArchiveJobAsync(string jobId, string accountId, bool isAdmin)
        {
            var job = await _context.JobPostings.FindAsync(jobId);
            if (job == null) return (false, "Không tìm thấy tin tuyển dụng.");
            if (!isAdmin)
            {
                var recruiter = await _context.Recruiters.FirstOrDefaultAsync(r => r.AccountID == accountId);
                if (recruiter == null) return (false, "Không tìm thấy thông tin HR.");
                var assigned = await _context.RecruiterBranches.AnyAsync(rb => rb.RecruiterID == recruiter.RecruiterID && rb.BranchID == job.BranchID);
                if (job.RecruiterID != recruiter.RecruiterID && !assigned) return (false, "Bạn không có quyền lưu trữ tin này.");
            }
            if (job.Status == "Archived") return (false, "Tin đã được lưu trữ trước đó.");
            job.Status = "Archived";
            await _context.SaveChangesAsync();
            return (true, "Đã lưu trữ tin tuyển dụng. Dữ liệu ứng viên và kết quả AI vẫn được giữ nguyên.");
        }

        public async Task<(bool Success, string Message)> RestoreArchivedJobAsync(string jobId, string accountId, bool isAdmin)
        {
            var job = await _context.JobPostings.FindAsync(jobId);
            if (job == null || job.Status != "Archived") return (false, "Không tìm thấy tin đang lưu trữ.");
            if (!isAdmin)
            {
                var recruiter = await _context.Recruiters.FirstOrDefaultAsync(r => r.AccountID == accountId);
                if (recruiter == null) return (false, "Không tìm thấy thông tin HR.");
                var assigned = await _context.RecruiterBranches.AnyAsync(rb => rb.RecruiterID == recruiter.RecruiterID && rb.BranchID == job.BranchID);
                if (job.RecruiterID != recruiter.RecruiterID && !assigned) return (false, "Bạn không có quyền khôi phục tin này.");
            }
            job.Status = "Pending";
            job.RejectReason = "";
            await _context.SaveChangesAsync();
            return (true, "Đã khôi phục và chuyển tin về trạng thái chờ duyệt.");
        }

        public async Task<IEnumerable<object>> GetJobsByRecruiterAsync(string accountId)
        {
            var recruiter = await _context.Recruiters.FirstOrDefaultAsync(r => r.AccountID == accountId);
            if (recruiter == null) return new List<object>();

            DateTime today = JobLifecyclePolicy.TodayVietnam;

            var branchIds = await _context.RecruiterBranches
                .Where(rb => rb.RecruiterID == recruiter.RecruiterID)
                .Select(rb => rb.BranchID)
                .ToListAsync();

            return await (from j in _context.JobPostings
                          join p in _context.Positions on j.PositionID equals p.PositionID into pj
                          from p in pj.DefaultIfEmpty()
                          join c in _context.Categories on p.CategoryID equals c.CategoryID into cj
                          from c in cj.DefaultIfEmpty()
                          join jl in _context.JobLevels on j.JobLevelID equals jl.JobLevelID into jlj
                          from jl in jlj.DefaultIfEmpty()
                          join b in _context.Branches on j.BranchID equals b.BranchID into bj
                          from b in bj.DefaultIfEmpty()
                          where j.RecruiterID == recruiter.RecruiterID || string.IsNullOrEmpty(j.RecruiterID) || branchIds.Contains(j.BranchID)
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
                               status = j.Status,
                               rejectReason = j.RejectReason,
                               isApproved = j.Status == "Published",
                               isExpired = (j.Status == "Published" || j.Status == "Closed") && j.Deadline.Date < today,
                               isRecruiting = j.Status == "Published" &&
                                   (!j.StartDate.HasValue || j.StartDate.Value.Date <= today) &&
                                   j.Deadline.Date >= today,
                               lifecycleStatus = j.Status == "Pending" ? JobLifecyclePolicy.Pending
                                   : j.Status == "Rejected" ? JobLifecyclePolicy.Rejected
                                   : j.Status == "Flagged" ? JobLifecyclePolicy.Flagged
                                   : j.Status == "Archived" ? JobLifecyclePolicy.Archived
                                   : (j.Status == "Published" || j.Status == "Closed") && j.Deadline.Date < today ? JobLifecyclePolicy.Expired
                                   : (j.Status == "Closed" || j.Status == "Locked") ? JobLifecyclePolicy.Closed
                                   : j.Status == "Published" && j.StartDate.HasValue && j.StartDate.Value.Date > today ? JobLifecyclePolicy.Scheduled
                                   : j.Status == "Published" ? JobLifecyclePolicy.Recruiting
                                   : j.Status,
                               repostedFromJobId = j.RepostedFromJobID,
                               campaignGroupId = j.CampaignGroupID,
                               recruitmentRound = j.RecruitmentRound,
                               position = p != null ? new { id = p.PositionID, name = p.PositionName } : null,
                              branch = b != null ? new { id = b.BranchID, name = b.BranchName } : null,
                              category = c != null ? new { id = c.CategoryID, name = c.Name, parentId = c.ParentId } : null,
                              jobLevel = jl != null ? new { id = jl.JobLevelID, name = jl.Name } : null
                          }).ToListAsync();
        }

        public async Task<IEnumerable<object>> GetAdminJobsAsync()
        {
            var defaultRecruiter = await _context.Recruiters.FirstOrDefaultAsync();
            DateTime today = JobLifecyclePolicy.TodayVietnam;

            var rawJobs = await (from j in _context.JobPostings
                                 join p in _context.Positions on j.PositionID equals p.PositionID into pj
                                 from p in pj.DefaultIfEmpty()
                                 join b in _context.Branches on j.BranchID equals b.BranchID into bj
                                 from b in bj.DefaultIfEmpty()
                                 join r in _context.Recruiters on j.RecruiterID equals r.RecruiterID into rj
                                 from r in rj.DefaultIfEmpty()
                                 join acc in _context.Accounts on r.AccountID equals acc.AccountID into accj
                                 from acc in accj.DefaultIfEmpty()
                                 join c in _context.Categories on p.CategoryID equals c.CategoryID into cj
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
                                      isApproved = j.Status == "Published",
                                      isExpired = (j.Status == "Published" || j.Status == "Closed") && j.Deadline.Date < today,
                                      isRecruiting = j.Status == "Published" &&
                                          (!j.StartDate.HasValue || j.StartDate.Value.Date <= today) &&
                                          j.Deadline.Date >= today,
                                      lifecycleStatus = j.Status == "Pending" ? JobLifecyclePolicy.Pending
                                          : j.Status == "Rejected" ? JobLifecyclePolicy.Rejected
                                          : j.Status == "Flagged" ? JobLifecyclePolicy.Flagged
                                          : j.Status == "Archived" ? JobLifecyclePolicy.Archived
                                          : (j.Status == "Published" || j.Status == "Closed") && j.Deadline.Date < today ? JobLifecyclePolicy.Expired
                                          : (j.Status == "Closed" || j.Status == "Locked") ? JobLifecyclePolicy.Closed
                                          : j.Status == "Published" && j.StartDate.HasValue && j.StartDate.Value.Date > today ? JobLifecyclePolicy.Scheduled
                                          : j.Status == "Published" ? JobLifecyclePolicy.Recruiting
                                          : j.Status,
                                      repostedFromJobId = j.RepostedFromJobID,
                                      campaignGroupId = j.CampaignGroupID,
                                      recruitmentRound = j.RecruitmentRound,
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
            if (job == null || (job.Status != "Published" && job.Status != "Closed")) return false;

            if (JobLifecyclePolicy.IsExpired(job)) return false;

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
            if (job == null || (job.Status != "Published" && job.Status != "Closed")) return false;

            if (JobLifecyclePolicy.IsExpired(job)) return false;

            var isDirectOwner = job.RecruiterID == recruiter.RecruiterID;
            var isAssignedToBranch = await _context.RecruiterBranches.AnyAsync(rb => 
                rb.RecruiterID == recruiter.RecruiterID && rb.BranchID == job.BranchID);

            if (!isDirectOwner && !isAssignedToBranch) return false;

            job.Status = job.Status == "Published" ? "Closed" : "Published";
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<object?> ReviewJobAsync(string jobId, string accountId, bool isAdmin)
        {
            DateTime today = JobLifecyclePolicy.TodayVietnam;
            if (!isAdmin)
            {
                var recruiter = await _context.Recruiters.FirstOrDefaultAsync(r => r.AccountID == accountId);
                if (recruiter == null) return null;
                var ownedJob = await _context.JobPostings.FindAsync(jobId);
                if (ownedJob == null) return null;
                var assigned = await _context.RecruiterBranches.AnyAsync(rb => rb.RecruiterID == recruiter.RecruiterID && rb.BranchID == ownedJob.BranchID);
                if (ownedJob.RecruiterID != recruiter.RecruiterID && !assigned) return null;
            }
            var query = from j in _context.JobPostings
                        join p in _context.Positions on j.PositionID equals p.PositionID into pj
                        from p in pj.DefaultIfEmpty()
                        join b in _context.Branches on j.BranchID equals b.BranchID into bj
                        from b in bj.DefaultIfEmpty()
                        join c in _context.Categories on p.CategoryID equals c.CategoryID into cj
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
                            isExpired = (j.Status == "Published" || j.Status == "Closed") && j.Deadline.Date < today,
                            isRecruiting = j.Status == "Published" &&
                                (!j.StartDate.HasValue || j.StartDate.Value.Date <= today) &&
                                j.Deadline.Date >= today,
                            lifecycleStatus = j.Status == "Pending" ? JobLifecyclePolicy.Pending
                                : j.Status == "Rejected" ? JobLifecyclePolicy.Rejected
                                : j.Status == "Flagged" ? JobLifecyclePolicy.Flagged
                                : j.Status == "Archived" ? JobLifecyclePolicy.Archived
                                : (j.Status == "Published" || j.Status == "Closed") && j.Deadline.Date < today ? JobLifecyclePolicy.Expired
                                : (j.Status == "Closed" || j.Status == "Locked") ? JobLifecyclePolicy.Closed
                                : j.Status == "Published" && j.StartDate.HasValue && j.StartDate.Value.Date > today ? JobLifecyclePolicy.Scheduled
                                : j.Status == "Published" ? JobLifecyclePolicy.Recruiting
                                : j.Status,
                            repostedFromJobId = j.RepostedFromJobID,
                            campaignGroupId = j.CampaignGroupID,
                            recruitmentRound = j.RecruitmentRound,
                            position = p != null ? new { id = p.PositionID, name = p.PositionName } : null,
                            branch = b != null ? new { id = b.BranchID, name = b.BranchName } : null,
                            category = c != null ? new { id = c.CategoryID, name = c.Name } : null,
                            jobLevel = jl != null ? new { id = jl.JobLevelID, name = jl.Name } : null,
                            viewCount = j.ViewCount
                        };

            var jobInfo = await query.FirstOrDefaultAsync();
            if (jobInfo == null) return null;

            var criteria = await _context.JobCriteria
                .Where(c => c.JobID == jobId && c.IsActive)
                .OrderBy(c => c.DisplayOrder)
                .Select(c => new
                {
                    id = c.CriterionID,
                    name = c.Name,
                    weight = c.Weight,
                    criterionType = c.CriterionType,
                    criterionGroupId = c.CriterionGroupId,
                    priorityLevel = c.PriorityLevel,
                    @operator = c.Operator,
                    targetValue = c.TargetValue,
                    minDurationMonths = c.MinDurationMonths,
                    evidenceSources = c.EvidenceSources,
                    evaluationGuidance = c.EvaluationGuidance,
                    displayOrder = c.DisplayOrder,
                    isActive = c.IsActive
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
                    jobInfo.isExpired,
                    jobInfo.isRecruiting,
                    jobInfo.lifecycleStatus,
                    jobInfo.repostedFromJobId,
                    jobInfo.campaignGroupId,
                    jobInfo.recruitmentRound,
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
            if (job == null || job.Status != "Pending") return false;

            if (job.Deadline.Date < JobLifecyclePolicy.TodayVietnam) return false;

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
            DateTime today = JobLifecyclePolicy.TodayVietnam;
            return await (from j in _context.JobPostings
                          join p in _context.Positions on j.PositionID equals p.PositionID into pj
                          from p in pj.DefaultIfEmpty()
                          join b in _context.Branches on j.BranchID equals b.BranchID into bj
                          from b in bj.DefaultIfEmpty()
                          where j.Status == "Published"
                                && (!j.StartDate.HasValue || j.StartDate.Value.Date <= today)
                                && j.Deadline.Date >= today
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
            DateTime today = JobLifecyclePolicy.TodayVietnam;
            // 1. Sử dụng LINQ Join thay vì .Include()
            var query = from j in _context.JobPostings
                        join p in _context.Positions on j.PositionID equals p.PositionID into pj
                        from p in pj.DefaultIfEmpty()
                        join b in _context.Branches on j.BranchID equals b.BranchID into bj
                        from b in bj.DefaultIfEmpty()
                        where j.Status == "Published"
                              && (!j.StartDate.HasValue || j.StartDate.Value.Date <= today)
                              && j.Deadline.Date >= today
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
                if (loc == "hcm" || loc == "tphcm" || loc == "tp.hcm" ||
                    loc == "hồ chí minh" || loc == "tp. hồ chí minh" ||
                    loc == "thành phố hồ chí minh")
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
                return new PagedResult<JobSummaryDto>
                {
                    Items = new List<JobSummaryDto>(),
                    TotalCount = 0,
                    PageIndex = request.PageIndex,
                    PageSize = request.PageSize,
                    IsFallback = false
                };
            }

            if (totalCount < 0)
            {
                // Fallback: Lấy Top 6 tin tuyển dụng có GIÁ TRỊ LỢI ÍCH cao nhất (High-Utility: Lương * Lượt xem)
                var fallbackQuery = from j in _context.JobPostings
                                    join p in _context.Positions on j.PositionID equals p.PositionID into pj
                                    from p in pj.DefaultIfEmpty()
                                    join b in _context.Branches on j.BranchID equals b.BranchID into bj
                                    from b in bj.DefaultIfEmpty()
                                    where j.Status == "Published"
                                          && (!j.StartDate.HasValue || j.StartDate.Value.Date <= today)
                                          && j.Deadline.Date >= today
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

                    // Tiêu đề khớp trực tiếp luôn được ưu tiên. Kết quả chỉ khớp gián tiếp
                    // qua mô tả phải có semantic score cao để tránh trả việc không liên quan.
                    var normalizedKeyword = request.Keyword.Trim();
                    foreach (var job in processedJobs)
                    {
                        if (scoreMap.TryGetValue(job.Id, out double score))
                        {
                            job.AiScore = (int)Math.Round(score * 100);
                        }
                    }

                    processedJobs = processedJobs
                        .Where(job =>
                            job.Title.Contains(normalizedKeyword, StringComparison.CurrentCultureIgnoreCase) ||
                            job.AiScore >= 65)
                        .OrderByDescending(job =>
                            job.Title.Contains(normalizedKeyword, StringComparison.CurrentCultureIgnoreCase))
                        .ThenByDescending(job => job.AiScore)
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
                                                  && (!j.StartDate.HasValue || j.StartDate.Value.Date <= today)
                                                  && j.Deadline.Date >= today
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
                else
                {
                    // AI embedding có thể tạm thời hết quota hoặc không khả dụng.
                    // Khi đó chỉ giữ kết quả khớp tiêu đề để không trả các job mà
                    // từ khóa chỉ tình cờ xuất hiện trong một câu mô tả chung chung.
                    var normalizedKeyword = request.Keyword.Trim();
                    processedJobs = processedJobs
                        .Where(job => job.Title.Contains(
                            normalizedKeyword,
                            StringComparison.CurrentCultureIgnoreCase))
                        .OrderByDescending(job => job.UpdatedAt)
                        .ToList();
                }
            }

            // Khi người dùng đang tìm kiếm, không thay kết quả rỗng bằng các job
            // High-Utility không liên quan. UI cần nói rõ là không tìm thấy kết quả.
            if (string.IsNullOrWhiteSpace(request.Keyword))
            {
                // No keyword, sort by update date descending
                processedJobs = processedJobs.OrderByDescending(j => j.UpdatedAt).ToList();
            }

            if (!string.IsNullOrWhiteSpace(request.Keyword) && isFallbackUsed)
            {
                processedJobs = new List<JobSummaryDto>();
                isFallbackUsed = false;
            }

            // Refactor descriptions to fit search list display preview
            foreach (var job in processedJobs)
            {
                job.Location = NormalizeLocationDisplay(job.Location);
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

        private static string NormalizeLocationDisplay(string? location)
        {
            if (string.IsNullOrWhiteSpace(location))
            {
                return "Chưa cập nhật";
            }

            var normalized = location.Trim().ToLowerInvariant();
            if (normalized.Contains("hồ chí minh") ||
                normalized == "hcm" || normalized == "tphcm" || normalized == "tp.hcm")
            {
                return "Hồ Chí Minh";
            }

            return location.Trim();
        }

        public async Task<object?> GetPublishedJobByIdAsync(string jobId)
        {
            DateTime today = JobLifecyclePolicy.TodayVietnam;
            var job = await _context.JobPostings.FindAsync(jobId);
            if (job != null && JobLifecyclePolicy.IsRecruiting(job, today))
            {
                job.ViewCount += 1;
                await _context.SaveChangesAsync();
            }

            var query = from j in _context.JobPostings
                        join p in _context.Positions on j.PositionID equals p.PositionID into pj
                        from p in pj.DefaultIfEmpty()
                        join b in _context.Branches on j.BranchID equals b.BranchID into bj
                        from b in bj.DefaultIfEmpty()
                        where j.JobID == jobId
                              && j.Status == "Published"
                              && (!j.StartDate.HasValue || j.StartDate.Value.Date <= today)
                              && j.Deadline.Date >= today
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
            DateTime today = JobLifecyclePolicy.TodayVietnam;
            // Gom nhóm các công việc đã duyệt theo Lĩnh vực (Category) và đếm số lượng
            var query = await (from j in _context.JobPostings
                               join p in _context.Positions on j.PositionID equals p.PositionID
                               join c in _context.Categories on p.CategoryID equals c.CategoryID
                               where j.Status == "Published"
                                     && (!j.StartDate.HasValue || j.StartDate.Value.Date <= today)
                                     && j.Deadline.Date >= today
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
            DateTime today = JobLifecyclePolicy.TodayVietnam;
            var query = from j in _context.JobPostings
                        join p in _context.Positions on j.PositionID equals p.PositionID into pj
                        from p in pj.DefaultIfEmpty()
                        join b in _context.Branches on j.BranchID equals b.BranchID into bj
                        from b in bj.DefaultIfEmpty()
                        where j.Status == "Published"
                              && (!j.StartDate.HasValue || j.StartDate.Value.Date <= today)
                              && j.Deadline.Date >= today
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
            DateTime today = JobLifecyclePolicy.TodayVietnam;

            var query = from j in _context.JobPostings
                        join p in _context.Positions on j.PositionID equals p.PositionID into pj
                        from p in pj.DefaultIfEmpty()
                        join b in _context.Branches on j.BranchID equals b.BranchID into bj
                        from b in bj.DefaultIfEmpty()
                        where j.Status == "Published"
                              && (!j.StartDate.HasValue || j.StartDate.Value.Date <= today)
                              && j.Deadline.Date >= today
                              && j.JobID != jobId
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

            var job = await _context.JobPostings.FindAsync(jobId);
            if (job == null || !JobLifecyclePolicy.IsRecruiting(job)) return false;

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

        private static readonly HashSet<string> AllowedCriterionTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "SKILL", "TOTAL_EXPERIENCE", "SKILL_EXPERIENCE", "EDUCATION",
            "CERTIFICATION", "LANGUAGE", "LOCATION_WORK_MODE", "CUSTOM"
        };

        private static readonly HashSet<string> AllowedPriorityLevels = new(StringComparer.OrdinalIgnoreCase)
        {
            "REQUIRED", "PREFERRED", "BONUS"
        };

        private static readonly HashSet<string> AllowedOperators = new(StringComparer.OrdinalIgnoreCase)
        {
            "EXISTS", "MINIMUM", "MAXIMUM", "EQUALS", "IN"
        };

        private static void ValidateStructuredCriteria(IReadOnlyCollection<JobCriterionRequest> criteria)
        {
            var duplicatedName = criteria
                .GroupBy(criterion => criterion.Name.Trim(), StringComparer.OrdinalIgnoreCase)
                .FirstOrDefault(group => group.Count() > 1)?.Key;
            if (!string.IsNullOrWhiteSpace(duplicatedName))
                throw new Exception($"Tiêu chí '{duplicatedName}' đang bị trùng lặp.");

            foreach (var criterion in criteria)
            {
                var criterionType = NormalizeOption(criterion.CriterionType, "CUSTOM");
                var priorityLevel = NormalizeOption(criterion.PriorityLevel, "PREFERRED");
                var criterionOperator = NormalizeOption(criterion.Operator, "EXISTS");

                if (!AllowedCriterionTypes.Contains(criterionType))
                    throw new Exception($"Loại của tiêu chí '{criterion.Name}' không hợp lệ.");
                if (!AllowedPriorityLevels.Contains(priorityLevel))
                    throw new Exception($"Mức độ của tiêu chí '{criterion.Name}' không hợp lệ.");
                if (!AllowedOperators.Contains(criterionOperator))
                    throw new Exception($"Điều kiện của tiêu chí '{criterion.Name}' không hợp lệ.");
                if (criterionOperator is "MINIMUM" or "MAXIMUM" or "EQUALS" or "IN"
                    && string.IsNullOrWhiteSpace(criterion.TargetValue)
                    && criterion.MinDurationMonths is null)
                {
                    throw new Exception($"Tiêu chí '{criterion.Name}' cần có giá trị yêu cầu hoặc thời lượng tối thiểu.");
                }
            }
        }

        private static JobCriterion CreateCriterionEntity(
            JobCriterionRequest criterion,
            string jobId,
            int index)
        {
            return new JobCriterion
            {
                CriterionID = Guid.NewGuid().ToString(),
                JobID = jobId,
                Name = criterion.Name.Trim(),
                Weight = criterion.Weight,
                CriterionGroupId = NormalizeNullable(criterion.CriterionGroupId),
                CriterionType = NormalizeOption(criterion.CriterionType, "CUSTOM"),
                PriorityLevel = NormalizeOption(criterion.PriorityLevel, "PREFERRED"),
                Operator = NormalizeOption(criterion.Operator, "EXISTS"),
                TargetValue = NormalizeNullable(criterion.TargetValue) ?? criterion.Name.Trim(),
                MinDurationMonths = criterion.MinDurationMonths,
                EvidenceSources = NormalizeNullable(criterion.EvidenceSources)
                    ?? "SKILLS,EXPERIENCE,PROJECTS",
                EvaluationGuidance = NormalizeNullable(criterion.EvaluationGuidance),
                DisplayOrder = criterion.DisplayOrder ?? index,
                IsActive = true
            };
        }

        private static string BuildCriterionSignature(JobCriterion criterion)
        {
            return string.Join('|',
                criterion.Name.Trim(),
                criterion.Weight,
                NormalizeNullable(criterion.CriterionGroupId),
                NormalizeOption(criterion.CriterionType, "CUSTOM"),
                NormalizeOption(criterion.PriorityLevel, "PREFERRED"),
                NormalizeOption(criterion.Operator, "EXISTS"),
                NormalizeNullable(criterion.TargetValue) ?? criterion.Name.Trim(),
                criterion.MinDurationMonths,
                NormalizeNullable(criterion.EvidenceSources) ?? "SKILLS,EXPERIENCE,PROJECTS",
                NormalizeNullable(criterion.EvaluationGuidance));
        }

        private static string BuildCriterionSignature(JobCriterionRequest criterion)
        {
            return string.Join('|',
                criterion.Name.Trim(),
                criterion.Weight,
                NormalizeNullable(criterion.CriterionGroupId),
                NormalizeOption(criterion.CriterionType, "CUSTOM"),
                NormalizeOption(criterion.PriorityLevel, "PREFERRED"),
                NormalizeOption(criterion.Operator, "EXISTS"),
                NormalizeNullable(criterion.TargetValue) ?? criterion.Name.Trim(),
                criterion.MinDurationMonths,
                NormalizeNullable(criterion.EvidenceSources) ?? "SKILLS,EXPERIENCE,PROJECTS",
                NormalizeNullable(criterion.EvaluationGuidance));
        }

        private static string NormalizeOption(string? value, string fallback)
        {
            return string.IsNullOrWhiteSpace(value) ? fallback : value.Trim().ToUpperInvariant();
        }

        private static string? NormalizeNullable(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        private static (DateTime? StartDate, DateTime Deadline) NormalizeRecruitmentDates(
            DateTime? requestedStartDate,
            DateTime? requestedDeadline)
        {
            DateTime today = JobLifecyclePolicy.TodayVietnam;
            DateTime? startDate = requestedStartDate?.Date;
            DateTime deadline = (requestedDeadline ?? today.AddDays(30)).Date;

            if (deadline < today)
            {
                throw new Exception("Hạn tuyển dụng không được nằm trước ngày hiện tại theo múi giờ Việt Nam.");
            }

            if (startDate.HasValue && deadline < startDate.Value)
            {
                throw new Exception("Hạn tuyển dụng phải bằng hoặc sau ngày bắt đầu tuyển.");
            }

            return (startDate, deadline);
        }
    }
}
