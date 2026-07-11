using Microsoft.AspNetCore.Mvc;
using RecruitmentBackend.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AprioriController : ControllerBase
    {
        private readonly IAprioriService _aprioriService;

        public AprioriController(IAprioriService aprioriService)
        {
            _aprioriService = aprioriService;
        }

        [HttpPost("train")]
        public async Task<IActionResult> TrainAprioriModel()
        {
            var result = await _aprioriService.TrainAprioriModelAsync();
            if (result.IsSuccess == false)
            {
                return BadRequest(new { status = "error", message = result.Message });
            }
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
