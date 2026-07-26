using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
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
        private readonly AppDbContext _context;
        private readonly IAuditLogService _auditLogService;

        public RolesController(AppDbContext context, IAuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        private static RoleItemDto ToDto(Role role)
        {
            return new RoleItemDto
            {
                Id = role.RoleID,
                Name = role.Name,
                Description = role.Description,
                Permissions = role.GetPermissions()
            };
        }

        [HttpGet]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles
                .OrderBy(role => role.CreatedAt)
                .ToListAsync();

            var result = roles.Select(ToDto).ToList();
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRole([FromBody] RoleItemDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Tên vai trò không được để trống.");

            var newRole = new Role
            {
                Name = request.Name,
                Description = request.Description ?? "",
            };
            newRole.SetPermissions(request.Permissions ?? new List<string>());

            _context.Roles.Add(newRole);
            await _context.SaveChangesAsync();

            var adminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Admin";
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.WriteLogAsync(adminEmail, "Tạo vai trò mới", $"Vai trò: {newRole.Name}", ipAddress);

            return Ok(new { message = "Thêm mới vai trò thành công!", role = ToDto(newRole) });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRole(string id, [FromBody] RoleItemDto request)
        {
            var existing = await _context.Roles.FirstOrDefaultAsync(role => role.RoleID == id);
            if (existing == null)
                return NotFound("Không tìm thấy vai trò.");

            existing.Name = request.Name ?? existing.Name;
            existing.Description = request.Description ?? existing.Description;
            if (request.Permissions != null)
            {
                existing.SetPermissions(request.Permissions);
            }

            await _context.SaveChangesAsync();

            var adminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Admin";
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.WriteLogAsync(adminEmail, "Cập nhật phân quyền vai trò", $"Vai trò: {existing.Name}", ipAddress);

            return Ok(new { message = "Cập nhật vai trò thành công!", role = ToDto(existing) });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRole(string id)
        {
            var existing = await _context.Roles.FirstOrDefaultAsync(role => role.RoleID == id);
            if (existing == null)
                return NotFound("Không tìm thấy vai trò.");

            _context.Roles.Remove(existing);
            await _context.SaveChangesAsync();

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
