﻿﻿﻿using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
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

        public JobsController(IJobService jobService)
        {
            _jobService = jobService;
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
            var success = await _jobService.ApproveJobAndSyncAiAsync(id);
            if (!success) return BadRequest("Không thể duyệt công việc này hoặc đã được duyệt.");

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
            var success = await _jobService.ToggleJobStatusAsync(id);
            if (!success) return BadRequest("Không thể thay đổi trạng thái của công việc này.");
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
    }
}