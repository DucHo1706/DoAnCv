using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using RecruitmentBackend.Controllers; // For ApplyJobRequest
using RecruitmentBackend.DTOs.Responses;
using System.Text.Encodings.Web;
using System.Text.Json;

namespace RecruitmentBackend.Services
{
    public class RecruitmentService : IRecruitmentService
    {
        private readonly AppDbContext _context;
        private readonly IAiService _aiService;
        private readonly IFileService _fileService;

        public RecruitmentService(AppDbContext context, IAiService aiService, IFileService fileService)
        {
            _context = context;
            _aiService = aiService;
            _fileService = fileService;
        }

        public async Task<(bool IsSuccess, string Message, object Data)> ApplyJobAsync(ApplyJobRequest request, ClaimsPrincipal user)
        {
            try
            {
                // 1. Lấy thông tin người dùng và công việc
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var candidate = await _context.Candidates.FirstOrDefaultAsync(c => c.AccountID == accountId);
                if (candidate == null)
                {
                    return (false, "Không tìm thấy thông tin Ứng viên hợp lệ.", null);
                }

                var job = await _context.JobPostings.FindAsync(request.JobId);
                if (job == null)
                {
                    return (false, "Công việc bạn ứng tuyển không tồn tại hoặc đã hết hạn.", null);
                }

                // 2. Upload file CV lên Cloudinary
                var cvUrl = await _fileService.SaveFileAsync(request.CvFile);

                // 3. Lấy danh sách tiêu chí đánh giá CV của tin tuyển dụng
                var jobCriteria = await _context.JobCriteria
                    .Where(jobCriterion => jobCriterion.JobID == request.JobId)
                    .ToListAsync();

                if (jobCriteria == null || jobCriteria.Count == 0)
                {
                    return (false, "Tin tuyển dụng này chưa có tiêu chí đánh giá CV.", null);
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

                // 4. Gửi file CV + JD + Criteria sang Python AI để chấm điểm
                var aiResult = await _aiService.GetMatchingScoreAsync(
                    request.CvFile,
                    jobDescriptionForAi,
                    criteriaJson
                );

                // 5. Lưu tất cả thông tin vào Database trong một giao dịch (transaction)
                // A. Kiểm tra ứng viên đã nộp CV cho tin tuyển dụng này chưa
                var candidateCvList = await _context.CandidateCVs
                    .Where(cv => cv.CandidateID == candidate.CandidateID)
                    .Select(cv => cv.CVID)
                    .ToListAsync();

                if (candidateCvList.Count > 0)
                {
                    var existingApplication = await _context.Applications
                        .FirstOrDefaultAsync(application =>
                            candidateCvList.Contains(application.CVID) &&
                            application.JobID == request.JobId);

                    if (existingApplication != null)
                    {
                        return (false, "Bạn đã nộp CV cho tin tuyển dụng này rồi.", null);
                    }
                }

                var jsonSerializeOptions = new JsonSerializerOptions
                {
                    Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                };

                var certs = aiResult.MatchingResult?.ExtractedInfo?.Certificates;
                string certsJson = certs != null ? JsonSerializer.Serialize(certs) : "[]";

                // B. Lưu file CV
                var newCv = new CandidateCV
                {
                    CVID = Guid.NewGuid().ToString(),
                    CandidateID = candidate.CandidateID,
                    FilePath = cvUrl,
                    RawText = aiResult.CandidateInfo?.RawText ?? "",
                    CVExtractedSkills = aiResult.CandidateInfo?.ExtractedSkills != null ? JsonSerializer.Serialize(aiResult.CandidateInfo.ExtractedSkills, jsonSerializeOptions) : "[]",
                    Degree = aiResult.MatchingResult?.ExtractedInfo?.Degree,
                    Major = aiResult.MatchingResult?.ExtractedInfo?.Major,
                    University = aiResult.MatchingResult?.ExtractedInfo?.University,
                    YearsOfExperience = aiResult.MatchingResult?.ExtractedInfo?.YearsOfExperience ?? 0,
                    Certificates = certsJson
                };

                _context.CandidateCVs.Add(newCv);

                // C. Ghi nhận đơn ứng tuyển
                var newApplication = new Application
                {
                    ApplicationID = Guid.NewGuid().ToString(),
                    JobID = request.JobId,
                    CVID = newCv.CVID
                };

                _context.Applications.Add(newApplication);

                // C. Lưu kết quả chấm điểm của AI
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

                var newEvaluation = new AIEvaluation
                {
                    EvaluationID = Guid.NewGuid().ToString(),
                    ApplicationID = newApplication.ApplicationID,
                    FitScore = (decimal)totalScore,
                    Reason = aiReason,
                    MatchedSkills = JsonSerializer.Serialize(matchedSkills, jsonSerializeOptions),
                    MissingSkills = JsonSerializer.Serialize(missingSkills, jsonSerializeOptions),
                    Classification = matchingResult?.Classification,
                    CriteriaResultsJson = JsonSerializer.Serialize(matchingResult?.CriteriaResults ?? new List<CriteriaScoreResult>(), jsonSerializeOptions)
                };
                _context.AIEvaluations.Add(newEvaluation);

                await _context.SaveChangesAsync();

                // 6. Trả kết quả đã chuẩn hóa về cho Controller
                var dataToReturn = new
                {
                    message = "Nộp CV thành công! Trí tuệ nhân tạo đã xử lý xong hồ sơ của bạn.",
                    applicationId = newApplication.ApplicationID,
                    jobId = newApplication.JobID,
                    cvUrl = cvUrl,
                    aiScore = totalScore,
                    aiReason = aiReason,
                    matchedSkills = matchedSkills,
                    missingSkills = missingSkills,
                    classification = matchingResult?.Classification,
                    criteriaResults = matchingResult?.CriteriaResults
                };

                return (true, "Nộp CV thành công", dataToReturn);
            }
            catch (Exception ex)
            {
                var innerError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                // Ghi log lỗi ở đây (nếu có hệ thống log)
                return (false, $"Lỗi hệ thống khi xử lý CV: {innerError}", null);
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
                    email = acc.Email,
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

                var applicationItem = new
                {
                    id = application.id,
                    candidateId = application.candidateId,
                    jobId = application.jobId,
                    jobTitle = application.jobTitle,
                    candidateName = application.candidateName,
                    email = application.email,
                    phone = application.phone,
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
            var candidate = await _context.Candidates.FirstOrDefaultAsync(c => c.AccountID == accountId);
            if (candidate == null)
            {
                return (false, "Không tìm thấy thông tin Ứng viên.", null);
            }

            var rawApplications = await (from app in _context.Applications join cv in _context.CandidateCVs on app.CVID equals cv.CVID where cv.CandidateID == candidate.CandidateID join job in _context.JobPostings on app.JobID equals job.JobID join ai in _context.AIEvaluations on app.ApplicationID equals ai.ApplicationID into aiGrp from ai in aiGrp.DefaultIfEmpty() join pos in _context.Positions on job.PositionID equals pos.PositionID into posGrp from pos in posGrp.DefaultIfEmpty() orderby job.CreatedAt descending select new { id = app.ApplicationID, candidateId = cv.CandidateID, jobTitle = pos != null ? pos.PositionName : "Chưa cập nhật", aiScore = ai != null ? ai.FitScore : 0, aiReason = ai != null ? ai.Reason : "Đang chờ phân tích", matchedSkills = ai != null ? ai.MatchedSkills : "[]", missingSkills = ai != null ? ai.MissingSkills : "[]", classification = ai != null ? ai.Classification : null, criteriaResultsJson = ai != null ? ai.CriteriaResultsJson : null }).ToListAsync();

            var applications = new List<object>();
            foreach (var app in rawApplications)
            {
                List<CriteriaScoreResult> criteriaResults = new List<CriteriaScoreResult>();
                if (!string.IsNullOrWhiteSpace(app.criteriaResultsJson))
                {
                    try { criteriaResults = JsonSerializer.Deserialize<List<CriteriaScoreResult>>(app.criteriaResultsJson) ?? new List<CriteriaScoreResult>(); }
                    catch { }
                }
                
                List<string> matchedSkillsList = new List<string>();
                if (!string.IsNullOrWhiteSpace(app.matchedSkills))
                {
                    try { matchedSkillsList = JsonSerializer.Deserialize<List<string>>(app.matchedSkills) ?? new List<string>(); }
                    catch { }
                }
                
                List<string> missingSkillsList = new List<string>();
                if (!string.IsNullOrWhiteSpace(app.missingSkills))
                {
                    try { missingSkillsList = JsonSerializer.Deserialize<List<string>>(app.missingSkills) ?? new List<string>(); }
                    catch { }
                }

                applications.Add(new {
                    id = app.id,
                    candidateId = app.candidateId,
                    jobTitle = app.jobTitle,
                    aiScore = app.aiScore,
                    aiReason = app.aiReason,
                    matchedSkills = matchedSkillsList,
                    missingSkills = missingSkillsList,
                    classification = app.classification ?? "Chưa phân loại",
                    criteriaResults = criteriaResults
                });
            }

            return (true, "Lấy dữ liệu thành công", applications);
        }
    }
}