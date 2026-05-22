using Microsoft.AspNetCore.Mvc;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobLevelsController : ControllerBase
    {
        private readonly IJobLevelService _jobLevelService;

        public JobLevelsController(IJobLevelService jobLevelService)
        {
            _jobLevelService = jobLevelService;
        }

        [HttpGet]
        public async Task<IActionResult> GetJobLevels()
        {
            var levels = await _jobLevelService.GetJobLevelsAsync();
            return Ok(levels);
        }

        [HttpPost]
        public async Task<IActionResult> CreateJobLevel([FromBody] JobLevelRequest request)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Tên cấp bậc không được để trống");

            var result = await _jobLevelService.CreateJobLevelAsync(request);
            
            if (result.IsSuccess == false) return BadRequest(result.Message);
            
            return Ok(result.Data);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJobLevel(string id, [FromBody] JobLevelRequest request)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Tên cấp bậc không được để trống");

            var result = await _jobLevelService.UpdateJobLevelAsync(id, request);
            
            if (result.IsSuccess == false)
            {
                if (result.Message == "Không tìm thấy cấp bậc") return NotFound(result.Message);
                return BadRequest(result.Message);
            }

            return Ok(result.Data);
        }

        [HttpPut("{id}/toggle-status")]
        public async Task<IActionResult> ToggleJobLevelStatus(string id)
        {
            var result = await _jobLevelService.ToggleJobLevelStatusAsync(id);
            
            if (result.IsSuccess == false) return NotFound(result.Message);
            
            return Ok(result.Data);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJobLevel(string id)
        {
            var result = await _jobLevelService.DeleteJobLevelAsync(id);
            
            if (result.IsSuccess == false)
            {
                if (result.Message == "Không tìm thấy cấp bậc") return NotFound(result.Message);
                return BadRequest(result.Message);
            }
            
            return Ok(new { message = result.Message });
        }
    }
}