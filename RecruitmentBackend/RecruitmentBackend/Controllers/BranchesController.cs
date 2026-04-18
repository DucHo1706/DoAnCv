using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;
using System;
using System.Threading.Tasks;

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

        // 1. Lấy danh sách toàn bộ Chi nhánh
        [HttpGet]
        public async Task<IActionResult> GetBranches()
        {
            var branches = await _context.Branches.ToListAsync();
            return Ok(branches);
        }

        // 2. Tạo Chi nhánh mới
        [HttpPost]
        public async Task<IActionResult> CreateBranch([FromBody] Branch branch)
        {
            if (string.IsNullOrEmpty(branch.Name)) return BadRequest("Tên chi nhánh không được để trống");
            
            branch.Id = Guid.NewGuid().ToString();
            _context.Branches.Add(branch);
            await _context.SaveChangesAsync();

            return Ok(branch);
        }
    }
}