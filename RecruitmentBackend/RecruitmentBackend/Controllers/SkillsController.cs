using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Models;
using RecruitmentBackend.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Authorize(Roles = "Admin")]
    public class SkillsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SkillsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetSkills()
        {
            var skills = await _context.Skills
                .AsNoTracking()
                .Where(s => s.IsApproved)
                .OrderBy(s => s.Name)
                .Select(skill => new SkillTaxonomyResponse
                {
                    Id = skill.Id,
                    Name = skill.Name,
                    IsApproved = skill.IsApproved,
                    Aliases = skill.Aliases
                        .OrderBy(alias => alias.Alias)
                        .Select(alias => new SkillAliasResponse
                        {
                            Id = alias.SkillAliasID,
                            Alias = alias.Alias
                        })
                        .ToList()
                })
                .ToListAsync();
            return Ok(skills);
        }

        [HttpPost("{skillId:int}/aliases")]
        public async Task<IActionResult> CreateAlias(int skillId, [FromBody] CreateSkillAliasRequest request)
        {
            var aliasText = request?.Alias?.Trim() ?? string.Empty;
            var normalizedAlias = SkillTaxonomyNormalizer.NormalizeKey(aliasText);
            if (normalizedAlias.Length == 0)
                return BadRequest("Bí danh kỹ năng không được để trống.");

            var skill = await _context.Skills.FirstOrDefaultAsync(item => item.Id == skillId);
            if (skill == null) return NotFound("Không tìm thấy kỹ năng cần thêm bí danh.");
            if (!skill.IsApproved) return BadRequest("Chỉ được thêm bí danh cho kỹ năng đã duyệt.");

            var approvedNames = await _context.Skills
                .Where(item => item.IsApproved)
                .Select(item => new { item.Id, item.Name })
                .ToListAsync();
            var conflictingSkill = approvedNames.FirstOrDefault(item =>
                SkillTaxonomyNormalizer.NormalizeKey(item.Name) == normalizedAlias);
            if (conflictingSkill != null)
            {
                return BadRequest(conflictingSkill.Id == skillId
                    ? "Bí danh trùng với tên chuẩn của kỹ năng này."
                    : $"Bí danh đang là tên chuẩn của kỹ năng {conflictingSkill.Name}.");
            }

            var existingAliases = await _context.SkillAliases.AsNoTracking().ToListAsync();
            var conflictingAlias = existingAliases.FirstOrDefault(item =>
                string.Equals(item.NormalizedAlias, normalizedAlias, StringComparison.OrdinalIgnoreCase));
            if (conflictingAlias != null)
                return BadRequest("Bí danh này đã được gán cho một kỹ năng khác.");

            var alias = new SkillAlias
            {
                SkillID = skillId,
                Alias = aliasText,
                NormalizedAlias = normalizedAlias
            };
            _context.SkillAliases.Add(alias);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSkills), new SkillAliasResponse
            {
                Id = alias.SkillAliasID,
                Alias = alias.Alias
            });
        }

        [HttpDelete("{skillId:int}/aliases/{aliasId:int}")]
        public async Task<IActionResult> DeleteAlias(int skillId, int aliasId)
        {
            var alias = await _context.SkillAliases
                .FirstOrDefaultAsync(item => item.SkillAliasID == aliasId && item.SkillID == skillId);
            if (alias == null) return NotFound("Không tìm thấy bí danh kỹ năng.");

            _context.SkillAliases.Remove(alias);
            await _context.SaveChangesAsync();
            return NoContent();
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
                        IsApproved = false
                    });
                    existingSkills.Add(cleanedName.ToLower());
                    addedCount++;
                }
            }

            if (addedCount > 0)
            {
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                status = "success",
                message = $"Đã đưa {addedCount} kỹ năng mới vào hàng chờ duyệt; chưa dùng để chấm điểm hoặc khai phá.",
                added_count = addedCount
            });
        }
    }
}
