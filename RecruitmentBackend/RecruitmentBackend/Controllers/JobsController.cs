using Microsoft.AspNetCore.Mvc;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;

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

        [HttpPost]
        public async Task<IActionResult> CreateJob([FromBody] CreateJobRequest request)
        {
            var jobId = await _jobService.CreatePendingJobAsync(request);
            return Ok(new { message = "Đăng bài thành công. Đang chờ Admin duyệt!", jobId });
        }

        [HttpGet("{id}/review")]
        public async Task<IActionResult> ReviewJob(string id)
        {
            var reviewResult = await _jobService.ReviewJobAsync(id);
            if (reviewResult == null) return NotFound("Không tìm thấy bài đăng");

            return Ok(reviewResult);
        }

        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveJob(string id)
        {
            var success = await _jobService.ApproveJobAndSyncAiAsync(id);
            if (!success) return BadRequest("Không tìm thấy bài đăng hoặc bài đã được duyệt rồi.");

            return Ok(new { message = "Đã duyệt bài đăng! AI đã được cập nhật thêm các từ mới (nếu có)." });
        }
        [HttpGet]
        public async Task<IActionResult> GetAllJobs()
        {
            var jobs = await _jobService.GetAllJobsAsync();
            return Ok(jobs);
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingJobs()
        {
            var jobs = await _jobService.GetPendingJobsAsync();
            return Ok(jobs);
        }
    }
}