using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Models;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoriesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Categories
                .OrderBy(c => c.Name)
                .ToListAsync();

            return Ok(categories);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCategory([FromBody] NameOnlyRequest request)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Tên lĩnh vực không được để trống");

            var normalizedName = request.Name.Trim();

            var exists = await _context.Categories
                .AnyAsync(c => c.Name.ToLower() == normalizedName.ToLower());

            if (exists)
                return BadRequest("Lĩnh vực đã tồn tại");

            var category = new Category
            {
                Id = Guid.NewGuid().ToString(),
                Name = normalizedName
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return Ok(category);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(string id, [FromBody] NameOnlyRequest request)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Tên lĩnh vực không được để trống");

            var category = await _context.Categories.FindAsync(id);
            if (category == null)
                return NotFound("Không tìm thấy lĩnh vực");

            var normalizedName = request.Name.Trim();

            var exists = await _context.Categories
                .AnyAsync(c => c.Id != id && c.Name.ToLower() == normalizedName.ToLower());

            if (exists)
                return BadRequest("Tên lĩnh vực đã tồn tại");

            category.Name = normalizedName;
            await _context.SaveChangesAsync();

            return Ok(category);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(string id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
                return NotFound("Không tìm thấy lĩnh vực");

            var isUsed = await _context.Jobs
                .Include(j => j.Categories)
                .AnyAsync(j => j.Categories.Any(c => c.Id == id));

            if (isUsed)
                return BadRequest("Lĩnh vực đang được sử dụng trong tin tuyển dụng, không thể xóa");

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa lĩnh vực thành công" });
        }
    }
}