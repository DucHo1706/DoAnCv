using Microsoft.AspNetCore.Mvc;
using RecruitmentBackend.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HighUtilityController : ControllerBase
    {
        private readonly IHighUtilityService _huimService;
        private readonly IAuditLogService _auditLogService;

        public HighUtilityController(IHighUtilityService huimService, IAuditLogService auditLogService)
        {
            _huimService = huimService;
            _auditLogService = auditLogService;
        }

        [HttpPost("train")]
        public async Task<IActionResult> TrainHUIMModel([FromQuery] double minUtility = 100.0)
        {
            var result = await _huimService.TrainHighUtilityModelAsync(minUtility);
            if (result.IsSuccess == false)
            {
                return BadRequest(new { status = "error", message = result.Message });
            }

            var adminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Admin";
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.WriteLogAsync(adminEmail, "Huấn luyện AI (HUIM)", "Mô hình Kỹ năng Giá trị Cao", ipAddress);

            return Ok(new { status = "success", message = result.Message });
        }

        [HttpGet("itemsets")]
        public async Task<IActionResult> GetHighUtilityItemsets()
        {
            var result = await _huimService.GetHighUtilityItemsetsAsync();
            if (result.IsSuccess == false)
            {
                return BadRequest(new { status = "error", message = result.Message });
            }
            return Ok(result.Data);
        }

        [HttpPost("recommend")]
        public async Task<IActionResult> RecommendSkills([FromBody] RecommendHUIMSkillsRequest request)
        {
            if (request == null || request.CurrentSkills == null)
            {
                return BadRequest(new { status = "error", message = "Dữ liệu yêu cầu không hợp lệ." });
            }

            var result = await _huimService.RecommendSkillsAsync(request.CurrentSkills, request.TopN);
            if (result.IsSuccess == false)
            {
                return BadRequest(new { status = "error", message = result.Message });
            }
            return Ok(new { status = "success", recommended_skills = result.Data });
        }
    }

    public class RecommendHUIMSkillsRequest
    {
        public List<string> CurrentSkills { get; set; } = new List<string>();
        public int TopN { get; set; } = 5;
    }
}
