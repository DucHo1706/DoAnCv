using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Models;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BranchesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BranchesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetBranches()
        {
            var branches = await _context.Branches
                .OrderBy(b => b.Name)
                .ToListAsync();

            return Ok(branches);
        }

        [HttpPost]
        public async Task<IActionResult> CreateBranch([FromBody] NameOnlyRequest request)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Tên chi nhánh không được để trống");

            var normalizedName = request.Name.Trim();

            var exists = await _context.Branches
                .AnyAsync(b => b.Name.ToLower() == normalizedName.ToLower());

            if (exists)
                return BadRequest("Chi nhánh đã tồn tại");

            var branch = new Branch
            {
                Id = Guid.NewGuid().ToString(),
                Name = normalizedName
            };

            _context.Branches.Add(branch);
            await _context.SaveChangesAsync();

            return Ok(branch);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBranch(string id, [FromBody] NameOnlyRequest request)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Tên chi nhánh không được để trống");

            var branch = await _context.Branches.FindAsync(id);
            if (branch == null)
                return NotFound("Không tìm thấy chi nhánh");

            var normalizedName = request.Name.Trim();

            var exists = await _context.Branches
                .AnyAsync(b => b.Id != id && b.Name.ToLower() == normalizedName.ToLower());

            if (exists)
                return BadRequest("Tên chi nhánh đã tồn tại");

            branch.Name = normalizedName;
            await _context.SaveChangesAsync();

            return Ok(branch);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBranch(string id)
        {
            var branch = await _context.Branches.FindAsync(id);
            if (branch == null)
                return NotFound("Không tìm thấy chi nhánh");

            var isUsed = await _context.Jobs.AnyAsync(j => j.BranchId == id);
            if (isUsed)
                return BadRequest("Chi nhánh đang được sử dụng trong tin tuyển dụng, không thể xóa");

            _context.Branches.Remove(branch);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa chi nhánh thành công" });
        }
    }
}