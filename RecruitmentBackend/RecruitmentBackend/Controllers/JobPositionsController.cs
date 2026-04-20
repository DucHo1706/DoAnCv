using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Models;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobPositionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public JobPositionsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetJobPositions()
        {
            var positions = await _context.JobPositions
                .OrderBy(p => p.Name)
                .ToListAsync();

            return Ok(positions);
        }

        [HttpPost]
        public async Task<IActionResult> CreateJobPosition([FromBody] NameOnlyRequest request)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Tên vị trí không được để trống");

            var normalizedName = request.Name.Trim();

            var exists = await _context.JobPositions
                .AnyAsync(p => p.Name.ToLower() == normalizedName.ToLower());

            if (exists)
                return BadRequest("Vị trí đã tồn tại");

            var position = new JobPosition
            {
                Id = Guid.NewGuid().ToString(),
                Name = normalizedName
            };

            _context.JobPositions.Add(position);
            await _context.SaveChangesAsync();

            return Ok(position);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJobPosition(string id, [FromBody] NameOnlyRequest request)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Tên vị trí không được để trống");

            var position = await _context.JobPositions.FindAsync(id);
            if (position == null)
                return NotFound("Không tìm thấy vị trí");

            var normalizedName = request.Name.Trim();

            var exists = await _context.JobPositions
                .AnyAsync(p => p.Id != id && p.Name.ToLower() == normalizedName.ToLower());

            if (exists)
                return BadRequest("Tên vị trí đã tồn tại");

            position.Name = normalizedName;
            await _context.SaveChangesAsync();

            return Ok(position);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJobPosition(string id)
        {
            var position = await _context.JobPositions.FindAsync(id);
            if (position == null)
                return NotFound("Không tìm thấy vị trí");

            var isUsed = await _context.Jobs.AnyAsync(j => j.PositionId == id);
            if (isUsed)
                return BadRequest("Vị trí đang được sử dụng trong tin tuyển dụng, không thể xóa");

            _context.JobPositions.Remove(position);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa vị trí thành công" });
        }
    }
}