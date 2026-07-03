using Microsoft.AspNetCore.Mvc;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobPositionsController : ControllerBase
    {
        private readonly IJobPositionService _jobPositionService;

        public JobPositionsController(IJobPositionService jobPositionService)
        {
            _jobPositionService = jobPositionService;
        }

        [HttpGet]
        public async Task<IActionResult> GetJobPositions()
        {
            var positions = await _jobPositionService.GetJobPositionsAsync();
            return Ok(positions);
        }

        [HttpPost]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateJobPosition([FromBody] JobPositionRequest request)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.CategoryId))
                return BadRequest("Tên vị trí không được để trống");

            var result = await _jobPositionService.CreateJobPositionAsync(request);
            if (!result.IsSuccess) return BadRequest(result.Message);
            
            return Ok(result.Data);
        }

        [HttpPut("{id}")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateJobPosition(string id, [FromBody] JobPositionRequest request)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.CategoryId))
                return BadRequest("Tên vị trí không được để trống");

            var result = await _jobPositionService.UpdateJobPositionAsync(id, request);
            if (!result.IsSuccess)
            {
                if (result.Message == "Không tìm thấy vị trí") return NotFound(result.Message);
                return BadRequest(result.Message);
            }
            
            return Ok(result.Data);
        }

        [HttpPut("{id}/toggle-status")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> TogglePositionStatus(string id)
        {
            var result = await _jobPositionService.TogglePositionStatusAsync(id);
            if (!result.IsSuccess) return NotFound(result.Message);
            
            return Ok(result.Data);
        }
    }
}