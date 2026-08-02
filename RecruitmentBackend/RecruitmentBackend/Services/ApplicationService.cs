using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecruitmentBackend.Controllers;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
using RecruitmentBackend.Constants;
using RecruitmentBackend.DTOs.Requests;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Threading.Tasks;
using System.Net.Http;
using Microsoft.AspNetCore.SignalR;
using RecruitmentBackend.Hubs;

namespace RecruitmentBackend.Services
{
    public class ApplicationService : IApplicationService
    {
        private readonly AppDbContext _context;
        private readonly IFileService _fileService;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly IHubContext<AIEvaluationHub> _hubContext;
        private readonly INotificationService _notificationService;

        public ApplicationService(
            AppDbContext context,
            IFileService fileService,
            IServiceScopeFactory serviceScopeFactory,
            IHubContext<AIEvaluationHub> hubContext,
            INotificationService notificationService)
        {
            _context = context;
            _fileService = fileService;
            _serviceScopeFactory = serviceScopeFactory;
            _hubContext = hubContext;
            _notificationService = notificationService;
        }

        public async Task<(bool IsSuccess, string Message, object Data)> ApplyJobAsync(ApplyJobRequest request, ClaimsPrincipal user)
        {
            try
            {
                // 1. Lấy thông tin tài khoản đang đăng nhập
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrWhiteSpace(accountId) == true)
                {
                    return (false, "Không xác định được tài khoản đang đăng nhập.", null);
                }

                // 2. Lấy thông tin ứng viên
                var candidate = await _context.Candidates
                    .AsNoTracking()
                    .FirstOrDefaultAsync(candidateItem => candidateItem.AccountID == accountId);

                if (candidate == null)
                {
                    return (false, "Không tìm thấy thông tin Ứng viên hợp lệ.", null);
                }

                // 3. Lấy thông tin tin tuyển dụng
                var job = await _context.JobPostings.FindAsync(request.JobId);

                if (job == null)
                {
                    return (false, "Công việc bạn ứng tuyển không tồn tại hoặc đã hết hạn.", null);
                }

                // 4. Kiểm tra ứng viên đã nộp CV cho tin tuyển dụng này chưa
                var candidateCvIds = await _context.CandidateCVs
                    .Where(candidateCv => candidateCv.CandidateID == candidate.CandidateID)
                    .Select(candidateCv => candidateCv.CVID)
                    .ToListAsync();

                if (candidateCvIds.Count > 0)
                {
                    var existingApplication = await _context.Applications
                        .FirstOrDefaultAsync(application =>
                            candidateCvIds.Contains(application.CVID) &&
                            application.JobID == request.JobId);

                    if (existingApplication != null)
                    {
                        var duplicateData = new
                        {
                            applicationId = existingApplication.ApplicationID,
                            jobId = existingApplication.JobID,
                            isDuplicate = true
                        };

                        return (
                            false,
                            "Hồ sơ của bạn cho vị trí này đã được ghi nhận vào hệ thống. Bạn có thể theo dõi tiến độ tại trang Lịch sử ứng tuyển.",
                            duplicateData
                        );
                    }
                }

                // 5. Kiểm tra tin tuyển dụng có tiêu chí đánh giá chưa
                var jobCriteria = await _context.JobCriteria
                    .Where(jobCriterion => jobCriterion.JobID == request.JobId)
                    .ToListAsync();

                if (jobCriteria == null || jobCriteria.Count == 0)
                {
                    return (false, "Tin tuyển dụng này chưa có tiêu chí đánh giá CV.", null);
                }

                // 6. Xử lý tải file CV hoặc dùng CV mặc định
                byte[] cvFileBytes;
                string originalFileName;
                string contentType;
                string cvUrl;

                if (request.UseDefaultCv)
                {
                    if (string.IsNullOrEmpty(candidate.DefaultCvUrl))
                    {
                        return (false, "Bạn chưa tải lên CV mặc định trong hồ sơ cá nhân.", null);
                    }
                    cvUrl = candidate.DefaultCvUrl;
                    originalFileName = candidate.DefaultCvName ?? "CV_MacDinh.pdf";
                    contentType = originalFileName.EndsWith(".docx", StringComparison.OrdinalIgnoreCase) 
                        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                        : "application/pdf";

                    // Trích xuất tên file nguyên bản
                    string fileNameOnly = Path.GetFileName(cvUrl);
                    if (cvUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                    {
                        try
                        {
                            var uri = new Uri(cvUrl);
                            fileNameOnly = Path.GetFileName(uri.AbsolutePath);
                        }
                        catch {}
                    }

                    // Ưu tiên đọc file từ đĩa cục bộ (Hoạt động cả trên Docker volume ./Uploads:/app/Uploads)
                    string localPath1 = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", fileNameOnly);
                    string localPath2 = Path.Combine(Directory.GetCurrentDirectory(), cvUrl.TrimStart('/'));

                    if (File.Exists(localPath1))
                    {
                        cvFileBytes = await File.ReadAllBytesAsync(localPath1);
                    }
                    else if (File.Exists(localPath2))
                    {
                        cvFileBytes = await File.ReadAllBytesAsync(localPath2);
                    }
                    else if (cvUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                    {
                        using (var httpClient = new System.Net.Http.HttpClient())
                        {
                            httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
                            var httpResponse = await httpClient.GetAsync(cvUrl);
                            if (!httpResponse.IsSuccessStatusCode)
                            {
                                return (false, $"Không thể tải file CV (Mã lỗi: {httpResponse.StatusCode}). Vui lòng kiểm tra lại file CV.", null);
                            }
                            cvFileBytes = await httpResponse.Content.ReadAsByteArrayAsync();
                        }
                    }
                    else
                    {
                        return (false, "File CV mặc định không tồn tại trên hệ thống. Vui lòng tải lại CV mới trong hồ sơ.", null);
                    }

                    // Kiểm tra phản hồi trả về có phải trang lỗi HTML 404 hay không
                    if (cvFileBytes != null && cvFileBytes.Length > 0 && cvFileBytes.Length < 2000)
                    {
                        string headerText = System.Text.Encoding.UTF8.GetString(cvFileBytes);
                        if (headerText.TrimStart().StartsWith("<html", StringComparison.OrdinalIgnoreCase) || 
                            headerText.TrimStart().StartsWith("<!DOCTYPE", StringComparison.OrdinalIgnoreCase))
                        {
                            return (false, "File CV mặc định bị lỗi liên kết (trả về trang HTML 404). Vui lòng chọn hoặc tải lại file CV.", null);
                        }
                    }
                }
                else
                {
                    if (request.CvFile == null || request.CvFile.Length == 0)
                    {
                        return (false, "Vui lòng chọn file CV.", null);
                    }

                    using (var memoryStream = new MemoryStream())
                    {
                        await request.CvFile.CopyToAsync(memoryStream);
                        cvFileBytes = memoryStream.ToArray();
                    }

                    originalFileName = request.CvFile.FileName;
                    contentType = request.CvFile.ContentType;
                    cvUrl = await _fileService.SaveFileAsync(request.CvFile);
                }

                // 7. Lưu thông tin CV vào database trước
                var newCv = new CandidateCV
                {
                    CVID = Guid.NewGuid().ToString(),
                    CandidateID = candidate.CandidateID,
                    FilePath = cvUrl,
                    RawText = "",
                    ExtractedEmail = null,
                    ExtractedPhone = null,
                    CVExtractedSkills = "[]",
                    Degree = null,
                    Major = null,
                    University = null,
                    YearsOfExperience = 0,
                    Certificates = "[]",
                    CreatedAt = DateTime.Now
                };

                _context.CandidateCVs.Add(newCv);

                // 9. Ghi nhận đơn ứng tuyển trước
                var newApplication = new Application
                {
                    ApplicationID = Guid.NewGuid().ToString(),
                    JobID = request.JobId,
                    CVID = newCv.CVID,
                    Status = "Applied",
                    AppliedAt = DateTime.Now
                };

                _context.Applications.Add(newApplication);

                await _context.SaveChangesAsync();

                // 9.5. Send notification to Recruiter
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
                            "Đơn ứng tuyển mới",
                            $"Ứng viên {candidate.FullName} đã nộp hồ sơ cho công việc {positionName}",
                            $"/recruiter/applications/{job.JobID}"
                        );
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Lỗi gửi thông báo ứng tuyển mới: " + ex.Message);
                }

                // 10. Kích hoạt AI chạy nền
                string applicationIdForAi = newApplication.ApplicationID;

                _ = Task.Run(async () =>
                {
                    try
                    {
                        using var scope = _serviceScopeFactory.CreateScope();
                        var aiEvaluationService = scope.ServiceProvider.GetRequiredService<IAiEvaluationService>();

                        await aiEvaluationService.RunAiEvaluationInBackgroundAsync(
                            applicationIdForAi,
                            cvFileBytes,
                            originalFileName,
                            contentType
                        );
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Lỗi background AI: " + ex.Message);
                    }
                });

                var dataToReturn = new
                {
                    message = "Chúc mừng! Hồ sơ của bạn đã được gửi đến nhà tuyển dụng thành công.",
                    applicationId = newApplication.ApplicationID,
                    jobId = newApplication.JobID,
                    cvId = newCv.CVID,
                    cvUrl = cvUrl,
                    aiStatus = "Processing"
                };

                return (true, "Nộp CV thành công", dataToReturn);
            }
            catch (Exception ex)
            {
                string innerError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return (false, $"Lỗi hệ thống khi xử lý CV: {innerError}", null);
            }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> GetHrApplicationsAsync(ClaimsPrincipal user)
        {
            try
            {
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                var recruiter = await _context.Recruiters.AsNoTracking().FirstOrDefaultAsync(r => r.AccountID == accountId);

                if (recruiter == null)
                {
                    return (false, "Không tìm thấy thông tin Nhà tuyển dụng.", null);
                }

                var branchIds = await _context.RecruiterBranches
                    .AsNoTracking()
                    .Where(rb => rb.RecruiterID == recruiter.RecruiterID)
                    .Select(rb => rb.BranchID)
                    .ToListAsync();

                var rawApplications = await (
                    from app in _context.Applications.AsNoTracking()
                    join job in _context.JobPostings.AsNoTracking() on app.JobID equals job.JobID
                    where job.RecruiterID == recruiter.RecruiterID || string.IsNullOrEmpty(job.RecruiterID) || branchIds.Contains(job.BranchID)
                    join cv in _context.CandidateCVs.AsNoTracking() on app.CVID equals cv.CVID
                    join cand in _context.Candidates.AsNoTracking() on cv.CandidateID equals cand.CandidateID
                    join acc in _context.Accounts.AsNoTracking() on cand.AccountID equals acc.AccountID
                    join ai in _context.AIEvaluations.AsNoTracking() on app.ApplicationID equals ai.ApplicationID into aiGrp
                    from ai in aiGrp.DefaultIfEmpty()
                    join pos in _context.Positions.AsNoTracking() on job.PositionID equals pos.PositionID into posGrp
                    from pos in posGrp.DefaultIfEmpty()
                    orderby ai != null ? ai.FitScore : 0m descending
                    select new
                    {
                        id = app.ApplicationID,
                        candidateId = cand.CandidateID,
                        jobId = job.JobID,
                        jobTitle = pos != null ? pos.PositionName : "Chưa cập nhật",
                        candidateName = cand.FullName,
                        email = acc.Email,
                        accountEmail = acc.Email,
                        cvEmail = cv.ExtractedEmail,
                        cvPhone = cv.ExtractedPhone,
                        status = app.Status,
                        appliedAt = app.AppliedAt,
                        phone = cand.Phone,
                        cvUrl = cv.FilePath,
                        aiScore = ai != null ? ai.FitScore : 0,
                        aiReason = ai != null ? ai.Reason : "Chưa có đánh giá",
                        matchedSkills = ai != null ? ai.MatchedSkills : "[]",
                        missingSkills = ai != null ? ai.MissingSkills : "[]",
                        classification = ai != null ? ai.Classification : null,
                        criteriaResultsJson = ai != null ? ai.CriteriaResultsJson : null
                    }
                ).ToListAsync();

                var applications = new List<object>();

                foreach (var application in rawApplications)
                {
                    List<CriteriaScoreResult> criteriaResults = new List<CriteriaScoreResult>();
                    List<string> matchedSkillsList = new List<string>();
                    List<string> missingSkillsList = new List<string>();

                    if (string.IsNullOrWhiteSpace(application.criteriaResultsJson) == false)
                    {
                        try
                        {
                            var parsedCriteriaResults = JsonSerializer.Deserialize<List<CriteriaScoreResult>>(
                                application.criteriaResultsJson
                            );

                            if (parsedCriteriaResults != null)
                            {
                                criteriaResults = parsedCriteriaResults;
                            }
                        }
                        catch
                        {
                            criteriaResults = new List<CriteriaScoreResult>();
                        }
                    }

                    if (string.IsNullOrWhiteSpace(application.matchedSkills) == false)
                    {
                        try
                        {
                            var parsedMatchedSkills = JsonSerializer.Deserialize<List<string>>(
                                application.matchedSkills
                            );

                            if (parsedMatchedSkills != null)
                            {
                                matchedSkillsList = parsedMatchedSkills;
                            }
                        }
                        catch
                        {
                            matchedSkillsList = new List<string>();
                        }
                    }

                    if (string.IsNullOrWhiteSpace(application.missingSkills) == false)
                    {
                        try
                        {
                            var parsedMissingSkills = JsonSerializer.Deserialize<List<string>>(
                                application.missingSkills
                            );

                            if (parsedMissingSkills != null)
                            {
                                missingSkillsList = parsedMissingSkills;
                            }
                        }
                        catch
                        {
                            missingSkillsList = new List<string>();
                        }
                    }

                    var applicationItem = new
                    {
                        id = application.id,
                        candidateId = application.candidateId,
                        jobId = application.jobId,
                        jobTitle = application.jobTitle,
                        candidateName = application.candidateName,
                        email = application.email,
                        accountEmail = application.accountEmail,
                        cvEmail = application.cvEmail,
                        cvPhone = application.cvPhone,
                        status = application.status,
                        appliedAt = application.appliedAt,
                        phone = application.phone,
                        cvUrl = application.cvUrl,
                        aiScore = application.aiScore,
                        aiReason = application.aiReason,
                        matchedSkills = matchedSkillsList,
                        missingSkills = missingSkillsList,
                        classification = application.classification,
                        criteriaResults = criteriaResults
                    };

                    applications.Add(applicationItem);
                }

                return (true, "Lấy dữ liệu ứng tuyển của HR thành công", applications);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi lấy danh sách ứng tuyển: " + ex.Message, null);
            }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> GetMyApplicationsAsync(ClaimsPrincipal user)
        {
            try
            {
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrWhiteSpace(accountId) == true)
                {
                    return (false, "Không xác định được tài khoản đang đăng nhập.", null);
                }

                var candidate = await _context.Candidates
                    .FirstOrDefaultAsync(candidateItem => candidateItem.AccountID == accountId);

                if (candidate == null)
                {
                    return (false, "Không tìm thấy thông tin Ứng viên.", null);
                }

                var rawApplications = await (
                    from app in _context.Applications.AsNoTracking()
                    join cv in _context.CandidateCVs.AsNoTracking() on app.CVID equals cv.CVID
                    where cv.CandidateID == candidate.CandidateID
                    join job in _context.JobPostings.AsNoTracking() on app.JobID equals job.JobID
                    join ai in _context.AIEvaluations.AsNoTracking() on app.ApplicationID equals ai.ApplicationID into aiGrp
                    from ai in aiGrp.DefaultIfEmpty()
                    join pos in _context.Positions.AsNoTracking() on job.PositionID equals pos.PositionID into posGrp
                    from pos in posGrp.DefaultIfEmpty()
                    orderby app.AppliedAt descending
                    select new
                    {
                        id = app.ApplicationID,
                        candidateId = cv.CandidateID,
                        jobId = app.JobID,
                        cvId = cv.CVID,
                        cvUrl = cv.FilePath,
                        appliedAt = app.AppliedAt,
                        status = app.Status,
                        jobTitle = pos != null ? pos.PositionName : "Chưa cập nhật",
                        hasAiEvaluation = ai != null,
                        aiScore = ai != null ? ai.FitScore : 0,
                        aiReason = ai != null ? ai.Reason : "AI đang phân tích",
                        matchedSkills = ai != null ? ai.MatchedSkills : "[]",
                        missingSkills = ai != null ? ai.MissingSkills : "[]",
                        classification = ai != null ? ai.Classification : null,
                        criteriaResultsJson = ai != null ? ai.CriteriaResultsJson : null
                    }
                ).ToListAsync();

                var applicationIds = rawApplications.Select(item => item.id).ToList();
                var schedulesByApplicationId = await _context.InterviewSchedules
                    .AsNoTracking()
                    .Where(schedule => applicationIds.Contains(schedule.ApplicationID))
                    .ToDictionaryAsync(schedule => schedule.ApplicationID);

                var rejectionRows = await _context.TalentPoolInteractions
                    .AsNoTracking()
                    .Where(interaction => interaction.ApplicationID != null
                        && applicationIds.Contains(interaction.ApplicationID)
                        && interaction.Type == "Rejected")
                    .OrderByDescending(interaction => interaction.CreatedAt)
                    .Select(interaction => new { ApplicationID = interaction.ApplicationID!, interaction.Content, interaction.CreatedAt })
                    .ToListAsync();
                var rejectionByApplicationId = rejectionRows
                    .GroupBy(interaction => interaction.ApplicationID)
                    .ToDictionary(group => group.Key, group => group.First().Content);

                var applications = new List<object>();

                foreach (var application in rawApplications)
                {
                    List<CriteriaScoreResult> criteriaResults = new List<CriteriaScoreResult>();
                    List<string> matchedSkillsList = new List<string>();
                    List<string> missingSkillsList = new List<string>();

                    if (string.IsNullOrWhiteSpace(application.criteriaResultsJson) == false)
                    {
                        try
                        {
                            var parsedCriteriaResults = JsonSerializer.Deserialize<List<CriteriaScoreResult>>(
                                application.criteriaResultsJson
                            );

                            if (parsedCriteriaResults != null)
                            {
                                criteriaResults = parsedCriteriaResults;
                            }
                        }
                        catch
                        {
                            criteriaResults = new List<CriteriaScoreResult>();
                        }
                    }

                    if (string.IsNullOrWhiteSpace(application.matchedSkills) == false)
                    {
                        try
                        {
                            var parsedMatchedSkills = JsonSerializer.Deserialize<List<string>>(
                                application.matchedSkills
                            );

                            if (parsedMatchedSkills != null)
                            {
                                matchedSkillsList = parsedMatchedSkills;
                            }
                        }
                        catch
                        {
                            matchedSkillsList = new List<string>();
                        }
                    }

                    if (string.IsNullOrWhiteSpace(application.missingSkills) == false)
                    {
                        try
                        {
                            var parsedMissingSkills = JsonSerializer.Deserialize<List<string>>(
                                application.missingSkills
                            );

                            if (parsedMissingSkills != null)
                            {
                                missingSkillsList = parsedMissingSkills;
                            }
                        }
                        catch
                        {
                            missingSkillsList = new List<string>();
                        }
                    }

                    string aiStatus = "Processing";

                    if (application.hasAiEvaluation == true)
                    {
                        if (application.classification == "AI_ERROR")
                        {
                            aiStatus = "Failed";
                        }
                        else
                        {
                            aiStatus = "Completed";
                        }
                    }

                    string classification = "Chưa phân loại";

                    if (string.IsNullOrWhiteSpace(application.classification) == false)
                    {
                        classification = application.classification;
                    }

                    schedulesByApplicationId.TryGetValue(application.id, out var schedule);
                    rejectionByApplicationId.TryGetValue(application.id, out var rejectionFeedback);

                    var applicationItem = new
                    {
                        id = application.id,
                        applicationId = application.id,
                        candidateId = application.candidateId,
                        jobId = application.jobId,
                        cvId = application.cvId,
                        cvUrl = application.cvUrl,
                        jobTitle = application.jobTitle,
                        status = application.status,
                        appliedAt = application.appliedAt,
                        hasAiEvaluation = application.hasAiEvaluation,
                        aiStatus = aiStatus,
                        aiScore = application.aiScore,
                        aiReason = application.aiReason,
                        matchedSkills = matchedSkillsList,
                        missingSkills = missingSkillsList,
                        classification = classification,
                        criteriaResults = criteriaResults,
                        interviewSchedule = schedule != null ? new {
                            interviewDate = schedule.InterviewDate,
                            format = schedule.Format,
                            locationOrLink = schedule.LocationOrLink,
                            meetingId = schedule.MeetingID,
                            passcode = schedule.Passcode,
                            notes = schedule.Notes
                        } : null,
                        rejectionFeedback
                    };

                    applications.Add(applicationItem);
                }

                return (true, "Lấy dữ liệu thành công", applications);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi lấy lịch sử ứng tuyển: " + ex.Message, null);
            }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> UpdateApplicationStatusAsync(
            string applicationId,
            UpdateApplicationStatusRequest request,
            ClaimsPrincipal user)
        {
            try
            {
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrWhiteSpace(accountId) == true)
                {
                    return (false, "Không xác định được tài khoản đang đăng nhập.", null);
                }

                var recruiter = await _context.Recruiters
                    .FirstOrDefaultAsync(recruiterItem => recruiterItem.AccountID == accountId);

                if (recruiter == null)
                {
                    return (false, "Không tìm thấy thông tin Nhà tuyển dụng.", null);
                }

                if (request == null || string.IsNullOrWhiteSpace(request.Status) == true)
                {
                    return (false, "Trạng thái hồ sơ không hợp lệ.", null);
                }

                string newStatus = request.Status.Trim();
                bool isValidStatus = ApplicationStatuses.AllStatuses.Contains(newStatus);

                if (isValidStatus == false)
                {
                    return (false, "Trạng thái hồ sơ không nằm trong danh sách cho phép.", null);
                }

                if (newStatus == ApplicationStatuses.Rejected)
                {
                    return (false, "Vui lòng dùng chức năng Từ chối hồ sơ kèm lý do ở bước tiếp theo.", null);
                }

                var application = await _context.Applications
                    .FirstOrDefaultAsync(applicationItem => applicationItem.ApplicationID == applicationId);

                if (application == null)
                {
                    return (false, "Không tìm thấy hồ sơ ứng tuyển.", null);
                }

                var job = await _context.JobPostings
                    .FirstOrDefaultAsync(jobItem => jobItem.JobID == application.JobID);

                if (job == null)
                {
                    return (false, "Không tìm thấy tin tuyển dụng của hồ sơ này.", null);
                }

                if (job.RecruiterID != recruiter.RecruiterID)
                {
                    return (false, "Bạn không có quyền cập nhật hồ sơ ứng tuyển này.", null);
                }

                if (application.Status == "Interview" && newStatus != "Interview")
                {
                    var schedule = await _context.InterviewSchedules
                        .FirstOrDefaultAsync(s => s.ApplicationID == applicationId);
                    if (schedule != null)
                    {
                        _context.InterviewSchedules.Remove(schedule);
                    }
                }

                application.Status = newStatus;

                await _context.SaveChangesAsync();

                // Trigger notification to candidate
                try
                {
                    var cv = await _context.CandidateCVs.FindAsync(application.CVID);
                    if (cv != null)
                    {
                        var candidateItem = await _context.Candidates.FindAsync(cv.CandidateID);
                        if (candidateItem != null)
                        {
                            string positionName = "Chưa cập nhật";
                            var position = await _context.Positions.FindAsync(job.PositionID);
                            if (position != null) positionName = position.PositionName;

                            string statusText = newStatus switch
                            {
                                "Reviewing" => "Đang xem xét",
                                "Interview" => "Lên lịch phỏng vấn",
                                "Shortlisted" => "Trúng tuyển vòng hồ sơ",
                                "Accepted" => "Đạt yêu cầu (Nhận việc)",
                                _ => newStatus
                            };

                            await _notificationService.CreateNotificationAsync(
                                candidateItem.AccountID,
                                "Cập nhật trạng thái hồ sơ",
                                $"Đơn ứng tuyển vị trí {positionName} của bạn đã chuyển sang trạng thái: {statusText}",
                                "/my-applications"
                            );
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Lỗi gửi thông báo đổi trạng thái: " + ex.Message);
                }

                // Phát SignalR thông báo
                try
                {
                    await _hubContext.Clients.Group(applicationId).SendAsync("ReceiveStatusUpdate", new { applicationId, status = application.Status });
                    await _hubContext.Clients.All.SendAsync("ApplicationStatusChanged", new { applicationId, status = application.Status });
                }
                catch {}

                var dataToReturn = new
                {
                    applicationId = application.ApplicationID,
                    status = application.Status
                };

                return (true, "Cập nhật trạng thái hồ sơ thành công.", dataToReturn);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi cập nhật trạng thái hồ sơ: " + ex.Message, null);
            }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> RejectApplicationAsync(
            string applicationId,
            RejectApplicationRequest request,
            ClaimsPrincipal user)
        {
            try
            {
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrWhiteSpace(accountId) == true)
                {
                    return (false, "Không xác định được tài khoản đang đăng nhập.", null);
                }

                var recruiter = await _context.Recruiters
                    .FirstOrDefaultAsync(recruiterItem => recruiterItem.AccountID == accountId);

                if (recruiter == null)
                {
                    return (false, "Không tìm thấy thông tin Nhà tuyển dụng.", null);
                }

                if (request == null)
                {
                    return (false, "Dữ liệu từ chối hồ sơ không hợp lệ.", null);
                }

                if (string.IsNullOrWhiteSpace(request.ReasonType) == true)
                {
                    return (false, "Vui lòng chọn lý do từ chối hồ sơ.", null);
                }

                string reasonType = request.ReasonType.Trim();
                string note = "";

                if (string.IsNullOrWhiteSpace(request.Note) == false)
                {
                    note = request.Note.Trim();
                }

                var application = await _context.Applications
                    .FirstOrDefaultAsync(applicationItem => applicationItem.ApplicationID == applicationId);

                if (application == null)
                {
                    return (false, "Không tìm thấy hồ sơ ứng tuyển.", null);
                }

                var job = await _context.JobPostings
                    .FirstOrDefaultAsync(jobItem => jobItem.JobID == application.JobID);

                if (job == null)
                {
                    return (false, "Không tìm thấy tin tuyển dụng của hồ sơ này.", null);
                }

                if (job.RecruiterID != recruiter.RecruiterID)
                {
                    return (false, "Bạn không có quyền từ chối hồ sơ ứng tuyển này.", null);
                }

                var applicationCv = await _context.CandidateCVs
                    .FirstOrDefaultAsync(cvItem => cvItem.CVID == application.CVID);

                if (applicationCv == null)
                {
                    return (false, "Không tìm thấy CV của hồ sơ ứng tuyển.", null);
                }

                var candidate = await _context.Candidates
                    .FirstOrDefaultAsync(candidateItem => candidateItem.CandidateID == applicationCv.CandidateID);

                if (candidate == null)
                {
                    return (false, "Không tìm thấy thông tin ứng viên.", null);
                }

                var candidateAccount = await _context.Accounts
                    .FirstOrDefaultAsync(accountItem => accountItem.AccountID == candidate.AccountID);

                var latestCv = await _context.CandidateCVs
                    .Where(cvItem => cvItem.CandidateID == candidate.CandidateID)
                    .OrderByDescending(cvItem => cvItem.CreatedAt)
                    .FirstOrDefaultAsync();

                var aiEvaluation = await _context.AIEvaluations
                    .FirstOrDefaultAsync(aiItem => aiItem.ApplicationID == application.ApplicationID);

                string jobTitle = "Chưa cập nhật";

                var position = await _context.Positions
                    .FirstOrDefaultAsync(positionItem => positionItem.PositionID == job.PositionID);

                if (position != null)
                {
                    jobTitle = position.PositionName;
                }

                application.Status = ApplicationStatuses.Rejected;

                var talentPoolCandidate = await _context.TalentPoolCandidates
                    .FirstOrDefaultAsync(poolItem => poolItem.CandidateID == candidate.CandidateID);

                if (talentPoolCandidate == null)
                {
                    talentPoolCandidate = new TalentPoolCandidate();
                    talentPoolCandidate.CandidateID = candidate.CandidateID;
                    await _context.TalentPoolCandidates.AddAsync(talentPoolCandidate);
                }

                talentPoolCandidate.LatestCVID = latestCv != null ? latestCv.CVID : null;
                talentPoolCandidate.FullName = candidate.FullName;

                if (candidateAccount != null)
                {
                    talentPoolCandidate.Email = candidateAccount.Email;
                }
                else
                {
                    talentPoolCandidate.Email = "";
                }

                talentPoolCandidate.Phone = candidate.Phone;

                var highlightSkills = new List<string>();

                AddSkillsFromJson(highlightSkills, applicationCv.CVExtractedSkills);

                if (latestCv != null)
                {
                    AddSkillsFromJson(highlightSkills, latestCv.CVExtractedSkills);
                }

                if (aiEvaluation != null)
                {
                    AddSkillsFromJson(highlightSkills, aiEvaluation.MatchedSkills);
                }

                talentPoolCandidate.HighlightSkillsJson = JsonSerializer.Serialize(
                    highlightSkills,
                    new JsonSerializerOptions
                    {
                        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                    }
                );

                if (aiEvaluation != null)
                {
                    int fitScore = Convert.ToInt32(Math.Round(aiEvaluation.FitScore));

                    if (fitScore > talentPoolCandidate.HighestAiScore)
                    {
                        talentPoolCandidate.HighestAiScore = fitScore;
                        talentPoolCandidate.HighestScoreJobTitle = jobTitle;
                    }
                }

                talentPoolCandidate.CurrentAvailabilityStatus = "Available";
                talentPoolCandidate.LastAppliedAt = application.AppliedAt;
                talentPoolCandidate.LastUpdatedAt = DateTime.Now;
                talentPoolCandidate.Source = "Rejected";
                talentPoolCandidate.IsActive = true;

                string interactionContent = "Lý do từ chối: " + reasonType;

                if (string.IsNullOrWhiteSpace(note) == false)
                {
                    interactionContent = interactionContent + "\nGhi chú: " + note;
                }

                var interaction = new TalentPoolInteraction();
                interaction.TalentPoolCandidateID = talentPoolCandidate.TalentPoolCandidateID;
                interaction.ApplicationID = application.ApplicationID;
                interaction.JobID = application.JobID;
                interaction.Type = "Rejected";
                interaction.Title = "HR từ chối hồ sơ và đưa vào Talent Pool";
                interaction.Content = interactionContent;

                if (aiEvaluation != null)
                {
                    interaction.AiScore = Convert.ToInt32(Math.Round(aiEvaluation.FitScore));
                }

                interaction.StatusSnapshot = ApplicationStatuses.Rejected;
                interaction.CreatedByRecruiterID = recruiter.RecruiterID;
                interaction.CreatedAt = DateTime.Now;

                await _context.TalentPoolInteractions.AddAsync(interaction);

                await _context.SaveChangesAsync();

                // Trigger notification to candidate
                try
                {
                    await _notificationService.CreateNotificationAsync(
                        candidate.AccountID,
                        "Hồ sơ chưa phù hợp",
                        $"Đơn ứng tuyển vị trí {jobTitle} của bạn đã bị từ chối với lý do: {reasonType}",
                        "/my-applications"
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Lỗi gửi thông báo từ chối: " + ex.Message);
                }

                // Phát SignalR thông báo
                try
                {
                    await _hubContext.Clients.Group(applicationId).SendAsync("ReceiveStatusUpdate", new { applicationId, status = application.Status });
                    await _hubContext.Clients.All.SendAsync("ApplicationStatusChanged", new { applicationId, status = application.Status });
                }
                catch {}

                var dataToReturn = new
                {
                    applicationId = application.ApplicationID,
                    status = application.Status,
                    talentPoolCandidateId = talentPoolCandidate.TalentPoolCandidateID,
                    reasonType = reasonType
                };

                return (true, "Đã từ chối hồ sơ và đưa ứng viên vào Talent Pool.", dataToReturn);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi từ chối hồ sơ: " + ex.Message, null);
            }
        }

        private static void AddSkillsFromJson(List<string> targetSkills, string sourceText)
        {
            if (string.IsNullOrWhiteSpace(sourceText) == true)
            {
                return;
            }

            try
            {
                var skillsList = JsonSerializer.Deserialize<List<string>>(sourceText);

                if (skillsList != null)
                {
                    foreach (var skill in skillsList)
                    {
                        var cleanedSkill = skill.Trim();

                        if (cleanedSkill.Length == 0)
                        {
                            continue;
                        }

                        bool existed = targetSkills.Any(existingSkill =>
                            string.Equals(
                                existingSkill.Trim(),
                                cleanedSkill,
                                StringComparison.OrdinalIgnoreCase
                            )
                        );

                        if (!existed)
                        {
                            targetSkills.Add(cleanedSkill);
                        }
                    }

                    return;
                }
            }
            catch
            {
            }

            var separators = new char[] { ',', ';', '\n', '\r', '|', '/', '\\' };
            var rawSkills = sourceText.Split(separators, StringSplitOptions.RemoveEmptyEntries);

            foreach (var rawSkill in rawSkills)
            {
                var cleanedSkill = rawSkill.Trim();

                if (cleanedSkill.Length == 0)
                {
                    continue;
                }

                bool existed = targetSkills.Any(existingSkill =>
                    string.Equals(
                        existingSkill.Trim(),
                        cleanedSkill,
                        StringComparison.OrdinalIgnoreCase
                    )
                );

                if (!existed)
                {
                    targetSkills.Add(cleanedSkill);
                }
            }
        }
    }
}
