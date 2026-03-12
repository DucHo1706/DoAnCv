using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : Controller
    {
        private readonly AppDbContext _context;

        public CategoriesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Categories.ToListAsync();
            return Ok(categories);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCategory([FromBody] string categoryName)
        {
            if (string.IsNullOrWhiteSpace(categoryName))
                return BadRequest("Tên ngành không được để trống");

            var newCategory = new Category { Name = categoryName };
            _context.Categories.Add(newCategory);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thêm ngành mới thành công!", category = newCategory });
        }
    }
}
