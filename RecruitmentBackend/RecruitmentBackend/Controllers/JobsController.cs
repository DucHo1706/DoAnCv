using Microsoft.AspNetCore.Mvc;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
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

            // Ngắt vòng lặp vô hạn (Circular Reference) của Entity Framework
            var safeJobs = jobs.Select(j => new {
                id = j.Id,
                description = j.Description,
                requirements = j.Requirements,
                salaryRange = j.SalaryRange,
                isActive = j.IsActive,
                isApproved = j.IsApproved,
                createdAt = j.CreatedAt,
                startDate = j.StartDate,
                deadline = j.Deadline,
                maxCandidates = j.MaxCandidates,
                position = j.Position != null ? new { id = j.Position.Id, name = j.Position.Name } : null,
                branch = j.Branch != null ? new { id = j.Branch.Id, name = j.Branch.Name } : null,
                categories = j.Categories.Select(c => new { id = c.Id, name = c.Name })
            });
            return Ok(safeJobs);
        }

        // 2. Tạo Job mới (HR tạo tin tuyển dụng)
        [HttpPost]
        public async Task<IActionResult> CreateJob([FromBody] CreateJobRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var jobId = await _jobService.CreatePendingJobAsync(request);
                return Ok(new { message = "Tạo tin tuyển dụng thành công!", id = jobId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 3. Lấy chi tiết Job cho Modal "Xem chi tiết" của HR
        [HttpGet("{id}/review")]
        public async Task<IActionResult> GetJobReview(string id)
        {
            var reviewResult = await _jobService.ReviewJobAsync(id);
            if (reviewResult == null) return NotFound("Không tìm thấy công việc");

            var j = reviewResult.JobInfo;
            var safeJobInfo = new
            {
                id = j.Id,
                description = j.Description,
                requirements = j.Requirements,
                salaryRange = j.SalaryRange,
                isActive = j.IsActive,
                isApproved = j.IsApproved,
                createdAt = j.CreatedAt,
                startDate = j.StartDate,
                deadline = j.Deadline,
                maxCandidates = j.MaxCandidates,
                position = j.Position != null ? new { id = j.Position.Id, name = j.Position.Name } : null,
                branch = j.Branch != null ? new { id = j.Branch.Id, name = j.Branch.Name } : null,
                categories = j.Categories.Select(c => new { id = c.Id, name = c.Name })
            };
            return Ok(new { jobInfo = safeJobInfo, wordsToHighlight = reviewResult.WordsToHighlight });
        }

        // 4. Duyệt Job và đồng bộ từ khóa cho AI
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveJob(string id)
        {
            var success = await _jobService.ApproveJobAndSyncAiAsync(id);
            if (!success) return BadRequest("Không thể duyệt công việc này hoặc công việc đã được duyệt.");

            return Ok(new { message = "Đã duyệt bài đăng! AI đã cập nhật thêm các từ khóa mới." });
        }

        // 5. Lấy danh sách Job đang chờ duyệt
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingJobs()
        {
            var jobs = await _jobService.GetPendingJobsAsync();

            // Ngắt vòng lặp vô hạn (Circular Reference) của Entity Framework
            var safeJobs = jobs.Select(j => new {
                id = j.Id,
                description = j.Description,
                requirements = j.Requirements,
                salaryRange = j.SalaryRange,
                isActive = j.IsActive,
                isApproved = j.IsApproved,
                createdAt = j.CreatedAt,
                startDate = j.StartDate,
                deadline = j.Deadline,
                maxCandidates = j.MaxCandidates,
                position = j.Position != null ? new { id = j.Position.Id, name = j.Position.Name } : null,
                branch = j.Branch != null ? new { id = j.Branch.Id, name = j.Branch.Name } : null,
                categories = j.Categories.Select(c => new { id = c.Id, name = c.Name })
            });
            return Ok(safeJobs);
        }
    }
}