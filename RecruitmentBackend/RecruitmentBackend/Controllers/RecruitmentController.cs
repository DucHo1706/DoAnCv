using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecruitmentController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IFileService _fileService;
        private readonly IAiService _aiService;

        public RecruitmentController(AppDbContext context, IFileService fileService, IAiService aiService)
        {
            _context = context;
            _fileService = fileService;
            _aiService = aiService;
        }

        [HttpPost("apply")]
        public async Task<IActionResult> Apply([FromForm] SubmitCvRequest request)
        {
            var job = await _context.Jobs.FindAsync(request.JobId);
            if (job == null || !job.IsActive || !job.IsApproved)
                return BadRequest("Công việc này không tồn tại hoặc hiện đang tạm đóng.");
            if (job.Deadline.HasValue && DateTime.UtcNow > job.Deadline.Value)
            {
                return BadRequest($"Rất tiếc, vị trí này đã hết hạn nộp hồ sơ vào ngày {job.Deadline.Value:dd/MM/yyyy}.");
            }
            int currentCvCount = await _context.CandidateProfiles.CountAsync(c => c.JobId == request.JobId);
            if (job.MaxCandidates.HasValue && currentCvCount >= job.MaxCandidates.Value)
            {
                return BadRequest("Rất tiếc, đợt tuyển dụng này đã nhận đủ số lượng hồ sơ yêu cầu.");
            }

            try
            {
                var aiResult = await _aiService.GetMatchingScoreAsync(request.CvFile, job.Requirements);
                var fileName = await _fileService.SaveFileAsync(request.CvFile);

                var candidate = new CandidateProfile
                {
                    Id = Guid.NewGuid().ToString(),
                    FullName = request.FullName,
                    Email = aiResult.CandidateInfo.Email ?? request.Email ?? "N/A",
                    Phone = aiResult.CandidateInfo.Phone ?? request.Phone ?? "N/A",
                    CvFilePath = fileName,
                    MatchScore = aiResult.MatchingResult.Score,
                    AiExplanation = aiResult.MatchingResult.Explanation,
                    ExtractedSkills = string.Join(", ", aiResult.CandidateInfo.ExtractedSkills),
                    JobId = request.JobId,
                    AppliedAt = DateTime.UtcNow
                };

                _context.CandidateProfiles.Add(candidate);

                if (job.MaxCandidates.HasValue && (currentCvCount + 1) >= job.MaxCandidates.Value)
                {
                    job.IsActive = false;
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Ứng tuyển thành công! Hệ thống AI đang xử lý hồ sơ của bạn.",
                    score = aiResult.MatchingResult.Score,
                    skills = aiResult.CandidateInfo.ExtractedSkills,
                    isJobAutoClosed = !job.IsActive
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi hệ thống khi xử lý CV: {ex.Message}");
            }
        }
    }
}