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
            await Task.CompletedTask;
            return Conflict(new { status = "scheduled_only", message = "Apriori được hệ thống tự động cập nhật lúc 02:00." });
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
