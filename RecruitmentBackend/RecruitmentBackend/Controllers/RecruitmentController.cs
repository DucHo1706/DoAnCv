﻿﻿﻿﻿﻿﻿﻿﻿﻿using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RecruitmentBackend.Interfaces;
using System.Security.Claims;
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
        private readonly IRecruitmentService _recruitmentService;

        public RecruitmentController(IRecruitmentService recruitmentService)
        {
            _recruitmentService = recruitmentService;
        }

        [HttpPost("apply")]
        [Authorize(Roles = "Candidate")]
        public async Task<IActionResult> ApplyJob([FromForm] ApplyJobRequest request)
        {
            var cvFile = request?.CvFile;
            var jobId = request?.JobId;

            if (cvFile == null || cvFile.Length == 0)
                return BadRequest("Vui lòng tải lên file CV.");

            if (string.IsNullOrEmpty(jobId))
                return BadRequest("Mã công việc (JobId) không hợp lệ.");

            var result = await _recruitmentService.ApplyJobAsync(request, User);

            if (!result.IsSuccess)
            {
                // Service đã xử lý lỗi, chỉ cần trả về cho client
                return StatusCode(500, new { message = result.Message });
            }
            
            return Ok(result.Data);
        }

        // API lấy danh sách Đơn ứng tuyển dành cho HR
        [HttpGet("hr/applications")]
        [Authorize(Roles = "Recruiter")]
        public async Task<IActionResult> GetHrApplications()
        {
            var result = await _recruitmentService.GetHrApplicationsAsync(User);

            if (!result.IsSuccess) return Unauthorized(new { message = result.Message });
            
            return Ok(result.Data);
        }

        // API lấy danh sách Đơn ứng tuyển của chính Ứng viên đang đăng nhập
        [HttpGet("my-applications")]
        [Authorize(Roles = "Candidate")]
        public async Task<IActionResult> GetMyApplications()
        {
            var result = await _recruitmentService.GetMyApplicationsAsync(User);

            if (!result.IsSuccess) return Unauthorized(new { message = result.Message });
            
            return Ok(result.Data);
        }
    }
}