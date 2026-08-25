using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
using RecruitmentBackend.Constants;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Threading.Tasks;
using System.Net.Http;
using Microsoft.AspNetCore.SignalR;
using RecruitmentBackend.Hubs;

namespace RecruitmentBackend.Services
{
    public class AiEvaluationService : IAiEvaluationService
    {
        private readonly AppDbContext _context;
        private readonly IAiService _aiService;
        private readonly IHubContext<AIEvaluationHub> _hubContext;
        private readonly INotificationService _notificationService;
        private readonly ISkillObservationService _skillObservationService;

        public AiEvaluationService(
            AppDbContext context,
            IAiService aiService,
            IHubContext<AIEvaluationHub> hubContext,
            INotificationService notificationService,
            ISkillObservationService skillObservationService)
        {
            _context = context;
            _aiService = aiService;
            _hubContext = hubContext;
            _notificationService = notificationService;
            _skillObservationService = skillObservationService;
        }

        private async Task SendProgressAsync(string applicationId, int progress, string stage, string messageStr = "")
        {
            try
            {
                await _hubContext.Clients.Group(applicationId).SendAsync("ReceiveProgress", new
                {
                    progress,
                    stage,
                    message = messageStr
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SignalR Error] Could not send progress to group {applicationId}: {ex.Message}");
            }
        }

        private async Task SendResultAsync(string applicationId, string aiStatus, string? errorMessage = null)
        {
            try
            {
                await _hubContext.Clients.Group(applicationId).SendAsync("ReceiveResult", new
                {
                    aiStatus,
                    message = errorMessage
                });

                string? jobId = await _context.Applications
                    .AsNoTracking()
                    .Where(application => application.ApplicationID == applicationId)
                    .Select(application => application.JobID)
                    .FirstOrDefaultAsync();

                await _hubContext.Clients.All.SendAsync("ApplicationAnalysisChanged", new
                {
                    applicationId,
                    jobId,
                    aiStatus
                });
            }
            catch (Exception signalRException)
            {
                Console.WriteLine($"[SignalR Error] Không thể phát kết quả hồ sơ {applicationId}: {signalRException.Message}");
            }
        }

        public async Task RunAiEvaluationInBackgroundAsync(
            string applicationId,
            byte[] cvFileBytes,
            string fileName,
            string contentType,
            string? structuredCvText = null)
        {
            await RunAiEvaluationJobAsync(
                applicationId,
                cvFileBytes,
                fileName,
                contentType,
                structuredCvText);
        }

        public async Task<AiEvaluationRunResult> RunAiEvaluationJobAsync(
            string applicationId,
            byte[] cvFileBytes,
            string fileName,
            string contentType,
            string? structuredCvText = null)
        {
            try
            {
                await SendProgressAsync(applicationId, 10, "START", "Bắt đầu phân tích hồ sơ bằng AI...");

                var application = await _context.Applications
                    .FirstOrDefaultAsync(applicationItem => applicationItem.ApplicationID == applicationId);

                if (application == null)
                {
                    await SendProgressAsync(applicationId, 0, "FAILED", "Không tìm thấy hồ sơ ứng tuyển.");
                    return new AiEvaluationRunResult(
                        AiEvaluationRunOutcome.PermanentFailed,
                        "APPLICATION_NOT_FOUND",
                        "Không tìm thấy hồ sơ ứng tuyển.");
                }

                if (application.Status == ApplicationStatuses.Withdrawn)
                {
                    await SendProgressAsync(applicationId, 0, "CANCELLED", "Hồ sơ đã được rút trước khi AI bắt đầu phân tích.");
                    await SendResultAsync(applicationId, "Cancelled");
                    return new AiEvaluationRunResult(AiEvaluationRunOutcome.Cancelled);
                }

                var existingEvaluation = await _context.AIEvaluations
                    .FirstOrDefaultAsync(evaluation => evaluation.ApplicationID == applicationId);

                if (existingEvaluation != null)
                {
                    await SendProgressAsync(applicationId, 100, "COMPLETED", "Đã có kết quả AI.");
                    await SendResultAsync(applicationId, "Success");
                    return new AiEvaluationRunResult(AiEvaluationRunOutcome.AlreadyCompleted);
                }

                var job = await _context.JobPostings
                    .FirstOrDefaultAsync(jobItem => jobItem.JobID == application.JobID);

                if (job == null)
                {
                    await SaveFailedAiEvaluationAsync(
                        applicationId,
                        "Không tìm thấy tin tuyển dụng để AI phân tích."
                    );
                    await SendProgressAsync(applicationId, 0, "FAILED", "Không tìm thấy tin tuyển dụng.");
                    await SendResultAsync(applicationId, "Failed", "Không tìm thấy tin tuyển dụng.");
                    return new AiEvaluationRunResult(
                        AiEvaluationRunOutcome.PermanentFailed,
                        "JOB_NOT_FOUND",
                        "Không tìm thấy tin tuyển dụng.");
                }

                var jobCriteria = await _context.JobCriteria
                    .Where(jobCriterion => jobCriterion.JobID == application.JobID && jobCriterion.IsActive)
                    .OrderBy(jobCriterion => jobCriterion.DisplayOrder)
                    .ToListAsync();

                if (jobCriteria == null || jobCriteria.Count == 0)
                {
                    await SaveFailedAiEvaluationAsync(
                        applicationId,
                        "Tin tuyển dụng này chưa có tiêu chí đánh giá CV."
                    );
                    await SendProgressAsync(applicationId, 0, "FAILED", "Tin tuyển dụng chưa cấu hình tiêu chí.");
                    await SendResultAsync(applicationId, "Failed", "Tin tuyển dụng chưa cấu hình tiêu chí đánh giá.");
                    return new AiEvaluationRunResult(
                        AiEvaluationRunOutcome.PermanentFailed,
                        "JOB_CRITERIA_MISSING",
                        "Tin tuyển dụng chưa cấu hình tiêu chí đánh giá.");
                }

                var criteriaForAi = new List<object>();

                foreach (var criterion in jobCriteria)
                {
                    var criterionItem = new
                    {
                        name = criterion.Name,
                        weight = criterion.Weight,
                        criterionType = criterion.CriterionType,
                        priorityLevel = criterion.PriorityLevel,
                        @operator = criterion.Operator,
                        targetValue = criterion.TargetValue,
                        minDurationMonths = criterion.MinDurationMonths,
                        evidenceSources = criterion.EvidenceSources,
                        evaluationGuidance = criterion.EvaluationGuidance
                    };

                    criteriaForAi.Add(criterionItem);
                }

                string criteriaJson = JsonSerializer.Serialize(criteriaForAi);
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

                await SendProgressAsync(applicationId, 45, "AI_CALL", "Đang phân tích và so khớp năng lực...");

                var aiResult = string.IsNullOrWhiteSpace(structuredCvText)
                    ? await _aiService.GetMatchingScoreAsync(cvFile, jobDescriptionForAi, criteriaJson)
                    : await _aiService.GetMatchingScoreFromTextAsync(structuredCvText, jobDescriptionForAi, criteriaJson);

                await _context.Entry(application).ReloadAsync();
                if (application.Status == ApplicationStatuses.Withdrawn)
                {
                    await SendProgressAsync(applicationId, 0, "CANCELLED", "Hồ sơ đã được rút nên kết quả AI không được lưu.");
                    await SendResultAsync(applicationId, "Cancelled");
                    return new AiEvaluationRunResult(AiEvaluationRunOutcome.Cancelled);
                }

                await SendProgressAsync(applicationId, 80, "DATABASE_UPDATE", "Đang lưu kết quả phân tích AI...");

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

                if (aiResult.JobExtractedSkills != null && aiResult.JobExtractedSkills.Count > 0)
                {
                    job.JDExtractedSkills = JsonSerializer.Serialize(
                        aiResult.JobExtractedSkills,
                        jsonSerializeOptions);
                }

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

                try
                {
                    await _skillObservationService.RecordAsync(
                        application.CVID,
                        job.JobID,
                        aiResult.CandidateInfo?.SkillObservations,
                        aiResult.JobSkillObservations);
                }
                catch (Exception observationException)
                {
                    // Hàng quan sát là dữ liệu bổ sung; lỗi ghi nhận không được
                    // biến một kết quả chấm điểm đã lưu thành thất bại giả.
                    Console.WriteLine(
                        $"[Skill Observation Warning] Không thể ghi nhận skill mới: {observationException.GetType().Name}");
                }

                // Trigger notification to candidate that AI evaluation is completed
                try
                {
                    var candidate = await _context.Candidates.FindAsync(application.CandidateCV.CandidateID);
                    if (candidate != null)
                    {
                        string positionName = "Chưa cập nhật";
                        if (job != null)
                        {
                            var position = await _context.Positions.FindAsync(job.PositionID);
                            if (position != null) positionName = position.PositionName;
                        }

                        int fitScore = Convert.ToInt32(Math.Round(newEvaluation.FitScore));

                        await _notificationService.CreateNotificationAsync(
                            candidate.AccountID,
                            "Phân tích AI hoàn tất",
                            $"AI đã hoàn tất chấm điểm hồ sơ vị trí {positionName} của bạn. Điểm tương hợp: {fitScore}%",
                            "/my-applications"
                        );
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Lỗi gửi thông báo AI hoàn tất: " + ex.Message);
                }

                await SendProgressAsync(applicationId, 100, "COMPLETED", "Đã hoàn tất phân tích AI.");
                await SendResultAsync(applicationId, "Success");
                return new AiEvaluationRunResult(AiEvaluationRunOutcome.Completed);
            }
            catch (Exception ex)
            {
                var failure = ClassifyFailure(ex);
                Console.WriteLine(
                    $"[AI Evaluation] Application {applicationId} failed with {failure.ErrorCode} ({ex.GetType().Name}).");

                if (failure.Outcome == AiEvaluationRunOutcome.PermanentFailed)
                {
                    await SaveFailedAiEvaluationAsync(applicationId, failure.ErrorMessage!);
                    await SendProgressAsync(applicationId, 0, "FAILED", failure.ErrorMessage!);
                    await SendResultAsync(applicationId, "Failed", failure.ErrorMessage);
                }
                else
                {
                    await SendProgressAsync(
                        applicationId,
                        0,
                        "RETRY_SCHEDULED",
                        "Dịch vụ AI tạm thời chưa khả dụng. Hệ thống sẽ tự thử lại.");
                }

                return failure;
            }
        }

        private static AiEvaluationRunResult ClassifyFailure(Exception exception)
        {
            var message = exception.ToString().ToLowerInvariant();
            var isAuthenticationFailure = message.Contains("401")
                || message.Contains("403")
                || message.Contains("unauthorized")
                || message.Contains("forbidden")
                || message.Contains("authentication")
                || message.Contains("xác thực");
            if (isAuthenticationFailure)
            {
                return new AiEvaluationRunResult(
                    AiEvaluationRunOutcome.PermanentFailed,
                    "AI_PROVIDER_AUTHENTICATION_FAILED",
                    "Dịch vụ AI chưa xác thực được tài khoản cung cấp. Quản trị hệ thống cần đăng nhập lại tài khoản 9Router.");
            }

            var isPermanentRequestFailure = message.Contains("400")
                || message.Contains("invalid_argument")
                || message.Contains("unsupported media")
                || message.Contains("invalid cv")
                || message.Contains("tệp không hợp lệ");
            if (isPermanentRequestFailure)
            {
                return new AiEvaluationRunResult(
                    AiEvaluationRunOutcome.PermanentFailed,
                    "AI_INVALID_REQUEST",
                    "AI không thể xử lý nội dung CV hoặc cấu hình đánh giá hiện tại.");
            }

            var isTransient = exception is TimeoutException
                || exception is TaskCanceledException
                || exception is HttpRequestException
                || message.Contains("429")
                || message.Contains("500")
                || message.Contains("502")
                || message.Contains("503")
                || message.Contains("504")
                || message.Contains("timeout")
                || message.Contains("timed out")
                || message.Contains("unavailable")
                || message.Contains("quota")
                || message.Contains("network")
                || message.Contains("kết nối")
                || message.Contains("đang bận");

            return new AiEvaluationRunResult(
                isTransient
                    ? AiEvaluationRunOutcome.TransientFailed
                    : AiEvaluationRunOutcome.PermanentFailed,
                isTransient ? "AI_SERVICE_TEMPORARY" : "AI_PROCESSING_FAILED",
                isTransient
                    ? "Dịch vụ AI tạm thời chưa khả dụng. Hệ thống sẽ tự thử lại có giới hạn."
                    : "AI không thể hoàn tất phân tích hồ sơ này.");
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

    }
}
