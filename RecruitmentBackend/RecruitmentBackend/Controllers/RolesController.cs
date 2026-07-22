using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecruitmentBackend.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class RolesController : ControllerBase
    {
        private readonly IAuditLogService _auditLogService;

        // Persistent in-memory dynamic role database store for roles & permissions
        private static List<RoleItemDto> _rolesStore = new List<RoleItemDto>
        {
            new RoleItemDto
            {
                Id = "1",
                Name = "Admin",
                Description = "Quản trị viên toàn quyền hệ thống tuyển dụng & AI",
                Permissions = new List<string> { "manage_users", "approve_jobs", "publish_close_jobs", "manage_roles", "view_audit_logs", "manage_branches", "view_reports", "train_ai_models" }
            },
            new RoleItemDto
            {
                Id = "2",
                Name = "Recruiter",
                Description = "Nhà tuyển dụng (Trưởng phòng / Chuyên viên HR)",
                Permissions = new List<string> { "create_jobs", "publish_close_jobs", "view_candidates", "view_ai_scores", "send_interview_emails", "manage_talent_pool" }
            },
            new RoleItemDto
            {
                Id = "3",
                Name = "Candidate",
                Description = "Ứng viên tìm việc & nộp hồ sơ CV",
                Permissions = new List<string> { "apply_jobs", "view_jobs", "manage_profile", "use_chatbot" }
            }
        };

        public RolesController(IAuditLogService auditLogService)
        {
            _auditLogService = auditLogService;
        }

        [HttpGet]
        public IActionResult GetRoles()
        {
            return Ok(_rolesStore);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRole([FromBody] RoleItemDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Tên vai trò không được để trống.");

            request.Id = System.DateTime.Now.Ticks.ToString();
            request.Permissions ??= new List<string>();
            _rolesStore.Add(request);

            var adminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Admin";
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.WriteLogAsync(adminEmail, "Tạo vai trò mới", $"Vai trò: {request.Name}", ipAddress);

            return Ok(new { message = "Thêm mới vai trò thành công!", role = request });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRole(string id, [FromBody] RoleItemDto request)
        {
            var existing = _rolesStore.FirstOrDefault(r => r.Id == id);
            if (existing == null)
                return NotFound("Không tìm thấy vai trò.");

            existing.Name = request.Name ?? existing.Name;
            existing.Description = request.Description ?? existing.Description;
            existing.Permissions = request.Permissions ?? existing.Permissions;

            var adminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Admin";
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.WriteLogAsync(adminEmail, "Cập nhật phân quyền vai trò", $"Vai trò: {existing.Name}", ipAddress);

            return Ok(new { message = "Cập nhật vai trò thành công!", role = existing });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRole(string id)
        {
            var existing = _rolesStore.FirstOrDefault(r => r.Id == id);
            if (existing == null)
                return NotFound("Không tìm thấy vai trò.");

            _rolesStore.Remove(existing);

            var adminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Admin";
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.WriteLogAsync(adminEmail, "Xóa vai trò hệ thống", $"Vai trò: {existing.Name}", ipAddress);

            return Ok(new { message = "Đã xóa vai trò thành công!" });
        }
    }

    public class RoleItemDto
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public List<string> Permissions { get; set; } = new List<string>();
    }
}
