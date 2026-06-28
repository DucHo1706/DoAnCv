using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecruitmentBackend.Controllers;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Threading.Tasks;
using RecruitmentBackend.Constants;
using RecruitmentBackend.DTOs.Requests;

namespace RecruitmentBackend.Services
{
    public class RecruitmentService : IRecruitmentService
    {
        private readonly AppDbContext _context;
        private readonly IAiService _aiService;
        private readonly IFileService _fileService;
        private readonly IServiceScopeFactory _serviceScopeFactory;

        public RecruitmentService(
            AppDbContext context,
            IAiService aiService,
            IFileService fileService,
            IServiceScopeFactory serviceScopeFactory)
        {
            _context = context;
            _aiService = aiService;
            _fileService = fileService;
            _serviceScopeFactory = serviceScopeFactory;
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

                // 6. Copy file CV vào bộ nhớ để background task dùng lại sau khi request kết thúc
                byte[] cvFileBytes;

                using (var memoryStream = new MemoryStream())
                {
                    await request.CvFile.CopyToAsync(memoryStream);
                    cvFileBytes = memoryStream.ToArray();
                }

                string originalFileName = request.CvFile.FileName;
                string contentType = request.CvFile.ContentType;

                // 7. Upload file CV
                string cvUrl = await _fileService.SaveFileAsync(request.CvFile);

                // 8. Lưu thông tin CV vào database trước
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

                // 10. Kích hoạt AI chạy nền
                string applicationIdForAi = newApplication.ApplicationID;

                _ = Task.Run(async () =>
                {
                    try
                    {
                        using var scope = _serviceScopeFactory.CreateScope();

                        var recruitmentService = scope.ServiceProvider
                            .GetRequiredService<IRecruitmentService>();

                        await recruitmentService.RunAiEvaluationInBackgroundAsync(
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

                // 11. Trả kết quả ngay cho frontend
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
                string innerError;

                if (ex.InnerException != null)
                {
                    innerError = ex.InnerException.Message;
                }
                else
                {
                    innerError = ex.Message;
                }

                return (false, $"Lỗi hệ thống khi xử lý CV: {innerError}", null);
            }
        }

        public async Task RunAiEvaluationInBackgroundAsync(string applicationId, byte[] cvFileBytes, string fileName, string contentType)
        {
            try
            {
                // 1. Kiểm tra Application có tồn tại không
                var application = await _context.Applications
                    .FirstOrDefaultAsync(applicationItem => applicationItem.ApplicationID == applicationId);

                if (application == null)
                {
                    Console.WriteLine("Không tìm thấy Application để AI xử lý: " + applicationId);
                    return;
                }

                // 2. Nếu đã có AIEvaluation rồi thì không chấm lại
                var existingEvaluation = await _context.AIEvaluations
                    .FirstOrDefaultAsync(evaluation => evaluation.ApplicationID == applicationId);

                if (existingEvaluation != null)
                {
                    Console.WriteLine("Application đã có kết quả AI, bỏ qua: " + applicationId);
                    return;
                }

                // 3. Lấy thông tin tin tuyển dụng
                var job = await _context.JobPostings
                    .FirstOrDefaultAsync(jobItem => jobItem.JobID == application.JobID);

                if (job == null)
                {
                    await SaveFailedAiEvaluationAsync(
                        applicationId,
                        "Không tìm thấy tin tuyển dụng để AI phân tích."
                    );

                    return;
                }

                // 4. Lấy tiêu chí chấm điểm của tin tuyển dụng
                var jobCriteria = await _context.JobCriteria
                    .Where(jobCriterion => jobCriterion.JobID == application.JobID)
                    .ToListAsync();

                if (jobCriteria == null || jobCriteria.Count == 0)
                {
                    await SaveFailedAiEvaluationAsync(
                        applicationId,
                        "Tin tuyển dụng này chưa có tiêu chí đánh giá CV."
                    );

                    return;
                }

                var criteriaForAi = new List<object>();

                foreach (var criterion in jobCriteria)
                {
                    var criterionItem = new
                    {
                        name = criterion.Name,
                        weight = criterion.Weight
                    };

                    criteriaForAi.Add(criterionItem);
                }

                string criteriaJson = JsonSerializer.Serialize(criteriaForAi);

                // 5. Ghép mô tả công việc và yêu cầu công việc để gửi sang AI
                string jobDescriptionForAi = "";

                if (string.IsNullOrWhiteSpace(job.JobDescription) == false)
                {
                    jobDescriptionForAi = jobDescriptionForAi + job.JobDescription;
                }

                if (string.IsNullOrWhiteSpace(job.JobRequirement) == false)
                {
                    if (string.IsNullOrWhiteSpace(jobDescriptionForAi) == false)
                    {
                        jobDescriptionForAi = jobDescriptionForAi + "\n";
                    }

                    jobDescriptionForAi = jobDescriptionForAi + job.JobRequirement;
                }

                // 6. Tạo lại IFormFile từ byte[] để gửi sang Python AI
                using var memoryStream = new MemoryStream(cvFileBytes);

                var headers = new HeaderDictionary();

                if (string.IsNullOrWhiteSpace(contentType) == false)
                {
                    headers["Content-Type"] = contentType;
                }

                var cvFile = new FormFile(
                    memoryStream,
                    0,
                    cvFileBytes.Length,
                    "file",
                    fileName
                )
                {
                    Headers = headers,
                    ContentType = contentType
                };

                // 7. Gọi Python AI
                var aiResult = await _aiService.GetMatchingScoreAsync(
                    cvFile,
                    jobDescriptionForAi,
                    criteriaJson
                );

                var matchingResult = aiResult.MatchingResult;

                double totalScore = 0;
                string aiReason = "AI không đưa ra giải thích";

                List<string> matchedSkills = new List<string>();
                List<string> missingSkills = new List<string>();

                if (matchingResult != null)
                {
                    if (matchingResult.TotalScore.HasValue == true)
                    {
                        totalScore = matchingResult.TotalScore.Value;
                    }
                    else if (matchingResult.Score.HasValue == true)
                    {
                        totalScore = matchingResult.Score.Value;
                    }

                    if (string.IsNullOrWhiteSpace(matchingResult.Summary) == false)
                    {
                        aiReason = matchingResult.Summary;
                    }
                    else if (string.IsNullOrWhiteSpace(matchingResult.Explanation) == false)
                    {
                        aiReason = matchingResult.Explanation;
                    }

                    if (matchingResult.MatchedSkills != null)
                    {
                        matchedSkills = matchingResult.MatchedSkills;
                    }

                    if (matchingResult.MissingSkills != null)
                    {
                        missingSkills = matchingResult.MissingSkills;
                    }
                }

                var jsonSerializeOptions = new JsonSerializerOptions
                {
                    Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                };

                string classification = "Chưa phân loại";

                if (matchingResult != null && string.IsNullOrWhiteSpace(matchingResult.Classification) == false)
                {
                    classification = matchingResult.Classification;
                }

                var criteriaResults = new List<CriteriaScoreResult>();

                if (matchingResult != null && matchingResult.CriteriaResults != null)
                {
                    criteriaResults = matchingResult.CriteriaResults;
                }

                // 8. Cập nhật lại thông tin trích xuất vào CandidateCV nếu có
                var candidateCv = await _context.CandidateCVs
                    .FirstOrDefaultAsync(candidateCvItem => candidateCvItem.CVID == application.CVID);

                if (candidateCv != null)
                {
                    candidateCv.RawText = aiResult.CandidateInfo?.RawText ?? "";
                    candidateCv.ExtractedEmail = aiResult.CandidateInfo?.Email;
                    candidateCv.ExtractedPhone = aiResult.CandidateInfo?.Phone;
                    candidateCv.CVExtractedSkills = aiResult.CandidateInfo?.ExtractedSkills != null
                        ? JsonSerializer.Serialize(aiResult.CandidateInfo.ExtractedSkills, jsonSerializeOptions)
                        : "[]";

                    var certs = matchingResult?.ExtractedInfo?.Certificates;
                    candidateCv.Certificates = certs != null
                        ? JsonSerializer.Serialize(certs, jsonSerializeOptions)
                        : "[]";

                    candidateCv.Degree = matchingResult?.ExtractedInfo?.Degree;
                    candidateCv.Major = matchingResult?.ExtractedInfo?.Major;
                    candidateCv.University = matchingResult?.ExtractedInfo?.University;
                    candidateCv.YearsOfExperience = matchingResult?.ExtractedInfo?.YearsOfExperience ?? 0;
                }

                // 9. Lưu kết quả AI vào database
                var newEvaluation = new AIEvaluation
                {
                    EvaluationID = Guid.NewGuid().ToString(),
                    ApplicationID = applicationId,
                    FitScore = (decimal)totalScore,
                    Reason = aiReason,
                    MatchedSkills = JsonSerializer.Serialize(matchedSkills, jsonSerializeOptions),
                    MissingSkills = JsonSerializer.Serialize(missingSkills, jsonSerializeOptions),
                    Classification = classification,
                    CriteriaResultsJson = JsonSerializer.Serialize(criteriaResults, jsonSerializeOptions),
                    EvaluatedAt = DateTime.Now
                };

                _context.AIEvaluations.Add(newEvaluation);

                await _context.SaveChangesAsync();

                Console.WriteLine("AI đã chấm xong Application: " + applicationId);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Lỗi khi AI xử lý Application " + applicationId + ": " + ex.Message);

                await SaveFailedAiEvaluationAsync(
                    applicationId,
                    "AI tạm thời chưa phân tích được do dịch vụ AI đang bận hoặc lỗi kết nối. Vui lòng thử lại sau."
                );
            }
        }

        private async Task SaveFailedAiEvaluationAsync(string applicationId, string reason)
        {
            try
            {
                var existingEvaluation = await _context.AIEvaluations
                    .FirstOrDefaultAsync(evaluation => evaluation.ApplicationID == applicationId);

                if (existingEvaluation != null)
                {
                    return;
                }

                var jsonSerializeOptions = new JsonSerializerOptions
                {
                    Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                };

                var failedEvaluation = new AIEvaluation
                {
                    EvaluationID = Guid.NewGuid().ToString(),
                    ApplicationID = applicationId,
                    FitScore = 0,
                    Reason = reason,
                    MatchedSkills = JsonSerializer.Serialize(new List<string>(), jsonSerializeOptions),
                    MissingSkills = JsonSerializer.Serialize(new List<string>(), jsonSerializeOptions),
                    Classification = "AI_ERROR",
                    CriteriaResultsJson = JsonSerializer.Serialize(new List<CriteriaScoreResult>(), jsonSerializeOptions),
                    EvaluatedAt = DateTime.Now
                };

                _context.AIEvaluations.Add(failedEvaluation);

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Không thể lưu trạng thái lỗi AI: " + ex.Message);
            }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> GetHrApplicationsAsync(ClaimsPrincipal user)
        {
            string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var recruiter = await _context.Recruiters.FirstOrDefaultAsync(r => r.AccountID == accountId);

            if (recruiter == null)
            {
                return (false, "Không tìm thấy thông tin Nhà tuyển dụng.", null);
            }

            var rawApplications = await (
                from app in _context.Applications
                join job in _context.JobPostings on app.JobID equals job.JobID
                where job.RecruiterID == recruiter.RecruiterID
                join cv in _context.CandidateCVs on app.CVID equals cv.CVID
                join cand in _context.Candidates on cv.CandidateID equals cand.CandidateID
                join acc in _context.Accounts on cand.AccountID equals acc.AccountID
                join ai in _context.AIEvaluations on app.ApplicationID equals ai.ApplicationID into aiGrp
                from ai in aiGrp.DefaultIfEmpty()
                join pos in _context.Positions on job.PositionID equals pos.PositionID into posGrp
                from pos in posGrp.DefaultIfEmpty()
                orderby ai != null ? ai.FitScore : 0m descending
                select new
                {
                    id = app.ApplicationID,
                    candidateId = cand.CandidateID,
                    jobId = job.JobID,
                    jobTitle = pos != null ? pos.PositionName : "Chưa cập nhật",
                    candidateName = cand.FullName,
                    email = acc.Email, // Giữ tạm field cũ để frontend cũ không bị vỡ
                    accountEmail = acc.Email, // Email tài khoản ứng viên

                    // Email/phone bóc từ CV
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
                        var parsedMatched = JsonSerializer.Deserialize<List<string>>(application.matchedSkills);
                        if (parsedMatched != null) matchedSkillsList = parsedMatched;
                    }
                    catch { }
                }
                if (string.IsNullOrWhiteSpace(application.missingSkills) == false)
                {
                    try
                    {
                        var parsedMissing = JsonSerializer.Deserialize<List<string>>(application.missingSkills);
                        if (parsedMissing != null) missingSkillsList = parsedMissing;
                    }
                    catch { }
                }

                string accountEmail = application.accountEmail ?? "";
                string cvEmail = application.cvEmail ?? "";

                accountEmail = accountEmail.Trim();
                cvEmail = cvEmail.Trim();

                bool hasCvEmail = string.IsNullOrWhiteSpace(cvEmail) == false;
                bool hasAccountEmail = string.IsNullOrWhiteSpace(accountEmail) == false;

                bool isDifferentEmail =
                    hasCvEmail &&
                    hasAccountEmail &&
                    string.Equals(cvEmail, accountEmail, StringComparison.OrdinalIgnoreCase) == false;

                string suggestedToEmail = hasCvEmail ? cvEmail : accountEmail;
                string suggestedCcEmail = isDifferentEmail ? accountEmail : "";

                var applicationItem = new
                {
                    id = application.id,
                    candidateId = application.candidateId,
                    jobId = application.jobId,
                    jobTitle = application.jobTitle,
                    candidateName = application.candidateName,
                    status = application.status,
                    appliedAt = application.appliedAt,
                    email = application.email,
                    accountEmail = accountEmail,
                    cvEmail = cvEmail,
                    suggestedToEmail = suggestedToEmail,
                    suggestedCcEmail = suggestedCcEmail,
                    phone = application.phone,
                    cvPhone = application.cvPhone,
                    cvUrl = application.cvUrl,
                    aiScore = application.aiScore,
                    aiReason = application.aiReason,
                    matchedSkills = matchedSkillsList, 
                    missingSkills = missingSkillsList,    
                    classification = string.IsNullOrWhiteSpace(application.classification) == false
                        ? application.classification
                        : "Chưa phân loại",
                    criteriaResults = criteriaResults
                };

                applications.Add(applicationItem);
            }

            return (true, "Lấy dữ liệu thành công", applications);
        }

        public async Task<(bool IsSuccess, string Message, object Data)> GetMyApplicationsAsync(ClaimsPrincipal user)
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
                from app in _context.Applications
                join cv in _context.CandidateCVs on app.CVID equals cv.CVID
                where cv.CandidateID == candidate.CandidateID
                join job in _context.JobPostings on app.JobID equals job.JobID
                join ai in _context.AIEvaluations on app.ApplicationID equals ai.ApplicationID into aiGrp
                from ai in aiGrp.DefaultIfEmpty()
                join pos in _context.Positions on job.PositionID equals pos.PositionID into posGrp
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
                    criteriaResults = criteriaResults
                };

                applications.Add(applicationItem);
            }

            return (true, "Lấy dữ liệu thành công", applications);
        }

        public async Task<(bool IsSuccess, string Message, object Data)> UpdateApplicationStatusAsync(string applicationId, UpdateApplicationStatusRequest request, ClaimsPrincipal user)
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

                /*
                    Lưu ý:
                    Rejected sẽ làm ở bước 2 vì cần bắt buộc nhập lý do từ chối
                    và đẩy ứng viên vào Talent Pool.
                    Vì vậy ở bước 1 tạm thời không cho cập nhật Rejected bằng API status thường.
                */
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

                application.Status = newStatus;

                await _context.SaveChangesAsync();

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

        public async Task<(bool IsSuccess, string Message, object Data)> RejectApplicationAsync(string applicationId, RejectApplicationRequest request, ClaimsPrincipal user)
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
        private void AddSkillsFromJson(List<string> targetSkills, string? sourceText)
        {
            if (string.IsNullOrWhiteSpace(sourceText))
            {
                return;
            }

            try
            {
                var parsedSkills = JsonSerializer.Deserialize<List<string>>(sourceText);

                if (parsedSkills != null)
                {
                    foreach (var skill in parsedSkills)
                    {
                        if (string.IsNullOrWhiteSpace(skill))
                        {
                            continue;
                        }

                        var cleanedSkill = skill.Trim();

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