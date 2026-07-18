using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/recruiter")]
    [ApiController]
    [Authorize(Roles = "Recruiter")]
    public class CandidateComparisonController : ControllerBase
    {
        private readonly ICandidateComparisonService _candidateComparisonService;

        public CandidateComparisonController(ICandidateComparisonService candidateComparisonService)
        {
            _candidateComparisonService = candidateComparisonService;
        }

        [HttpGet("jobs/{jobId}/candidate-rankings")]
        public async Task<IActionResult> GetCandidateRankings(
            string jobId,
            [FromQuery] string? sortBy,
            [FromQuery] string? criterionName,
            [FromQuery] string? search
        )
        {
            var result = await _candidateComparisonService.GetCandidateRankingsAsync(
                jobId,
                sortBy,
                criterionName,
                search,
                User
            );

            if (result.IsSuccess == false)
            {
                return CreateErrorResponse(result.Message);
            }

            return Ok(result.Data);
        }

        [HttpPost("candidates/compare")]
        public async Task<IActionResult> CompareCandidates([FromBody] CompareCandidatesRequest request)
        {
            var result = await _candidateComparisonService.CompareCandidatesAsync(request, User);

            if (result.IsSuccess == false)
            {
                return CreateErrorResponse(result.Message);
            }

            return Ok(result.Data);
        }

        private IActionResult CreateErrorResponse(string message)
        {
            if (message == "Không tìm thấy công việc hoặc bạn không có quyền truy cập." ||
                message == "Không tìm thấy một hoặc nhiều hồ sơ trong công việc đã chọn.")
            {
                return NotFound(new { message });
            }

            if (message == "Không tìm thấy thông tin Nhà tuyển dụng.")
            {
                return StatusCode(403, new { message });
            }

            if (message == "Không xác định được tài khoản đang đăng nhập.")
            {
                return Unauthorized(new { message });
            }

            return BadRequest(new { message });
        }
    }
}
