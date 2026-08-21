using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;
using RecruitmentBackend.Services;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Controllers
{
    public class CriterionGroupRequest
    {
        [Required, MaxLength(150)] public string Name { get; set; } = string.Empty;
        [Required, MaxLength(40)] public string EvaluationMode { get; set; } = "CUSTOM";
        [MaxLength(500)] public string? Description { get; set; }
        public int DisplayOrder { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class CriterionGroupsController : ControllerBase
    {
        private static readonly HashSet<string> AllowedModes = new(StringComparer.OrdinalIgnoreCase)
        {
            "SKILL", "TOTAL_EXPERIENCE", "SKILL_EXPERIENCE", "EDUCATION",
            "CERTIFICATION", "LANGUAGE", "LOCATION_WORK_MODE", "CUSTOM"
        };

        private readonly AppDbContext _context;
        private readonly IMetadataChangeNotifier _notifier;

        public CriterionGroupsController(AppDbContext context, IMetadataChangeNotifier notifier)
        {
            _context = context;
            _notifier = notifier;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _context.CriterionGroups
                .OrderBy(item => item.DisplayOrder).ThenBy(item => item.Name)
                .Select(item => ToResponse(item))
                .ToListAsync();
            return Ok(items);
        }

        [HttpPost, Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(CriterionGroupRequest request)
        {
            var error = await ValidateRequest(request);
            if (error != null) return BadRequest(error);

            var item = new CriterionGroup
            {
                Name = request.Name.Trim(),
                EvaluationMode = request.EvaluationMode.Trim().ToUpperInvariant(),
                Description = Normalize(request.Description),
                DisplayOrder = request.DisplayOrder
            };
            _context.CriterionGroups.Add(item);
            await _context.SaveChangesAsync();
            await _notifier.NotifyAsync("criterion-groups", "created");
            return Ok(ToResponse(item));
        }

        [HttpPut("{id}"), Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(string id, CriterionGroupRequest request)
        {
            var item = await _context.CriterionGroups.FindAsync(id);
            if (item == null) return NotFound("Không tìm thấy nhóm tiêu chí.");
            var error = await ValidateRequest(request, id);
            if (error != null) return BadRequest(error);

            item.Name = request.Name.Trim();
            item.EvaluationMode = request.EvaluationMode.Trim().ToUpperInvariant();
            item.Description = Normalize(request.Description);
            item.DisplayOrder = request.DisplayOrder;
            item.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            await _notifier.NotifyAsync("criterion-groups", "updated");
            return Ok(ToResponse(item));
        }

        [HttpPut("{id}/toggle-status"), Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleStatus(string id)
        {
            var item = await _context.CriterionGroups.FindAsync(id);
            if (item == null) return NotFound("Không tìm thấy nhóm tiêu chí.");
            item.IsActive = !item.IsActive;
            item.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            await _notifier.NotifyAsync("criterion-groups", "status-changed");
            return Ok(ToResponse(item));
        }

        private async Task<string?> ValidateRequest(CriterionGroupRequest request, string? excludedId = null)
        {
            if (string.IsNullOrWhiteSpace(request.Name)) return "Tên nhóm tiêu chí không được để trống.";
            var mode = request.EvaluationMode?.Trim().ToUpperInvariant() ?? string.Empty;
            if (!AllowedModes.Contains(mode)) return "Cách đánh giá không hợp lệ.";
            var normalizedName = request.Name.Trim().ToLower();
            var duplicated = await _context.CriterionGroups.AnyAsync(item =>
                item.CriterionGroupID != excludedId && item.Name.ToLower() == normalizedName);
            return duplicated ? "Tên nhóm tiêu chí đã tồn tại." : null;
        }

        private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static object ToResponse(CriterionGroup item) => new
        {
            id = item.CriterionGroupID,
            name = item.Name,
            evaluationMode = item.EvaluationMode,
            description = item.Description,
            displayOrder = item.DisplayOrder,
            isActive = item.IsActive
        };
    }
}
