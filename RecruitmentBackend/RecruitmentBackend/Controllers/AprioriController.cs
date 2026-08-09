using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RecruitmentBackend.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AprioriController : ControllerBase
    {
        private readonly IAprioriService _aprioriService;
        private readonly IAuditLogService _auditLogService;

        public AprioriController(IAprioriService aprioriService, IAuditLogService auditLogService)
        {
            _aprioriService = aprioriService;
            _auditLogService = auditLogService;
        }

        [HttpPost("train")]
        public async Task<IActionResult> TrainAprioriModel()
        {
            var result = await _aprioriService.TrainAprioriModelAsync();
            if (result.IsSuccess == false)
            {
                return BadRequest(new { status = "error", message = result.Message });
            }

            var adminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Admin";
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.WriteLogAsync(adminEmail, "Huấn luyện AI (Apriori)", "Mô hình Tương quan Kỹ năng", ipAddress);

            return Ok(new { status = "success", message = result.Message });
        }

        [HttpGet("rules")]
        public async Task<IActionResult> GetAssociationRules()
        {
            var result = await _aprioriService.GetAssociationRulesAsync();
            if (result.IsSuccess == false)
            {
                return BadRequest(new { status = "error", message = result.Message });
            }
            return Ok(result.Data);
        }

        [HttpPost("recommend")]
        public async Task<IActionResult> RecommendSkills([FromBody] RecommendSkillsRequest request)
        {
            if (request == null || request.CurrentSkills == null)
            {
                return BadRequest(new { status = "error", message = "Dữ liệu yêu cầu không hợp lệ." });
            }

            var result = await _aprioriService.RecommendSkillsAsync(request.CurrentSkills, request.TopN);
            if (result.IsSuccess == false)
            {
                return BadRequest(new { status = "error", message = result.Message });
            }
            return Ok(new { status = "success", recommended_skills = result.Data });
        }
    }

    public class RecommendSkillsRequest
    {
        public List<string> CurrentSkills { get; set; } = new List<string>();
        public int TopN { get; set; } = 5;
    }
}
