using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;
using RecruitmentBackend.Services;
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
        private readonly IMetadataChangeNotifier _changeNotifier;

        public JobsController(
            IJobService jobService,
            IAuditLogService auditLogService,
            AppDbContext context,
            IMetadataChangeNotifier changeNotifier)
        {
            _jobService = jobService;
            _auditLogService = auditLogService;
            _context = context;
            _changeNotifier = changeNotifier;
        }

        // 1. Lấy danh sách toàn bộ Job
        [HttpGet]
        [Authorize(Roles = "Recruiter,Admin")]
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
                await _changeNotifier.NotifyAsync("jobs", "created");
                return Ok(new { message = "Tạo tin tuyển dụng thành công!", id = jobId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Recruiter")]
        public async Task<IActionResult> UpdateJob(string id, [FromBody] CreateJobRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
            var result = await _jobService.UpdateRecruiterJobAsync(id, request, accountId);
            if (!result.Success) return BadRequest(new { message = result.Message });
            await _auditLogService.WriteLogAsync(User.FindFirst(ClaimTypes.Email)?.Value ?? "HR", "Cập nhật tin tuyển dụng", $"Tin tuyển dụng ID: {id}", HttpContext.Connection.RemoteIpAddress?.ToString());
            await _changeNotifier.NotifyAsync("jobs", "updated");
            return Ok(new { message = result.Message });
        }

        [HttpPost("{id}/repost")]
        [Authorize(Roles = "Recruiter")]
        public async Task<IActionResult> RepostJob(string id, [FromBody] RepostJobRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            var result = await _jobService.RepostJobAsync(id, request, accountId);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            await _auditLogService.WriteLogAsync(
                User.FindFirst(ClaimTypes.Email)?.Value ?? "HR",
                "Đăng lại tin tuyển dụng",
                $"Tin nguồn ID: {id}; tin mới ID: {result.JobId}; đợt: {result.RecruitmentRound}",
                HttpContext.Connection.RemoteIpAddress?.ToString());

            await _changeNotifier.NotifyAsync("jobs", "reposted");

            return Ok(new
            {
                message = result.Message,
                id = result.JobId,
                recruitmentRound = result.RecruitmentRound
            });
        }

        [HttpPut("{id}/archive")]
        [Authorize(Roles = "Recruiter,Admin")]
        public async Task<IActionResult> ArchiveJob(string id)
        {
            var accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
            var isAdmin = User.IsInRole("Admin");
            var result = await _jobService.ArchiveJobAsync(id, accountId, isAdmin);
            if (!result.Success) return BadRequest(new { message = result.Message });
            await _auditLogService.WriteLogAsync(User.FindFirst(ClaimTypes.Email)?.Value ?? "Hệ thống", "Lưu trữ tin tuyển dụng", $"Tin tuyển dụng ID: {id}", HttpContext.Connection.RemoteIpAddress?.ToString());
            await _changeNotifier.NotifyAsync("jobs", "archived");
            return Ok(new { message = result.Message });
        }

        [HttpPut("{id}/restore")]
        [Authorize(Roles = "Recruiter,Admin")]
        public async Task<IActionResult> RestoreJob(string id)
        {
            var accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
            var result = await _jobService.RestoreArchivedJobAsync(id, accountId, User.IsInRole("Admin"));
            if (!result.Success) return BadRequest(new { message = result.Message });
            await _auditLogService.WriteLogAsync(User.FindFirst(ClaimTypes.Email)?.Value ?? "Hệ thống", "Khôi phục tin tuyển dụng", $"Tin tuyển dụng ID: {id}", HttpContext.Connection.RemoteIpAddress?.ToString());
            await _changeNotifier.NotifyAsync("jobs", "restored");
            return Ok(new { message = result.Message });
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

        [HttpGet("my-campaigns")]
        [Authorize(Roles = "Recruiter")]
        public async Task<IActionResult> GetMyCampaigns()
        {
            string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            var campaigns = await _jobService.GetRecruiterCampaignSummariesAsync(accountId);
            return Ok(campaigns);
        }

        // 3. Lấy chi tiết Job cho Modal "Xem chi tiết" của HR
        [HttpGet("{id}/review")]
        [Authorize(Roles = "Recruiter,Admin")]
        public async Task<IActionResult> GetJobReview(string id)
        {
            var accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
            var reviewResult = await _jobService.ReviewJobAsync(id, accountId, User.IsInRole("Admin"));
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
            await _changeNotifier.NotifyAsync("jobs", "approved");

            return Ok(new { message = "Đã duyệt bài đăng thành công!" });
        }

        // 4b. Từ chối Job kèm lý do
        [HttpPost("{id}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RejectJob(string id, [FromBody] RejectJobRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Reason))
            {
                return BadRequest(new { message = "Vui lòng nhập lý do từ chối tin tuyển dụng." });
            }

            var job = await _context.JobPostings.FindAsync(id);
            var parsedTitle = job != null ? $"Tin tuyển dụng ID: {id}" : $"ID: {id}";

            var success = await _jobService.RejectJobAsync(id, request.Reason.Trim());
            if (!success) return BadRequest(new { message = "Không thể từ chối công việc này (có thể đã được xử lý)." });

            // GHI NHẬT KÝ HỆ THỐNG
            var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "Admin";
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.WriteLogAsync(adminEmail, "Từ chối tin tuyển dụng", $"{parsedTitle} - Lý do: {request.Reason.Trim()}", ipAddress);
            await _changeNotifier.NotifyAsync("jobs", "rejected");

            return Ok(new { message = "Đã từ chối tin tuyển dụng thành công!" });
        }

        // 4c. Duyệt hàng loạt nhiều tin tuyển dụng cùng lúc
        [HttpPost("bulk-approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> BulkApproveJobs([FromBody] BulkApproveJobsRequest request)
        {
            if (request == null || request.JobIds == null || request.JobIds.Count == 0)
            {
                return BadRequest(new { message = "Vui lòng chọn ít nhất 1 tin tuyển dụng để duyệt." });
            }

            var (successCount, failCount) = await _jobService.BulkApproveJobsAsync(request.JobIds);

            // GHI NHẬT KÝ HỆ THỐNG
            var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "Admin";
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.WriteLogAsync(
                adminEmail,
                "Duyệt hàng loạt tin tuyển dụng",
                $"Đã duyệt {successCount}/{request.JobIds.Count} tin tuyển dụng (thất bại: {failCount})",
                ipAddress
            );
            await _changeNotifier.NotifyAsync("jobs", "bulk-approved");

            return Ok(new
            {
                message = failCount == 0
                    ? $"Đã duyệt thành công {successCount} tin tuyển dụng!"
                    : $"Đã duyệt {successCount} tin, {failCount} tin thất bại (có thể đã được xử lý trước đó).",
                successCount,
                failCount
            });
        }

        // 4d. Gắn cờ cảnh báo / Kiểm duyệt nội dung vi phạm tin tuyển dụng
        [HttpPost("{id}/flag")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> FlagJob(string id, [FromBody] RejectJobRequest request)
        {
            var reason = request?.Reason ?? "Cần kiểm duyệt nội dung";
            var success = await _jobService.FlagJobAsync(id, reason);
            if (!success) return BadRequest(new { message = "Không tìm thấy tin tuyển dụng." });

            var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "Admin";
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.WriteLogAsync(adminEmail, "Kiểm duyệt: Gắn cờ vi phạm", $"Tin tuyển dụng ID: {id} - Lý do: {reason}", ipAddress);
            await _changeNotifier.NotifyAsync("jobs", "flagged");

            return Ok(new { message = "Đã gắn cờ kiểm duyệt tin tuyển dụng thành công!" });
        }

        // 4e. Bỏ cờ vi phạm tin tuyển dụng
        [HttpPost("{id}/unflag")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UnflagJob(string id)
        {
            var success = await _jobService.UnflagJobAsync(id);
            if (!success) return BadRequest(new { message = "Không thể gỡ cờ (tin không trong trạng thái bị gắn cờ)." });

            var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "Admin";
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.WriteLogAsync(adminEmail, "Kiểm duyệt: Gỡ cờ vi phạm", $"Tin tuyển dụng ID: {id}", ipAddress);
            await _changeNotifier.NotifyAsync("jobs", "unflagged");

            return Ok(new { message = "Đã gỡ cờ kiểm duyệt tin tuyển dụng!" });
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
            await _changeNotifier.NotifyAsync("jobs", "visibility-changed");

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
            await _changeNotifier.NotifyAsync("jobs", "visibility-changed");

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

    public class RejectJobRequest
    {
        public string Reason { get; set; } = "";
    }

    public class BulkApproveJobsRequest
    {
        public List<string> JobIds { get; set; } = new List<string>();
    }
}
