using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobsController : ControllerBase
    {
        private readonly IJobService _jobService;
        private readonly IAuditLogService _auditLogService;
        private readonly AppDbContext _context;

        public JobsController(IJobService jobService, IAuditLogService auditLogService, AppDbContext context)
        {
            _jobService = jobService;
            _auditLogService = auditLogService;
            _context = context;
        }

        // 1. Lấy danh sách toàn bộ Job
        [HttpGet]
        public async Task<IActionResult> GetJobs()
        {
            var jobs = await _jobService.GetAllJobsAsync();
            return Ok(jobs);
        }

        // 2. Tạo Job mới (HR tạo tin tuyển dụng)
        [HttpPost]
        [Authorize(Roles = "Recruiter,Admin")]
        public async Task<IActionResult> CreateJob([FromBody] CreateJobRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var jobId = await _jobService.CreatePendingJobAsync(request, accountId);
                return Ok(new { message = "Tạo tin tuyển dụng thành công!", id = jobId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // API dành riêng cho HR xem danh sách việc làm của chính mình
        [HttpGet("my-jobs")]
        [Authorize(Roles = "Recruiter")]
        public async Task<IActionResult> GetMyJobs()
        {
            var accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var jobs = await _jobService.GetJobsByRecruiterAsync(accountId);
            return Ok(jobs);
        }

        // 3. Lấy chi tiết Job cho Modal "Xem chi tiết" của HR
        [HttpGet("{id}/review")]
        public async Task<IActionResult> GetJobReview(string id)
        {
            var reviewResult = await _jobService.ReviewJobAsync(id);
            if (reviewResult == null) return NotFound("Không tìm thấy công việc");
            return Ok(reviewResult);
        }

        // 4. Duyệt Job và đồng bộ từ khóa cho AI
        [HttpPost("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveJob(string id)
        {
            var job = await _context.JobPostings.FindAsync(id);
            var parsedTitle = job != null ? $"Tin tuyển dụng ID: {id}" : $"ID: {id}";

            var success = await _jobService.ApproveJobAndSyncAiAsync(id);
            if (!success) return BadRequest("Không thể duyệt công việc này hoặc đã được duyệt.");

            // GHI NHẬT KÝ HỆ THỐNG
            var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "Admin";
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.WriteLogAsync(adminEmail, "Duyệt tin tuyển dụng", parsedTitle, ipAddress);

            return Ok(new { message = "Đã duyệt bài đăng thành công!" });
        }

        // 5. Lấy danh sách Job đang chờ duyệt
        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPendingJobs()
        {
            var jobs = await _jobService.GetPendingJobsAsync();
            return Ok(jobs);
        }

        // 6. Lấy toàn bộ Job cho Admin (Gồm cả duyệt và chưa duyệt)
        [HttpGet("admin/all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAdminJobs()
        {
            var jobs = await _jobService.GetAdminJobsAsync();
            return Ok(jobs);
        }

        // 7. Khóa / Mở khóa Job
        [HttpPut("{id}/toggle-status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleJobStatus(string id)
        {
            var job = await _context.JobPostings.FindAsync(id);
            var actionText = job != null && job.Status == "Published" ? "Tạm ẩn tin tuyển dụng" : "Mở hiển thị tin tuyển dụng";
            var parsedTitle = job != null ? $"Tin tuyển dụng ID: {id}" : $"ID: {id}";

            var success = await _jobService.ToggleJobStatusAsync(id);
            if (!success) return BadRequest("Không thể thay đổi trạng thái của công việc này.");

            // GHI NHẬT KÝ HỆ THỐNG
            var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "Admin";
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.WriteLogAsync(adminEmail, actionText, parsedTitle, ipAddress);

            return Ok(new { message = "Cập nhật trạng thái thành công!" });
        }

        // 7b. Khóa / Mở khóa Job dành cho Recruiter (Theo Chi nhánh)
        [HttpPut("{id}/toggle-status-recruiter")]
        [Authorize(Roles = "Recruiter")]
        public async Task<IActionResult> ToggleRecruiterJobStatus(string id)
        {
            var accountId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return Unauthorized("Không xác định được tài khoản đang đăng nhập.");

            var job = await _context.JobPostings.FindAsync(id);
            var actionText = job != null && job.Status == "Published" ? "HR: Tạm ẩn tin tuyển dụng" : "HR: Mở hiển thị tin tuyển dụng";
            var parsedTitle = job != null ? $"Tin tuyển dụng ID: {id}" : $"ID: {id}";

            var success = await _jobService.ToggleRecruiterJobStatusAsync(id, accountId);
            if (!success) return BadRequest("Không thể thay đổi trạng thái của công việc này hoặc bạn không có quyền.");

            // GHI NHẬT KÝ HỆ THỐNG
            var recruiterEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "HR";
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.WriteLogAsync(recruiterEmail, actionText, parsedTitle, ipAddress);

            return Ok(new { message = "Cập nhật trạng thái thành công!" });
        }

        // 8. Lấy danh sách việc làm đã duyệt (Có phân trang, tìm kiếm)
        [HttpGet("published")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublishedJobs([FromQuery] JobFilterRequest request)
        {
            try
            {
                var result = await _jobService.GetPublishedJobsAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách việc làm: " + ex.Message });
            }
        }

        // 9. Lấy chi tiết 1 công việc đã duyệt cho ứng viên xem
        [HttpGet("published/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublishedJobById(string id)
        {
            var job = await _jobService.GetPublishedJobByIdAsync(id);
            if (job == null) return NotFound(new { message = "Không tìm thấy công việc này hoặc đã hết hạn." });
            return Ok(job);
        }

        // 10. Lấy danh sách Top Ngành nghề nổi bật cho Trang chủ
        [HttpGet("trending-categories")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTrendingCategories()
        {
            try
            {
                var result = await _jobService.GetTrendingCategoriesAsync(8);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách ngành nghề: " + ex.Message });
            }
        }

        [HttpGet("trending")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTrendingJobs([FromQuery] int limit = 6)
        {
            try
            {
                var result = await _jobService.GetTrendingJobsAsync(limit);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy tin tuyển dụng nổi bật: " + ex.Message });
            }
        }

        [HttpGet("{id}/related")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRelatedJobs(string id, [FromQuery] int limit = 3)
        {
            try
            {
                var result = await _jobService.GetRelatedJobsAsync(id, limit);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy tin tuyển dụng tương tự: " + ex.Message });
            }
        }

        // 8. Lưu tin tuyển dụng
        [HttpPost("{id}/save")]
        [Authorize(Roles = "Candidate")]
        public async Task<IActionResult> SaveJob(string id)
        {
            var accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return Unauthorized("Không xác định được tài khoản.");

            var success = await _jobService.SaveJobAsync(id, accountId);
            if (!success) return BadRequest("Không thể lưu tin tuyển dụng này.");

            return Ok(new { message = "Đã lưu tin tuyển dụng thành công!" });
        }

        // 9. Hủy lưu tin tuyển dụng
        [HttpDelete("{id}/unsave")]
        [Authorize(Roles = "Candidate")]
        public async Task<IActionResult> UnsaveJob(string id)
        {
            var accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return Unauthorized("Không xác định được tài khoản.");

            var success = await _jobService.UnsaveJobAsync(id, accountId);
            if (!success) return BadRequest("Không thể hủy lưu tin tuyển dụng này.");

            return Ok(new { message = "Đã hủy lưu tin tuyển dụng thành công!" });
        }

        // 10. Lấy danh sách việc làm đã lưu
        [HttpGet("saved")]
        [Authorize(Roles = "Candidate")]
        public async Task<IActionResult> GetSavedJobs()
        {
            var accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return Unauthorized("Không xác định được tài khoản.");

            var result = await _jobService.GetSavedJobsAsync(accountId);
            return Ok(result);
        }
    }
}