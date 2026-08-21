using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using System.Linq;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MetadataController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MetadataController(AppDbContext context)
        {
            _context = context;
        }

        // Lấy danh sách Lĩnh vực & Chuyên ngành con (đã làm phẳng)
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Categories
                .Where(c => c.IsActive)
                .Select(c => new {
                    id = c.CategoryID,
                    name = c.Name,
                    parentId = c.ParentId
                })
                .ToListAsync();

            return Ok(categories);
        }

        // Lấy danh sách cấp bậc
        [HttpGet("job-levels")]
        public async Task<IActionResult> GetJobLevels()
        {
            var levels = await _context.JobLevels
                .Where(l => l.IsActive)
                .OrderBy(l => l.Name)
                .Select(l => new {
                    id = l.JobLevelID,
                    name = l.Name,
                    parentId = l.ParentId
                })
                .ToListAsync();

            return Ok(levels);
        }

        // Lấy danh sách Chi nhánh / Địa điểm
        [HttpGet("branches")]
        public async Task<IActionResult> GetBranches()
        {
            var branches = await _context.Branches
                .Where(b => b.IsActive)
                .OrderBy(b => b.BranchName)
                .Select(b => new {
                    id = b.BranchID,
                    name = b.BranchName
                })
                .ToListAsync();

            return Ok(branches);
        }

        [HttpGet("criterion-groups")]
        public async Task<IActionResult> GetCriterionGroups()
        {
            var groups = await _context.CriterionGroups
                .Where(group => group.IsActive)
                .OrderBy(group => group.DisplayOrder)
                .ThenBy(group => group.Name)
                .Select(group => new
                {
                    id = group.CriterionGroupID,
                    name = group.Name,
                    evaluationMode = group.EvaluationMode,
                    description = group.Description
                })
                .ToListAsync();

            return Ok(groups);
        }
    }
}
