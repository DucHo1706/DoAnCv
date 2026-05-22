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

                // 3. Gửi file CV sang Python (Gemini AI) để chấm điểm
                var aiResult = await _aiService.GetMatchingScoreAsync(request.CvFile, job.JobRequirement);

                // 4. Lưu tất cả thông tin vào Database trong một giao dịch (transaction)
                // A. Lưu file CV
                var newCv = new CandidateCV
                {
                    CVID = Guid.NewGuid().ToString(),
                    CandidateID = candidate.CandidateID,
                    FilePath = cvUrl,
                    RawText = "", // Sẽ cập nhật sau nếu cần
                    CVExtractedSkills = "[]" // Sẽ cập nhật sau nếu cần
                };
                _context.CandidateCVs.Add(newCv);

                // B. Ghi nhận đơn ứng tuyển
                var newApplication = new Application
                {
                    ApplicationID = Guid.NewGuid().ToString(),
                    JobID = request.JobId,
                    CVID = newCv.CVID
                };
                _context.Applications.Add(newApplication);

                // C. Lưu kết quả chấm điểm của AI
                var matchingResult = aiResult.MatchingResult;
                var newEvaluation = new AIEvaluation
                {
                    EvaluationID = Guid.NewGuid().ToString(),
                    ApplicationID = newApplication.ApplicationID,
                    FitScore = (decimal)(matchingResult?.Score ?? 0),
                    Reason = matchingResult?.Explanation ?? "AI không đưa ra giải thích",
                    MatchedSkills = JsonSerializer.Serialize(matchingResult?.MatchedSkills ?? new System.Collections.Generic.List<string>()),
                    MissingSkills = JsonSerializer.Serialize(matchingResult?.MissingSkills ?? new System.Collections.Generic.List<string>())
                };
                _context.AIEvaluations.Add(newEvaluation);

                await _context.SaveChangesAsync();

                // 5. Trả kết quả về cho Controller
                var dataToReturn = new
                {
                    message = "Nộp CV thành công! Trí tuệ nhân tạo đã xử lý xong hồ sơ của bạn.",
                    cvUrl,
                    aiAnalysis = aiResult
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

            var applications = await (from app in _context.Applications
                                     join job in _context.JobPostings on app.JobID equals job.JobID
                                     where job.RecruiterID == recruiter.RecruiterID
                                     join cv in _context.CandidateCVs on app.CVID equals cv.CVID
                                     join cand in _context.Candidates on cv.CandidateID equals cand.CandidateID
                                     join acc in _context.Accounts on cand.AccountID equals acc.AccountID
                                     join ai in _context.AIEvaluations on app.ApplicationID equals ai.ApplicationID into aiGrp
                                     from ai in aiGrp.DefaultIfEmpty()
                                     join pos in _context.Positions on job.PositionID equals pos.PositionID into posGrp
                                     from pos in posGrp.DefaultIfEmpty()
                                     select new { id = app.ApplicationID, jobId = job.JobID, jobTitle = pos != null ? pos.PositionName : "Chưa cập nhật", candidateName = cand.FullName, email = acc.Email, phone = cand.Phone, cvUrl = cv.FilePath, aiScore = ai != null ? ai.FitScore : 0, aiReason = ai != null ? ai.Reason : "Chưa có đánh giá", matchedSkills = ai != null ? ai.MatchedSkills : "[]", missingSkills = ai != null ? ai.MissingSkills : "[]" }).ToListAsync();

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

            var applications = await (from app in _context.Applications join cv in _context.CandidateCVs on app.CVID equals cv.CVID where cv.CandidateID == candidate.CandidateID join job in _context.JobPostings on app.JobID equals job.JobID join ai in _context.AIEvaluations on app.ApplicationID equals ai.ApplicationID into aiGrp from ai in aiGrp.DefaultIfEmpty() join pos in _context.Positions on job.PositionID equals pos.PositionID into posGrp from pos in posGrp.DefaultIfEmpty() orderby job.CreatedAt descending select new { id = app.ApplicationID, jobTitle = pos != null ? pos.PositionName : "Chưa cập nhật", aiScore = ai != null ? ai.FitScore : 0, aiReason = ai != null ? ai.Reason : "Đang chờ phân tích", matchedSkills = ai != null ? ai.MatchedSkills : "[]", missingSkills = ai != null ? ai.MissingSkills : "[]" }).ToListAsync();

            return (true, "Lấy dữ liệu thành công", applications);
        }
    }
}