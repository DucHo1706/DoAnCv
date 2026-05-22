using Microsoft.AspNetCore.Mvc;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BranchesController : ControllerBase
    {
        private readonly IBranchService _branchService;

        public BranchesController(IBranchService branchService)
        {
            _branchService = branchService;
        }

        [HttpGet]
        public async Task<IActionResult> GetBranches()
        {
            var branches = await _branchService.GetBranchesAsync();
            return Ok(branches);
        }

        [HttpPost]
        public async Task<IActionResult> CreateBranch([FromBody] NameOnlyRequest request)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Tên chi nhánh không được để trống");

            var result = await _branchService.CreateBranchAsync(request);
            
            if (result.IsSuccess == false) return BadRequest(result.Message);
            
            return Ok(result.Data);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBranch(string id, [FromBody] NameOnlyRequest request)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Tên chi nhánh không được để trống");

            var result = await _branchService.UpdateBranchAsync(id, request);
            
            if (result.IsSuccess == false)
            {
                if (result.Message == "Không tìm thấy chi nhánh") return NotFound(result.Message);
                return BadRequest(result.Message);
            }
            
            return Ok(result.Data);
        }

        [HttpPut("{id}/toggle-status")]
        public async Task<IActionResult> ToggleBranchStatus(string id)
        {
            var result = await _branchService.ToggleBranchStatusAsync(id);
            
            if (result.IsSuccess == false) return NotFound(result.Message);
            
            return Ok(result.Data);
        }
    }
}