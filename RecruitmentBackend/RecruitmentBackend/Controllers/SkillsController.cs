using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using RecruitmentBackend.Models;

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

        [HttpGet("observations")]
        public async Task<IActionResult> GetObservations(
            [FromQuery] string status = SkillObservationStatuses.CandidateForReview,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);
            var allowedStatuses = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                SkillObservationStatuses.Quarantine,
                SkillObservationStatuses.CandidateForReview,
                SkillObservationStatuses.Mapped,
                SkillObservationStatuses.Approved,
                SkillObservationStatuses.Rejected
            };
            if (!allowedStatuses.Contains(status))
                return BadRequest("Trạng thái quan sát kỹ năng không hợp lệ.");

            var rows = await _context.SkillObservations
                .AsNoTracking()
                .Where(item => item.Status == status)
                .OrderByDescending(item => item.LastObservedAtUtc)
                .ToListAsync();
            var grouped = rows
                .GroupBy(item => item.NormalizedCandidate, StringComparer.OrdinalIgnoreCase)
                .Select(group => new
                {
                    normalizedCandidate = group.Key,
                    displayText = group.OrderByDescending(item => item.Confidence).First().DisplayText,
                    status = group.First().Status,
                    independentSources = group.Select(item => $"{item.SourceType}:{item.SourceEntityID}")
                        .Distinct(StringComparer.OrdinalIgnoreCase).Count(),
                    cvSources = group.Where(item => item.SourceType == "CV")
                        .Select(item => item.SourceEntityID).Distinct(StringComparer.OrdinalIgnoreCase).Count(),
                    jobSources = group.Where(item => item.SourceType == "JD")
                        .Select(item => item.SourceEntityID).Distinct(StringComparer.OrdinalIgnoreCase).Count(),
                    averageConfidence = Math.Round(group.Average(item => item.Confidence), 2),
                    firstObservedAtUtc = group.Min(item => item.FirstObservedAtUtc),
                    lastObservedAtUtc = group.Max(item => item.LastObservedAtUtc),
                    sampleObservationId = group.OrderByDescending(item => item.Confidence)
                        .First().SkillObservationID,
                    sampleEvidence = group.OrderByDescending(item => item.Confidence)
                        .First().EvidenceText,
                    resolvedSkillId = group.Select(item => item.ResolvedSkillID).FirstOrDefault(value => value.HasValue)
                })
                .OrderByDescending(item => item.independentSources)
                .ThenByDescending(item => item.averageConfidence)
                .ToList();

            return Ok(new
            {
                status,
                totalCandidates = grouped.Count,
                page,
                pageSize,
                items = grouped.Skip((page - 1) * pageSize).Take(pageSize)
            });
        }

        [HttpPost("observations/{observationId:long}/map")]
        public async Task<IActionResult> MapObservation(
            long observationId,
            [FromBody] MapSkillObservationRequest request)
        {
            var observation = await _context.SkillObservations
                .FirstOrDefaultAsync(item => item.SkillObservationID == observationId);
            if (observation == null) return NotFound("Không tìm thấy quan sát kỹ năng.");

            var skill = await _context.Skills
                .Include(item => item.Aliases)
                .FirstOrDefaultAsync(item => item.Id == request.SkillId && item.IsApproved);
            if (skill == null) return NotFound("Không tìm thấy kỹ năng đã duyệt để ánh xạ.");

            var conflict = await FindTaxonomyConflictAsync(observation.NormalizedCandidate, skill.Id);
            if (conflict != null) return BadRequest(conflict);

            if (SkillTaxonomyNormalizer.NormalizeKey(skill.Name) != observation.NormalizedCandidate
                && !skill.Aliases.Any(alias => alias.NormalizedAlias == observation.NormalizedCandidate))
            {
                _context.SkillAliases.Add(new SkillAlias
                {
                    SkillID = skill.Id,
                    Alias = observation.DisplayText,
                    NormalizedAlias = observation.NormalizedCandidate
                });
            }

            var updated = await ResolveObservationGroupAsync(
                observation.NormalizedCandidate,
                skill.Id,
                SkillObservationStatuses.Mapped,
                "Đã ánh xạ vào kỹ năng hiện có.");
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Đã ánh xạ {updated} nguồn quan sát vào kỹ năng {skill.Name}." });
        }

        [HttpPost("observations/{observationId:long}/approve-new")]
        public async Task<IActionResult> ApproveNewObservation(
            long observationId,
            [FromBody] ApproveSkillObservationRequest request)
        {
            var canonicalName = request?.CanonicalName?.Trim() ?? string.Empty;
            var canonicalKey = SkillTaxonomyNormalizer.NormalizeKey(canonicalName);
            if (canonicalName.Length == 0 || canonicalName.Length > 100 || canonicalKey.Length == 0)
                return BadRequest("Tên kỹ năng chuẩn không hợp lệ.");

            var observation = await _context.SkillObservations
                .FirstOrDefaultAsync(item => item.SkillObservationID == observationId);
            if (observation == null) return NotFound("Không tìm thấy quan sát kỹ năng.");

            await using var transaction = await _context.Database.BeginTransactionAsync();
            var allSkills = await _context.Skills.Include(item => item.Aliases).ToListAsync();
            var skill = allSkills.FirstOrDefault(item =>
                SkillTaxonomyNormalizer.NormalizeKey(item.Name) == canonicalKey);
            if (skill == null)
            {
                skill = new Skill { Name = canonicalName, IsApproved = true };
                _context.Skills.Add(skill);
                await _context.SaveChangesAsync();
            }
            else
            {
                skill.IsApproved = true;
                skill.Name = canonicalName;
            }

            var conflict = await FindTaxonomyConflictAsync(observation.NormalizedCandidate, skill.Id);
            if (conflict != null)
            {
                await transaction.RollbackAsync();
                return BadRequest(conflict);
            }
            if (canonicalKey != observation.NormalizedCandidate
                && !skill.Aliases.Any(alias => alias.NormalizedAlias == observation.NormalizedCandidate))
            {
                _context.SkillAliases.Add(new SkillAlias
                {
                    SkillID = skill.Id,
                    Alias = observation.DisplayText,
                    NormalizedAlias = observation.NormalizedCandidate
                });
            }

            var updated = await ResolveObservationGroupAsync(
                observation.NormalizedCandidate,
                skill.Id,
                SkillObservationStatuses.Approved,
                "Đã duyệt thành kỹ năng chuẩn.");
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return Ok(new { message = $"Đã duyệt kỹ năng {skill.Name} từ {updated} nguồn quan sát." });
        }

        [HttpPost("observations/{observationId:long}/reject")]
        public async Task<IActionResult> RejectObservation(
            long observationId,
            [FromBody] RejectSkillObservationRequest request)
        {
            var observation = await _context.SkillObservations
                .FirstOrDefaultAsync(item => item.SkillObservationID == observationId);
            if (observation == null) return NotFound("Không tìm thấy quan sát kỹ năng.");

            var reason = string.IsNullOrWhiteSpace(request?.Reason)
                ? "Không được chấp nhận vào taxonomy."
                : request.Reason.Trim();
            if (reason.Length > 500) return BadRequest("Lý do từ chối không được vượt quá 500 ký tự.");
            var updated = await ResolveObservationGroupAsync(
                observation.NormalizedCandidate,
                null,
                SkillObservationStatuses.Rejected,
                reason);
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Đã từ chối {updated} nguồn quan sát cùng kỹ năng." });
        }

        private async Task<string?> FindTaxonomyConflictAsync(string normalizedCandidate, int targetSkillId)
        {
            var approvedNames = await _context.Skills.AsNoTracking()
                .Where(item => item.IsApproved && item.Id != targetSkillId)
                .Select(item => new { item.Id, item.Name })
                .ToListAsync();
            var nameConflict = approvedNames.FirstOrDefault(item =>
                SkillTaxonomyNormalizer.NormalizeKey(item.Name) == normalizedCandidate);
            if (nameConflict != null)
                return $"Cụm này đã là tên chuẩn của kỹ năng {nameConflict.Name}.";

            var aliasConflict = await _context.SkillAliases.AsNoTracking()
                .FirstOrDefaultAsync(item => item.NormalizedAlias == normalizedCandidate
                    && item.SkillID != targetSkillId);
            return aliasConflict == null
                ? null
                : "Cụm này đã là bí danh của một kỹ năng khác.";
        }

        private async Task<int> ResolveObservationGroupAsync(
            string normalizedCandidate,
            int? skillId,
            string status,
            string note)
        {
            var rows = await _context.SkillObservations
                .Where(item => item.NormalizedCandidate == normalizedCandidate)
                .ToListAsync();
            var nowUtc = DateTime.UtcNow;
            foreach (var row in rows)
            {
                row.Status = status;
                row.ResolvedSkillID = skillId;
                row.ReviewNote = note;
                row.ReviewedAtUtc = nowUtc;
            }
            return rows.Count;
        }
    }
}
