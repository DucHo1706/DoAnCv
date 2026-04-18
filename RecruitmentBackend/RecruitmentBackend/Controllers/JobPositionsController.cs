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
    public class JobPositionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public JobPositionsController(AppDbContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách toàn bộ Vị trí
        [HttpGet]
        public async Task<IActionResult> GetJobPositions()
        {
            var positions = await _context.JobPositions.ToListAsync();
            return Ok(positions);
        }

        // 2. Tạo Vị trí mới
        [HttpPost]
        public async Task<IActionResult> CreateJobPosition([FromBody] JobPosition position)
        {
            if (string.IsNullOrEmpty(position.Name)) return BadRequest("Tên vị trí không được để trống");
            
            position.Id = Guid.NewGuid().ToString();
            _context.JobPositions.Add(position);
            await _context.SaveChangesAsync();

            return Ok(position);
        }
    }
}