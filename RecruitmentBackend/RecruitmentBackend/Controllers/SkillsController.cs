using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SkillsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SkillsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetSkills()
        {
            var skills = await _context.Skills
                .OrderBy(s => s.Name)
                .ToListAsync();
            return Ok(skills);
        }

        [HttpPost("sync")]
        public async Task<IActionResult> SyncSkills([FromBody] List<string> newSkills)
        {
            if (newSkills == null || !newSkills.Any())
            {
                return BadRequest("Danh sách kỹ năng rỗng.");
            }

            var existingSkills = await _context.Skills
                .Select(s => s.Name.ToLower().Trim())
                .ToListAsync();

            var addedCount = 0;
            foreach (var skillName in newSkills)
            {
                var cleanedName = skillName.Trim();
                if (string.IsNullOrEmpty(cleanedName) || cleanedName.Length > 100) continue;

                if (!existingSkills.Contains(cleanedName.ToLower()))
                {
                    _context.Skills.Add(new Skill
                    {
                        Name = cleanedName,
                        IsApproved = true
                    });
                    existingSkills.Add(cleanedName.ToLower());
                    addedCount++;
                }
            }

            if (addedCount > 0)
            {
                await _context.SaveChangesAsync();
            }

            return Ok(new { status = "success", message = $"Đã đồng bộ thành công. Thêm mới {addedCount} kỹ năng.", added_count = addedCount });
        }
    }
}
