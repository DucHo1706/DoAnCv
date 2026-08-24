﻿﻿﻿using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RecruitmentBackend.Interfaces;
using System.Security.Claims;
using System.Threading.Tasks;
using RecruitmentBackend.DTOs.Requests;

namespace RecruitmentBackend.Controllers
{
    public class ApplyJobRequest
    {
        public IFormFile? CvFile { get; set; }
        public string JobId { get; set; }
        public bool UseDefaultCv { get; set; } = false;
        public string? SavedCvId { get; set; }
        public string? CvBuilderDocumentId { get; set; }
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

            if (string.IsNullOrEmpty(jobId))
                return BadRequest("Mã công việc (JobId) không hợp lệ.");

            var hasFile = cvFile != null && cvFile.Length > 0;
            var hasSavedCv = !string.IsNullOrWhiteSpace(request.SavedCvId);
            var hasBuilderCv = !string.IsNullOrWhiteSpace(request.CvBuilderDocumentId);
            var sourceCount = (request.UseDefaultCv ? 1 : 0)
                + (hasSavedCv ? 1 : 0)
                + (hasBuilderCv ? 1 : 0)
                + (hasFile && !hasBuilderCv ? 1 : 0);

            if (sourceCount == 0)
                return BadRequest("Vui lòng tải lên file CV.");

            if (sourceCount > 1)
                return BadRequest("Vui lòng chỉ chọn một nguồn CV để ứng tuyển.");

            if (hasBuilderCv && !hasFile)
                return BadRequest("Không thể tạo bản PDF từ CV trực tuyến. Vui lòng thử lại.");

            var result = await _recruitmentService.ApplyJobAsync(request, User);

            if (!result.IsSuccess)
            {
                if (result.Data != null)
                {
                    return Conflict(new
                    {
                        message = result.Message,
                        data = result.Data
                    });
                }

                return BadRequest(new
                {
                    message = result.Message
                });
            }

            return Ok(result.Data);
        }

        // API lấy danh sách Đơn ứng tuyển dành cho HR
        [HttpGet("hr/applications")]
        [Authorize(Roles = "Recruiter")]
        public async Task<IActionResult> GetHrApplications(
            [FromQuery] bool includeAiDetails = true,
            [FromQuery] string? jobId = null)
        {
            var result = await _recruitmentService.GetHrApplicationsAsync(
                User,
                includeAiDetails,
                applicationId: null,
                jobId: jobId);

            if (!result.IsSuccess) return Unauthorized(new { message = result.Message });
            
            return Ok(result.Data);
        }

        [HttpGet("hr/applications/{applicationId}")]
        [Authorize(Roles = "Recruiter")]
        public async Task<IActionResult> GetHrApplicationDetail(string applicationId)
        {
            var result = await _recruitmentService.GetHrApplicationsAsync(User, true, applicationId);
            if (!result.IsSuccess) return Unauthorized(new { message = result.Message });
            return Ok(result.Data);
        }
        //API cập nhật trạng thái ứng tuyển
        [HttpPut("hr/applications/{applicationId}/status")]
        [Authorize(Roles = "Recruiter")]
        public async Task<IActionResult> UpdateApplicationStatus(string applicationId, [FromBody] UpdateApplicationStatusRequest request)
        {
            var result = await _recruitmentService.UpdateApplicationStatusAsync(
                applicationId,
                request,
                User
            );

            if (result.IsSuccess == false)
            {
                return BadRequest(new
                {
                    message = result.Message
                });
            }

            return Ok(new
            {
                message = result.Message,
                data = result.Data
            });
        }
        [HttpPost("hr/applications/{applicationId}/reject")]
        [Authorize(Roles = "Recruiter")]
        public async Task<IActionResult> RejectApplication(string applicationId, [FromBody] RejectApplicationRequest request)
        {
            var result = await _recruitmentService.RejectApplicationAsync(
                applicationId,
                request,
                User
            );

            if (result.IsSuccess == false)
            {
                return BadRequest(new
                {
                    message = result.Message
                });
            }

            return Ok(new
            {
                message = result.Message,
                data = result.Data
            });
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

        [HttpPost("applications/{applicationId}/retry-ai")]
        [Authorize(Roles = "Candidate")]
        public async Task<IActionResult> RetryAiEvaluation(string applicationId)
        {
            var result = await _recruitmentService.RetryAiEvaluationAsync(applicationId, User);
            if (!result.IsSuccess)
            {
                return BadRequest(new { message = result.Message });
            }

            return Accepted(new { message = result.Message, data = result.Data });
        }

        [HttpDelete("applications/{applicationId}/withdraw")]
        [Authorize(Roles = "Candidate")]
        public async Task<IActionResult> WithdrawApplication(string applicationId)
        {
            var result = await _recruitmentService.WithdrawApplicationAsync(applicationId, User);
            if (!result.IsSuccess)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new { message = result.Message, data = result.Data });
        }

        [HttpPost("hr/applications/{applicationId}/schedule")]
        [Authorize(Roles = "Recruiter")]
        public async Task<IActionResult> ScheduleInterview(string applicationId, [FromBody] ScheduleInterviewRequest request)
        {
            var result = await _recruitmentService.ScheduleInterviewAsync(
                applicationId,
                request,
                User
            );

            if (result.IsSuccess == false)
            {
                return BadRequest(new
                {
                    message = result.Message
                });
            }

            return Ok(new
            {
                message = result.Message,
                data = result.Data
            });
        }

        [HttpGet("applications/{applicationId}/schedule")]
        [Authorize]
        public async Task<IActionResult> GetInterviewSchedule(string applicationId)
        {
            var result = await _recruitmentService.GetInterviewScheduleAsync(applicationId, User);

            if (result.IsSuccess == false)
            {
                return NotFound(new
                {
                    message = result.Message
                });
            }

            return Ok(result.Data);
        }

        [HttpGet("hr/schedules")]
        [Authorize(Roles = "Recruiter")]
        public async Task<IActionResult> GetHrInterviewSchedules()
        {
            var result = await _recruitmentService.GetHrInterviewSchedulesAsync(User);

            if (result.IsSuccess == false)
            {
                return BadRequest(new
                {
                    message = result.Message
                });
            }

            return Ok(result.Data);
        }

        [HttpDelete("hr/applications/{applicationId}/schedule")]
        [Authorize(Roles = "Recruiter")]
        public async Task<IActionResult> CancelInterviewSchedule(string applicationId)
        {
            var result = await _recruitmentService.CancelInterviewScheduleAsync(applicationId, User);

            if (result.IsSuccess == false)
            {
                return BadRequest(new
                {
                    message = result.Message
                });
            }

            return Ok(new
            {
                message = result.Message
            });
        }
    }
}
