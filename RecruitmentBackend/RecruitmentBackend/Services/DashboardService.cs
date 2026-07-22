using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
using System.Text.Json;

namespace RecruitmentBackend.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;

        public DashboardService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetAdminDashboardStatsAsync(string? categoryId, DateTime? fromDate, DateTime? toDate)
        {
            string? selectedCategoryId = NormalizeCategoryId(categoryId);

            DateTime? fromDateValue = null;
            DateTime? toDateExclusive = null;

            if (fromDate.HasValue == true)
            {
                fromDateValue = fromDate.Value.Date;
            }

            if (toDate.HasValue == true)
            {
                toDateExclusive = toDate.Value.Date.AddDays(1);
            }

            DateTime snapshotDateExclusive;

            if (toDateExclusive.HasValue == true)
            {
                snapshotDateExclusive = toDateExclusive.Value;
            }
            else
            {
                snapshotDateExclusive = DateTime.Now;
            }

            DateTime snapshotDate;

            if (toDateExclusive.HasValue == true)
            {
                snapshotDate = toDateExclusive.Value.Date.AddDays(-1);
            }
            else
            {
                snapshotDate = DateTime.Now;
            }

            var categoryOptions = await _context.Categories
                .Where(category => category.IsActive == true)
                .OrderBy(category => category.Name)
                .Select(category => new
                {
                    categoryId = category.CategoryID,
                    categoryName = category.Name
                })
                .ToListAsync();

            /*
                QUICK METRIC 1:
                Tổng Người Dùng theo dạng snapshot.

                Ví dụ:
                - Không chọn thời gian: lấy tổng user hiện tại.
                - Chọn tuần trước: lấy tổng user đã tồn tại tính đến cuối tuần trước.
            */
            var accountList = await _context.Accounts
                .Where(account => account.CreatedAt < snapshotDateExclusive)
                .ToListAsync();

            int totalUsers = accountList.Count;

            int totalHrUsers = accountList.Count(account =>
                account.Role == "Recruiter" ||
                account.Role == "HR");

            int totalCandidateUsers = accountList.Count(account =>
                account.Role == "Candidate");

            /*
                Lấy toàn bộ Job kèm lĩnh vực.
                Không filter ngày ở query chính, vì ta cần dùng lại cho:
                - Snapshot active job.
                - Job mới trong khoảng thời gian.
                - Tỷ trọng lĩnh vực.
            */
            var allJobs = await (from job in _context.JobPostings
                                 join position in _context.Positions on job.PositionID equals position.PositionID into positionGroup
                                 from position in positionGroup.DefaultIfEmpty()
                                 join jobCategory in _context.Categories on job.CategoryID equals jobCategory.CategoryID into jobCategoryGroup
                                 from jobCategory in jobCategoryGroup.DefaultIfEmpty()
                                 join positionCategory in _context.Categories on position.CategoryID equals positionCategory.CategoryID into positionCategoryGroup
                                 from positionCategory in positionCategoryGroup.DefaultIfEmpty()
                                 select new AdminDashboardJobItem
                                 {
                                     JobId = job.JobID,
                                     Status = job.Status,
                                     Deadline = job.Deadline,
                                     CreatedAt = job.CreatedAt,
                                     CategoryId = string.IsNullOrWhiteSpace(job.CategoryID) == false
                                         ? job.CategoryID
                                         : position != null
                                             ? position.CategoryID
                                             : null,
                                     CategoryName = jobCategory != null
                                         ? jobCategory.Name
                                         : positionCategory != null
                                             ? positionCategory.Name
                                             : "Chưa phân loại"
                                 }).ToListAsync();

            /*
                Jobs trong khoảng filter:
                Dùng cho biểu đồ tăng trưởng nền tảng:
                - Tin đăng mới theo ngày.
            */
            var jobsInSelectedRange = allJobs
                .Where(job => IsCategoryMatched(job.CategoryId, selectedCategoryId) == true)
                .Where(job => IsDateInRange(job.CreatedAt, fromDateValue, toDateExclusive) == true)
                .ToList();

            /*
                Jobs snapshot:
                Dùng cho:
                - Card Tin Tuyển Dụng Active.
                - Donut tỷ trọng tin đăng theo lĩnh vực.

                Ý nghĩa:
                Tính các job đã tồn tại tính đến ngày kết thúc filter.
            */
            var snapshotJobs = allJobs
                .Where(job => IsCategoryMatched(job.CategoryId, selectedCategoryId) == true)
                .Where(job => job.CreatedAt < snapshotDateExclusive)
                .ToList();

            /*
                QUICK METRIC 2:
                Tin Tuyển Dụng Active tại mốc snapshot.

                Ví dụ:
                - Chọn tuần trước: job nào đã được tạo trước/cuối tuần trước,
                  status Published, deadline vẫn còn hiệu lực tại cuối tuần trước.
            */
            int activeJobs = snapshotJobs.Count(job =>
                job.Status == "Published" &&
                job.Deadline >= snapshotDate);

            /*
                Lấy toàn bộ Application kèm CV, Job, Category, AI Evaluation.
                Không filter ngày ở query chính để còn dùng cho snapshot và range.
            */
            var allApplications = await (from application in _context.Applications
                                         join cv in _context.CandidateCVs on application.CVID equals cv.CVID
                                         join job in _context.JobPostings on application.JobID equals job.JobID
                                         join position in _context.Positions on job.PositionID equals position.PositionID into positionGroup
                                         from position in positionGroup.DefaultIfEmpty()
                                         join jobCategory in _context.Categories on job.CategoryID equals jobCategory.CategoryID into jobCategoryGroup
                                         from jobCategory in jobCategoryGroup.DefaultIfEmpty()
                                         join positionCategory in _context.Categories on position.CategoryID equals positionCategory.CategoryID into positionCategoryGroup
                                         from positionCategory in positionCategoryGroup.DefaultIfEmpty()
                                         join ai in _context.AIEvaluations on application.ApplicationID equals ai.ApplicationID into aiGroup
                                         from ai in aiGroup.DefaultIfEmpty()
                                         select new AdminDashboardApplicationItem
                                         {
                                             Application = application,
                                             CandidateCv = cv,
                                             Job = job,
                                             AiEvaluation = ai,
                                             CategoryId = string.IsNullOrWhiteSpace(job.CategoryID) == false
                                                 ? job.CategoryID
                                                 : position != null
                                                     ? position.CategoryID
                                                     : null,
                                             CategoryName = jobCategory != null
                                                 ? jobCategory.Name
                                                 : positionCategory != null
                                                     ? positionCategory.Name
                                                     : "Chưa phân loại"
                                         }).ToListAsync();

            /*
                Applications trong khoảng filter:
                Dùng cho:
                - Activity trend: CV nộp theo ngày.
                - Conversion funnel.
                - OCR/NLP error rate.
            */
            var filteredApplications = allApplications
                .Where(item => IsCategoryMatched(item.CategoryId, selectedCategoryId) == true)
                .Where(item => IsDateInRange(item.Application.AppliedAt, fromDateValue, toDateExclusive) == true)
                .ToList();

            /*
                Applications snapshot:
                Dùng cho card CV đã phân tích AI.
                Ý nghĩa: hồ sơ đã nộp tính đến ngày kết thúc filter.
            */
            var snapshotApplications = allApplications
                .Where(item => IsCategoryMatched(item.CategoryId, selectedCategoryId) == true)
                .Where(item => item.Application.AppliedAt < snapshotDateExclusive)
                .ToList();

            /*
                QUICK METRIC 3:
                CV đã phân tích AI tính đến mốc snapshot.

                Điều kiện:
                - Application đã tồn tại trước mốc snapshot.
                - Có AIEvaluation.
                - AIEvaluation cũng đã hoàn tất trước mốc snapshot.
            */
            var analyzedApplications = snapshotApplications
                .Where(item =>
                    item.AiEvaluation != null &&
                    item.AiEvaluation.EvaluatedAt < snapshotDateExclusive)
                .ToList();

            int analyzedCvs = analyzedApplications.Count;

            /*
                QUICK METRIC 4:
                Trạng thái máy chủ AI.

                Nếu Admin có chọn khoảng thời gian:
                - Tính Avg xử lý AI của các CV được AI đánh giá trong khoảng đó.

                Nếu không chọn khoảng thời gian:
                - Tính Avg xử lý AI của toàn bộ CV đã phân tích tính đến hiện tại.
            */
            var performanceApplications = allApplications
                .Where(item => IsCategoryMatched(item.CategoryId, selectedCategoryId) == true)
                .Where(item =>
                    item.AiEvaluation != null &&
                    IsDateInRange(item.AiEvaluation.EvaluatedAt, fromDateValue, toDateExclusive) == true)
                .ToList();

            if (fromDateValue.HasValue == false && toDateExclusive.HasValue == false)
            {
                performanceApplications = analyzedApplications;
            }

            decimal? averageProcessingSeconds = BuildAverageProcessingSeconds(performanceApplications);
            string aiServerStatus = BuildAiServerStatus(averageProcessingSeconds);

            // TÍNH TOÁN CÁC CHỈ SỐ BỔ SUNG CHO DOANH NGHIỆP
            int highMatchCount = analyzedApplications.Count(item => item.AiEvaluation != null && item.AiEvaluation.FitScore >= 75);
            double highMatchRate = analyzedCvs > 0 ? Math.Round((double)highMatchCount / analyzedCvs * 100, 1) : 0;

            // Tối ưu hóa tính toán Time-to-hire và Chi nhánh hiệu quả trực tiếp trên Database
            var avgDays = await (from app in _context.Applications
                                 join schedule in _context.InterviewSchedules on app.ApplicationID equals schedule.ApplicationID
                                 select EF.Functions.DateDiffDay(app.AppliedAt, schedule.InterviewDate))
                                .AverageAsync(val => (double?)val);
            double timeToHireDays = avgDays.HasValue ? Math.Round(avgDays.Value, 1) : 0;

            var topBranches = await (from job in _context.JobPostings
                                     where job.Status == "Published"
                                     join branch in _context.Branches on job.BranchID equals branch.BranchID
                                     group job by branch.BranchName into g
                                     select new { branchName = g.Key, count = g.Count() })
                                    .OrderByDescending(x => x.count)
                                    .Take(5)
                                    .ToListAsync();

            var quickMetrics = new
            {
                totalUsers,
                totalHrUsers,
                totalCandidateUsers,
                activeJobs,
                analyzedCvs,
                aiServerStatus,
                averageProcessingSeconds,
                highMatchRate,
                timeToHireDays,
                topBranches
            };

            /*
                CHART DATA:
                - activityTrend: dữ liệu phát sinh trong khoảng filter.
                - jobCategoryShare: snapshot job theo lĩnh vực tính đến mốc filter.
                - conversionFunnel: application trong khoảng filter.
                - ocrErrorRate: CV/application trong khoảng filter.
            */
            var activityTrend = BuildActivityTrend(
                filteredApplications,
                jobsInSelectedRange,
                fromDateValue,
                toDateExclusive);

            var jobCategoryShare = BuildJobCategoryShare(snapshotJobs);

            var conversionFunnel = BuildConversionFunnel(filteredApplications);

            var ocrErrorRate = BuildOcrErrorRate(filteredApplications);

            return new
            {
                isSuccess = true,
                message = "Lấy thống kê Admin Dashboard thành công.",
                filters = new
                {
                    selectedCategoryId,
                    fromDate = fromDateValue,
                    toDate
                },
                categoryOptions,
                quickMetrics,
                activityTrend,
                jobCategoryShare,
                conversionFunnel,
                ocrErrorRate,

                /*
                    Giữ thêm các field phẳng này để frontend cũ hoặc code đang test
                    không bị vỡ nếu còn gọi trực tiếp.
                */
                totalUsers,
                totalHrUsers,
                totalCandidateUsers,
                activeJobs,
                analyzedCvs,
                aiServerStatus,
                averageProcessingSeconds
            };
        }

        public async Task<object> GetHrDashboardStatsAsync(string accountId, string? jobId, string? timeRange)
        {
            if (string.IsNullOrWhiteSpace(accountId) == true)
            {
                return new
                {
                    isSuccess = false,
                    message = "Không xác định được tài khoản HR đang đăng nhập."
                };
            }

            var recruiter = await _context.Recruiters
                .FirstOrDefaultAsync(recruiterItem => recruiterItem.AccountID == accountId);

            if (recruiter == null)
            {
                return new
                {
                    isSuccess = false,
                    message = "Không tìm thấy thông tin nhà tuyển dụng hợp lệ."
                };
            }

            var hrJobs = await (from job in _context.JobPostings
                                where job.RecruiterID == recruiter.RecruiterID
                                join position in _context.Positions on job.PositionID equals position.PositionID into positionGroup
                                from position in positionGroup.DefaultIfEmpty()
                                join category in _context.Categories on job.CategoryID equals category.CategoryID into categoryGroup
                                from category in categoryGroup.DefaultIfEmpty()
                                orderby job.CreatedAt descending
                                select new
                                {
                                    jobId = job.JobID,
                                    jobTitle = position != null ? position.PositionName : "Tin tuyển dụng chưa cập nhật vị trí",
                                    status = job.Status,
                                    createdAt = job.CreatedAt,
                                    deadline = job.Deadline,
                                    viewCount = job.ViewCount,
                                    categoryName = category != null ? category.Name : "Lĩnh vực khác"
                                }).ToListAsync();

            var hrJobIds = hrJobs.Select(job => job.jobId).ToList();

            bool isJobOwnedByHr = true;

            if (string.IsNullOrWhiteSpace(jobId) == false)
            {
                isJobOwnedByHr = hrJobIds.Contains(jobId);
            }

            if (isJobOwnedByHr == false)
            {
                return new
                {
                    isSuccess = false,
                    message = "Tin tuyển dụng không thuộc quyền quản lý của HR hiện tại."
                };
            }

            var applicationQuery = from application in _context.Applications
                                   where hrJobIds.Contains(application.JobID)
                                   join cv in _context.CandidateCVs on application.CVID equals cv.CVID
                                   join candidate in _context.Candidates on cv.CandidateID equals candidate.CandidateID
                                   join account in _context.Accounts on candidate.AccountID equals account.AccountID into accountGroup
                                   from account in accountGroup.DefaultIfEmpty()
                                   join job in _context.JobPostings on application.JobID equals job.JobID
                                   join position in _context.Positions on job.PositionID equals position.PositionID into positionGroup
                                   from position in positionGroup.DefaultIfEmpty()
                                   join ai in _context.AIEvaluations on application.ApplicationID equals ai.ApplicationID into aiGroup
                                   from ai in aiGroup.DefaultIfEmpty()
                                   select new DashboardApplicationItem
                                   {
                                       Application = application,
                                       CandidateCv = cv,
                                       Candidate = candidate,
                                       Account = account,
                                       Job = job,
                                       Position = position,
                                       AiEvaluation = ai
                                   };

            if (string.IsNullOrWhiteSpace(jobId) == false)
            {
                applicationQuery = applicationQuery.Where(item => item.Application.JobID == jobId);
            }

            DateTime? minAppliedAt = GetMinAppliedAtByTimeRange(timeRange);

            if (minAppliedAt.HasValue == true)
            {
                applicationQuery = applicationQuery.Where(item => item.Application.AppliedAt >= minAppliedAt.Value);
            }

            var dashboardApplications = await applicationQuery.ToListAsync();

            var totalJobs = hrJobIds.Count;
            var totalApplications = dashboardApplications.Count;
            var newApplications = dashboardApplications.Count(item => item.Application.Status == "Applied");

            var evaluatedApplications = dashboardApplications
                .Where(item => item.AiEvaluation != null)
                .ToList();

            decimal averageFitScore = 0;

            if (evaluatedApplications.Count > 0)
            {
                averageFitScore = Math.Round(evaluatedApplications.Average(item => item.AiEvaluation!.FitScore), 1);
            }

            var totalViews = hrJobs.Sum(job => job.viewCount);
            if (string.IsNullOrWhiteSpace(jobId) == false)
            {
                totalViews = hrJobs.Where(job => job.jobId == jobId).Sum(job => job.viewCount);
            }

            double applicationRate = totalViews > 0 ? Math.Round((double)totalApplications / totalViews * 100, 1) : 0;

            var funnel = new
            {
                applied = dashboardApplications.Count(item => item.Application.Status == "Applied"),
                reviewing = dashboardApplications.Count(item => item.Application.Status == "Reviewing"),
                interview = dashboardApplications.Count(item => item.Application.Status == "Interview"),
                offer = dashboardApplications.Count(item => item.Application.Status == "Offer"),
                rejected = dashboardApplications.Count(item => item.Application.Status == "Rejected")
            };

            var quickMetrics = new
            {
                totalJobs,
                totalApplications,
                newApplications,
                averageFitScore,
                totalViews,
                applicationRate
            };

            var skillCloudData = BuildSkillCloudData(dashboardApplications);
            var fitScoreDistribution = BuildFitScoreDistribution(evaluatedApplications);
            var topCandidates = BuildTopCandidates(evaluatedApplications);
            var degreeData = BuildDegreeData(dashboardApplications);
            var universityData = BuildUniversityData(dashboardApplications);
            var experienceData = BuildExperienceData(dashboardApplications);

            return new
            {
                isSuccess = true,
                message = "Lấy thống kê HR Dashboard thành công.",
                selectedJobId = jobId,
                jobOptions = hrJobs,
                quickMetrics,
                funnel,

                totalJobs,
                totalApplications,
                newApplications,
                averageFitScore,

                skillCloudData,
                fitScoreDistribution,
                topCandidates,

                degreeData,
                expData = experienceData,
                experienceData,
                universityData
            };
        }

        private sealed class DashboardApplicationItem
        {
            public Application Application { get; set; } = new Application();
            public CandidateCV CandidateCv { get; set; } = new CandidateCV();
            public Candidate Candidate { get; set; } = new Candidate();
            public Account? Account { get; set; }
            public JobPosting Job { get; set; } = new JobPosting();
            public Position? Position { get; set; }
            public AIEvaluation? AiEvaluation { get; set; }
        }

        private sealed class AdminDashboardJobItem
        {
            public string JobId { get; set; } = "";
            public string Status { get; set; } = "";
            public DateTime Deadline { get; set; }
            public DateTime CreatedAt { get; set; }
            public string? CategoryId { get; set; }
            public string CategoryName { get; set; } = "Chưa phân loại";
        }

        private sealed class AdminDashboardApplicationItem
        {
            public Application Application { get; set; } = new Application();
            public CandidateCV CandidateCv { get; set; } = new CandidateCV();
            public JobPosting Job { get; set; } = new JobPosting();
            public AIEvaluation? AiEvaluation { get; set; }
            public string? CategoryId { get; set; }
            public string CategoryName { get; set; } = "Chưa phân loại";
        }

        private static string? NormalizeCategoryId(string? categoryId)
        {
            if (string.IsNullOrWhiteSpace(categoryId) == true)
            {
                return null;
            }

            if (categoryId == "all")
            {
                return null;
            }

            return categoryId;
        }

        private static bool IsCategoryMatched(string? itemCategoryId, string? selectedCategoryId)
        {
            if (string.IsNullOrWhiteSpace(selectedCategoryId) == true)
            {
                return true;
            }

            if (string.IsNullOrWhiteSpace(itemCategoryId) == true)
            {
                return false;
            }

            return itemCategoryId == selectedCategoryId;
        }

        private static bool IsDateInRange(DateTime dateValue, DateTime? fromDateValue, DateTime? toDateExclusive)
        {
            if (fromDateValue.HasValue == true && dateValue < fromDateValue.Value)
            {
                return false;
            }

            if (toDateExclusive.HasValue == true && dateValue >= toDateExclusive.Value)
            {
                return false;
            }

            return true;
        }

        private static decimal? BuildAverageProcessingSeconds(IEnumerable<AdminDashboardApplicationItem> analyzedApplications)
        {
            var processingSecondsList = new List<decimal>();

            foreach (var item in analyzedApplications)
            {
                if (item.AiEvaluation == null)
                {
                    continue;
                }

                double totalSeconds = (item.AiEvaluation.EvaluatedAt - item.Application.AppliedAt).TotalSeconds;

                if (totalSeconds < 0)
                {
                    continue;
                }

                processingSecondsList.Add((decimal)totalSeconds);
            }

            if (processingSecondsList.Count == 0)
            {
                return null;
            }

            decimal averageProcessingSeconds = processingSecondsList.Average();
            return Math.Round(averageProcessingSeconds, 1);
        }

        private static string BuildAiServerStatus(decimal? averageProcessingSeconds)
        {
            if (averageProcessingSeconds.HasValue == false)
            {
                return "Chưa có dữ liệu";
            }

            if (averageProcessingSeconds.Value <= 3)
            {
                return "Bình thường";
            }

            if (averageProcessingSeconds.Value <= 6)
            {
                return "Cảnh báo";
            }

            return "Quá tải";
        }

        private static List<object> BuildActivityTrend(
            List<AdminDashboardApplicationItem> filteredApplications,
            List<AdminDashboardJobItem> filteredJobs,
            DateTime? fromDateValue,
            DateTime? toDateExclusive)
        {
            DateTime startDate;
            DateTime endDate;

            if (fromDateValue.HasValue == true)
            {
                startDate = fromDateValue.Value.Date;
            }
            else
            {
                startDate = DateTime.Now.Date.AddDays(-29);
            }

            if (toDateExclusive.HasValue == true)
            {
                endDate = toDateExclusive.Value.Date.AddDays(-1);
            }
            else
            {
                endDate = DateTime.Now.Date;
            }

            if (endDate < startDate)
            {
                endDate = startDate;
            }

            var result = new List<object>();
            DateTime currentDate = startDate;

            while (currentDate <= endDate)
            {
                int cvSubmissions = filteredApplications.Count(item => item.Application.AppliedAt.Date == currentDate.Date);
                int newJobs = filteredJobs.Count(job => job.CreatedAt.Date == currentDate.Date);

                result.Add(new
                {
                    date = currentDate.ToString("yyyy-MM-dd"),
                    cvSubmissions,
                    newJobs
                });

                currentDate = currentDate.AddDays(1);
            }

            return result;
        }

        private static List<object> BuildJobCategoryShare(List<AdminDashboardJobItem> filteredJobs)
        {
            return filteredJobs
                .GroupBy(job =>
                {
                    if (string.IsNullOrWhiteSpace(job.CategoryName) == true)
                    {
                        return "Chưa phân loại";
                    }

                    return job.CategoryName;
                })
                .Select(group => new
                {
                    categoryName = group.Key,
                    value = group.Count()
                })
                .OrderByDescending(item => item.value)
                .Cast<object>()
                .ToList();
        }

        private static List<object> BuildConversionFunnel(List<AdminDashboardApplicationItem> filteredApplications)
        {
            int uploadedCvs = filteredApplications.Count;

            int aiParsedSuccess = filteredApplications.Count(item => item.AiEvaluation != null);

            int qualifiedCvs = filteredApplications.Count(item =>
                item.AiEvaluation != null &&
                item.AiEvaluation.FitScore > 50);

            int hrInteracted = filteredApplications.Count(item =>
                string.IsNullOrWhiteSpace(item.Application.Status) == false &&
                item.Application.Status != "Applied" &&
                item.Application.Status != "Processing");

            var result = new List<object>
    {
        new
        {
            stage = "Tổng CV đã Upload",
            value = uploadedCvs,
            percent = CalculateFunnelPercent(uploadedCvs, uploadedCvs)
        },
        new
        {
            stage = "CV AI bóc tách thành công",
            value = aiParsedSuccess,
            percent = CalculateFunnelPercent(aiParsedSuccess, uploadedCvs)
        },
        new
        {
            stage = "CV đạt chuẩn Fit Score > 50",
            value = qualifiedCvs,
            percent = CalculateFunnelPercent(qualifiedCvs, uploadedCvs)
        },
        new
        {
            stage = "CV được HR tương tác",
            value = hrInteracted,
            percent = CalculateFunnelPercent(hrInteracted, uploadedCvs)
        }
    };

            return result;
        }

        private static decimal CalculateFunnelPercent(int value, int total)
        {
            if (total <= 0)
            {
                return 0;
            }

            decimal percent = ((decimal)value / total) * 100;
            return Math.Round(percent, 1);
        }

        private static List<object> BuildOcrErrorRate(List<AdminDashboardApplicationItem> filteredApplications)
        {
            var distinctCvItems = filteredApplications
                .GroupBy(item => item.CandidateCv.CVID)
                .Select(group => group.First())
                .ToList();

            var result = distinctCvItems
                .GroupBy(item => GetCvFileType(item.CandidateCv.FilePath))
                .Select(group =>
                {
                    int total = group.Count();

                    int failed = group.Count(item =>
                        IsCvExtractionFailed(item) == true);

                    decimal errorRate = 0;

                    if (total > 0)
                    {
                        errorRate = Math.Round(((decimal)failed / total) * 100, 1);
                    }

                    return new
                    {
                        fileType = group.Key,
                        errorRate,
                        total,
                        failed
                    };
                })
                .OrderByDescending(item => item.errorRate)
                .Cast<object>()
                .ToList();

            return result;
        }

        private static bool IsCvExtractionFailed(AdminDashboardApplicationItem item)
        {
            if (string.IsNullOrWhiteSpace(item.CandidateCv.RawText) == true)
            {
                return true;
            }

            if (string.IsNullOrWhiteSpace(item.CandidateCv.CVExtractedSkills) == true)
            {
                return true;
            }

            if (item.AiEvaluation == null)
            {
                return true;
            }

            return false;
        }

        private static string GetCvFileType(string? filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath) == true)
            {
                return "Không xác định";
            }

            string extension = Path.GetExtension(filePath).ToLower();

            if (extension == ".pdf")
            {
                return "PDF";
            }

            if (extension == ".doc" || extension == ".docx")
            {
                return "Word";
            }

            if (extension == ".jpg" || extension == ".jpeg" || extension == ".png")
            {
                return "Ảnh JPG/PNG";
            }

            return "Khác";
        }

        private static DateTime? GetMinAppliedAtByTimeRange(string? timeRange)
        {
            if (string.IsNullOrWhiteSpace(timeRange) == true)
            {
                return null;
            }

            DateTime now = DateTime.Now;

            if (timeRange == "week")
            {
                return now.AddDays(-7);
            }

            if (timeRange == "month")
            {
                return now.AddMonths(-1);
            }

            if (timeRange == "quarter")
            {
                return now.AddMonths(-3);
            }

            if (timeRange == "year")
            {
                return now.AddYears(-1);
            }

            return null;
        }

        private static List<object> BuildSkillCloudData(IEnumerable<DashboardApplicationItem> dashboardApplications)
        {
            var skillList = new List<string>();

            foreach (var item in dashboardApplications)
            {
                string? matchedSkillsJson = null;
                string? cvSkillsJson = null;

                if (item.AiEvaluation != null)
                {
                    matchedSkillsJson = item.AiEvaluation.MatchedSkills;
                }

                cvSkillsJson = item.CandidateCv.CVExtractedSkills;

                var matchedSkills = ParseStringListFromJson(matchedSkillsJson);
                var cvSkills = ParseStringListFromJson(cvSkillsJson);

                if (matchedSkills.Count > 0)
                {
                    skillList.AddRange(matchedSkills);
                }
                else
                {
                    skillList.AddRange(cvSkills);
                }
            }

            return skillList
                .Where(skill => string.IsNullOrWhiteSpace(skill) == false)
                .Select(skill => skill.Trim())
                .GroupBy(skill => skill, StringComparer.OrdinalIgnoreCase)
                .Select(group => new
                {
                    text = group.Key,
                    value = group.Count()
                })
                .OrderByDescending(item => item.value)
                .Take(30)
                .Cast<object>()
                .ToList();
        }

        private static List<object> BuildFitScoreDistribution(IEnumerable<DashboardApplicationItem> evaluatedApplications)
        {
            var scoreList = evaluatedApplications
                .Where(item => item.AiEvaluation != null)
                .Select(item => item.AiEvaluation!.FitScore)
                .ToList();

            var distribution = new List<object>
            {
                new { range = "Dưới 50", count = scoreList.Count(score => score < 50) },
                new { range = "50-70", count = scoreList.Count(score => score >= 50 && score < 70) },
                new { range = "70-85", count = scoreList.Count(score => score >= 70 && score < 85) },
                new { range = "Trên 85", count = scoreList.Count(score => score >= 85) }
            };

            return distribution;
        }

        private static List<object> BuildTopCandidates(IEnumerable<DashboardApplicationItem> evaluatedApplications)
        {
            return evaluatedApplications
                .Where(item => item.AiEvaluation != null)
                .OrderByDescending(item => item.AiEvaluation!.FitScore)
                .Take(5)
                .Select(item =>
                {
                    string featuredSkill = "Chưa bóc tách";

                    var matchedSkills = ParseStringListFromJson(item.AiEvaluation!.MatchedSkills);

                    if (matchedSkills.Count > 0)
                    {
                        featuredSkill = matchedSkills.First();
                    }
                    else
                    {
                        var cvSkills = ParseStringListFromJson(item.CandidateCv.CVExtractedSkills);

                        if (cvSkills.Count > 0)
                        {
                            featuredSkill = cvSkills.First();
                        }
                    }

                    string email = "Chưa cập nhật";

                    if (item.Account != null && string.IsNullOrWhiteSpace(item.Account.Email) == false)
                    {
                        email = item.Account.Email;
                    }

                    string candidateName = "Ứng viên chưa cập nhật tên";

                    if (string.IsNullOrWhiteSpace(item.Candidate.FullName) == false)
                    {
                        candidateName = item.Candidate.FullName;
                    }

                    string jobTitle = "Chưa cập nhật";

                    if (item.Position != null && string.IsNullOrWhiteSpace(item.Position.PositionName) == false)
                    {
                        jobTitle = item.Position.PositionName;
                    }

                    string classification = "Chưa phân loại";

                    if (string.IsNullOrWhiteSpace(item.AiEvaluation.Classification) == false)
                    {
                        classification = item.AiEvaluation.Classification;
                    }

                    return new
                    {
                        applicationId = item.Application.ApplicationID,
                        candidateId = item.Candidate.CandidateID,
                        candidateName,
                        email,
                        jobId = item.Application.JobID,
                        jobTitle,
                        featuredSkill,
                        fitScore = item.AiEvaluation.FitScore,
                        aiScore = item.AiEvaluation.FitScore,
                        classification
                    };
                })
                .Cast<object>()
                .ToList();
        }

        private static List<object> BuildDegreeData(IEnumerable<DashboardApplicationItem> dashboardApplications)
        {
            return dashboardApplications
                .Where(item => string.IsNullOrWhiteSpace(item.CandidateCv.Degree) == false)
                .GroupBy(item => item.CandidateCv.Degree)
                .Select(group => new
                {
                    type = group.Key,
                    value = group.Count()
                })
                .OrderByDescending(item => item.value)
                .Cast<object>()
                .ToList();
        }

        private static List<object> BuildUniversityData(IEnumerable<DashboardApplicationItem> dashboardApplications)
        {
            return dashboardApplications
                .Where(item => string.IsNullOrWhiteSpace(item.CandidateCv.University) == false)
                .GroupBy(item => item.CandidateCv.University)
                .Select(group => new
                {
                    type = group.Key,
                    value = group.Count()
                })
                .OrderByDescending(item => item.value)
                .Take(5)
                .Cast<object>()
                .ToList();
        }

        private static List<object> BuildExperienceData(IEnumerable<DashboardApplicationItem> dashboardApplications)
        {
            var cvList = dashboardApplications
                .Select(item => item.CandidateCv)
                .ToList();

            var experienceData = new List<object>
            {
                new { range = "Dưới 1 năm", count = cvList.Count(cv => (cv.YearsOfExperience ?? 0) < 1) },
                new { range = "1-3 năm", count = cvList.Count(cv => (cv.YearsOfExperience ?? 0) >= 1 && (cv.YearsOfExperience ?? 0) <= 3) },
                new { range = "3-5 năm", count = cvList.Count(cv => (cv.YearsOfExperience ?? 0) > 3 && (cv.YearsOfExperience ?? 0) <= 5) },
                new { range = "Trên 5 năm", count = cvList.Count(cv => (cv.YearsOfExperience ?? 0) > 5) }
            };

            return experienceData;
        }

        private static List<string> ParseStringListFromJson(string? json)
        {
            var result = new List<string>();

            if (string.IsNullOrWhiteSpace(json) == true)
            {
                return result;
            }

            if (json.Trim() == "[]")
            {
                return result;
            }

            try
            {
                var parsedList = JsonSerializer.Deserialize<List<string>>(json);

                if (parsedList != null)
                {
                    foreach (var item in parsedList)
                    {
                        if (string.IsNullOrWhiteSpace(item) == false)
                        {
                            result.Add(item.Trim());
                        }
                    }
                }
            }
            catch
            {
                var fallbackItems = json
                    .Replace("[", "")
                    .Replace("]", "")
                    .Replace("\"", "")
                    .Split(',', StringSplitOptions.RemoveEmptyEntries);

                foreach (var fallbackItem in fallbackItems)
                {
                    if (string.IsNullOrWhiteSpace(fallbackItem) == false)
                    {
                        result.Add(fallbackItem.Trim());
                    }
                }
            }

            return result;
        }

        public async Task<object> GetSimulatorCandidatesAsync()
        {
            try
            {
                var query = from evaluation in _context.AIEvaluations
                            join application in _context.Applications on evaluation.ApplicationID equals application.ApplicationID
                            join cv in _context.CandidateCVs on application.CVID equals cv.CVID
                            join candidate in _context.Candidates on cv.CandidateID equals candidate.CandidateID
                            join job in _context.JobPostings on application.JobID equals job.JobID
                            join position in _context.Positions on job.PositionID equals position.PositionID into positionGroup
                            from position in positionGroup.DefaultIfEmpty()
                            join category in _context.Categories on job.CategoryID equals category.CategoryID into categoryGroup
                            from category in categoryGroup.DefaultIfEmpty()
                            select new
                            {
                                evaluation,
                                application,
                                cv,
                                candidate,
                                job,
                                positionName = position != null ? position.PositionName : "Vị trí chưa xác định",
                                categoryId = category != null ? category.CategoryID : "other",
                                categoryName = category != null ? category.Name : "Khác"
                            };

                var evaluationsList = await query.ToListAsync();

                if (evaluationsList.Count == 0)
                {
                    return new
                    {
                        isSuccess = true,
                        data = new List<object>() // Trả về trống để frontend fallback về mock
                    };
                }

                // Nhóm theo CategoryId
                var grouped = evaluationsList
                    .GroupBy(item => item.categoryId)
                    .Select(g => {
                        // Lấy ứng viên có điểm cao nhất trong nhóm này
                        var topEvaluated = g.OrderByDescending(x => x.evaluation.FitScore).First();
                        
                        var matchedSkills = ParseStringListFromJson(topEvaluated.evaluation.MatchedSkills);
                        var missingSkills = ParseStringListFromJson(topEvaluated.evaluation.MissingSkills);

                        // Lấy chữ cái đầu làm avatar
                        string avatar = "UV";
                        if (!string.IsNullOrWhiteSpace(topEvaluated.candidate.FullName))
                        {
                            var words = topEvaluated.candidate.FullName.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                            if (words.Length >= 2)
                            {
                                avatar = (words[words.Length - 2][0].ToString() + words[words.Length - 1][0].ToString()).ToUpper();
                            }
                            else if (words.Length == 1)
                            {
                                avatar = words[0].Substring(0, Math.Min(2, words[0].Length)).ToUpper();
                            }
                        }

                        // Lọc các warnings hợp lý từ missingSkills
                        var warnings = missingSkills.Count > 0 
                            ? missingSkills.Take(2).ToList() 
                            : new List<string> { "Cần bổ sung kinh nghiệm thực tế", "Kiến thức chuyên môn cơ bản" };

                        return new
                        {
                            categoryKey = topEvaluated.categoryId,
                            categoryName = topEvaluated.categoryName,
                            candidate = new
                            {
                                name = topEvaluated.candidate.FullName ?? "Ứng viên chưa cập nhật tên",
                                role = topEvaluated.positionName.ToUpper(),
                                score = (int)Math.Round(topEvaluated.evaluation.FitScore),
                                avatar,
                                skills = matchedSkills.Count > 0 ? matchedSkills.Take(3).ToList() : new List<string> { "Kỹ năng mềm", "Tin học văn phòng" },
                                warnings
                            }
                        };
                    })
                    .ToList();

                return new
                {
                    isSuccess = true,
                    data = grouped
                };
            }
            catch (Exception ex)
            {
                return new
                {
                    isSuccess = false,
                    message = "Lỗi khi lấy thông tin mô phỏng ứng viên: " + ex.Message,
                    data = new List<object>()
                };
            }
        }
    }
}