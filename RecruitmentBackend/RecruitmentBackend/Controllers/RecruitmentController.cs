using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RecruitmentBackend.Data;
using RecruitmentBackend.Interfaces;
using System;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    public class ApplyJobRequest
    {
        public IFormFile CvFile { get; set; }
        public string JobId { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class RecruitmentController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAiService _aiService;
        private readonly IFileService _fileService;

        public RecruitmentController(AppDbContext context, IAiService aiService, IFileService fileService)
        {
            _context = context;
            _aiService = aiService;
            _fileService = fileService;
        }

        [HttpPost("apply")]
        public async Task<IActionResult> ApplyJob([FromForm] ApplyJobRequest request)
        {
            var cvFile = request?.CvFile;
            var jobId = request?.JobId;

            if (cvFile == null || cvFile.Length == 0)
                return BadRequest("Vui lòng tải lên file CV.");

            if (string.IsNullOrEmpty(jobId))
                return BadRequest("Mã công việc (JobId) không hợp lệ.");

            try
            {
                // 1. Lấy thông tin JD (Job Description) từ Database để AI so khớp
                var job = await _context.Jobs.FindAsync(jobId);
                
                // DÙNG JD GIẢ LẬP ĐỂ TEST GIAO DIỆN:
                // Nếu DB chưa có Job này (vì đang dùng mock data ở Frontend), ta lấy 1 JD mặc định để AI có cái so sánh.
                string requirements = job != null 
                    ? job.Requirements 
                    : "Tuyển dụng Kỹ sư phần mềm. Yêu cầu thành thạo ReactJS, TypeScript ở Frontend và C#, ASP.NET Core ở Backend. Có kinh nghiệm với SQL Server. Kỹ năng làm việc nhóm tốt.";

                // 2. Upload file CV lên Cloudinary (Trả về link URL an toàn)
                var cvUrl = await _fileService.SaveFileAsync(cvFile);

                // 3. Gửi file CV sang Python (Gemini AI) để chấm điểm và phân tích
                var aiResult = await _aiService.GetMatchingScoreAsync(cvFile, requirements);

                // 4. Lưu thông tin ứng viên và kết quả AI vào Database (Chỉ lưu nếu công việc CÓ THẬT trong DB)
                if (job != null)
                {
                    var candidate = new RecruitmentBackend.Models.CandidateProfile
                    {
                        Id = Guid.NewGuid().ToString(),
                        FullName = "Chưa cập nhật", 
                        Email = aiResult.CandidateInfo?.Email ?? "Chưa có email",
                        Phone = aiResult.CandidateInfo?.Phone ?? "Chưa có SĐT",
                        CvFilePath = cvUrl,
                        JobId = jobId,
                        // AiScore = aiResult.MatchingResult.Score,
                        // AiExplanation = aiResult.MatchingResult.Explanation
                    };
                    _context.Add(candidate);
                    await _context.SaveChangesAsync();
                }

                // 5. Trả kết quả về cho Frontend React để in ra thông báo
                return Ok(new
                {
                    message = "Nộp CV thành công! Trí tuệ nhân tạo đã xử lý xong hồ sơ của bạn.",
                    cvUrl = cvUrl,
                    aiAnalysis = aiResult
                });
            }
            catch (Exception ex)
            {
                // Lấy lỗi chi tiết (InnerException) nếu có để dễ gỡ lỗi DB
                var innerError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, new { message = "Lỗi hệ thống khi xử lý CV", error = innerError });
            }
        }
    }
}