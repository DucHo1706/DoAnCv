using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
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

        public AiEvaluationService(
            AppDbContext context,
            IAiService aiService,
            IHubContext<AIEvaluationHub> hubContext,
            INotificationService notificationService)
        {
            _context = context;
            _aiService = aiService;
            _hubContext = hubContext;
            _notificationService = notificationService;
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

        public async Task RunAiEvaluationInBackgroundAsync(
            string applicationId,
            byte[] cvFileBytes,
            string fileName,
            string contentType,
            string? structuredCvText = null)
        {
            try
            {
                await SendProgressAsync(applicationId, 10, "START", "Khởi chạy quy trình phân tích AI...");

                var application = await _context.Applications
                    .FirstOrDefaultAsync(applicationItem => applicationItem.ApplicationID == applicationId);

                if (application == null)
                {
                    Console.WriteLine("Không tìm thấy Application để AI xử lý: " + applicationId);
                    await SendProgressAsync(applicationId, 0, "FAILED", "Không tìm thấy hồ sơ ứng tuyển.");
                    return;
                }

                var existingEvaluation = await _context.AIEvaluations
                    .FirstOrDefaultAsync(evaluation => evaluation.ApplicationID == applicationId);

                if (existingEvaluation != null)
                {
                    Console.WriteLine("Application đã có kết quả AI, bỏ qua: " + applicationId);
                    await SendProgressAsync(applicationId, 100, "COMPLETED", "Đã có kết quả AI.");
                    await _hubContext.Clients.Group(applicationId).SendAsync("ReceiveResult", new { aiStatus = "Success" });
                    return;
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
                    await _hubContext.Clients.Group(applicationId).SendAsync("ReceiveResult", new { aiStatus = "Failed", message = "Không tìm thấy tin tuyển dụng." });
                    return;
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
                    await _hubContext.Clients.Group(applicationId).SendAsync("ReceiveResult", new { aiStatus = "Failed", message = "Tin tuyển dụng chưa cấu hình tiêu chí đánh giá." });
                    return;
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

                await SendProgressAsync(applicationId, 45, "AI_CALL", "Đang phân tích và so khớp năng lực bằng Gemini AI...");

                var aiResult = string.IsNullOrWhiteSpace(structuredCvText)
                    ? await _aiService.GetMatchingScoreAsync(cvFile, jobDescriptionForAi, criteriaJson)
                    : await _aiService.GetMatchingScoreFromTextAsync(structuredCvText, jobDescriptionForAi, criteriaJson);

                await SendProgressAsync(applicationId, 80, "DATABASE_UPDATE", "Đang cập nhật hồ sơ và lưu kết quả AI vào cơ sở dữ liệu...");

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

                await SendProgressAsync(applicationId, 100, "COMPLETED", "Đã hoàn tất phân tích AI! 🎉");
                await _hubContext.Clients.Group(applicationId).SendAsync("ReceiveResult", new { aiStatus = "Success" });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Lỗi khi AI xử lý Application " + applicationId + ": " + ex.Message);

                await SaveFailedAiEvaluationAsync(
                    applicationId,
                    "AI tạm thời chưa phân tích được do dịch vụ AI đang bận hoặc lỗi kết nối. Vui lòng thử lại sau."
                );

                await SendProgressAsync(applicationId, 0, "FAILED", "Phân tích AI thất bại.");
                await _hubContext.Clients.Group(applicationId).SendAsync("ReceiveResult", new { aiStatus = "Failed", message = ex.Message });
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

    }
}
