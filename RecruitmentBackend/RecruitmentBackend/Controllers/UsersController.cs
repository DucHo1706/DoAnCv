using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Data;
using System.Security.Claims;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")] // Khóa API: Yêu cầu phải đăng nhập và là Admin!
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IAuditLogService _auditLogService;
        private readonly AppDbContext _context;

        public UsersController(IUserService userService, IAuditLogService auditLogService, AppDbContext context)
        {
            _userService = userService;
            _auditLogService = auditLogService;
            _context = context;
        }

        // 1. API Lấy danh sách toàn bộ người dùng cho Admin
        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(users);
        }

        // 2. API Khóa / Mở khóa tài khoản (Ban/Unban)
        [HttpPut("{id}/toggle-status")]
        public async Task<IActionResult> ToggleUserStatus(string id)
        {
            var targetAccount = await _context.Accounts.FindAsync(id);
            var targetEmail = targetAccount?.Email ?? id;

            var result = await _userService.ToggleUserStatusAsync(id);
            if (!result.Success) return NotFound(new { message = result.Message });
            
            // GHI NHẬT KÝ HỆ THỐNG
            var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "Admin";
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var actionText = result.NewStatus == "Active" ? "Mở khóa tài khoản" : "Khóa tài khoản";
            await _auditLogService.WriteLogAsync(adminEmail, actionText, $"Tài khoản: {targetEmail}", ipAddress);

            return Ok(new { message = result.Message, newStatus = result.NewStatus });
        }

        // 3. API Tạo tài khoản mới
        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            var result = await _userService.CreateUserAsync(request);
            if (!result.Success) return BadRequest(new { message = result.Message });

            // GHI NHẬT KÝ HỆ THỐNG
            var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "Admin";
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.WriteLogAsync(adminEmail, "Tạo tài khoản", $"Tài khoản: {request.Email} ({request.Role})", ipAddress);

            return Ok(new { message = result.Message });
        }

        // 4. API Cập nhật tài khoản
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserRequest request)
        {
            var targetAccount = await _context.Accounts.FindAsync(id);
            var targetEmail = targetAccount?.Email ?? id;

            var result = await _userService.UpdateUserAsync(id, request);
            if (!result.Success) return BadRequest(new { message = result.Message });

            // GHI NHẬT KÝ HỆ THỐNG
            var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "Admin";
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.WriteLogAsync(adminEmail, "Cập nhật tài khoản", $"Tài khoản: {targetEmail}", ipAddress);

            return Ok(new { message = result.Message });
        }

        // 5. API Đăng ký tài khoản dành riêng cho Ứng viên (Không cần đăng nhập Admin)
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> RegisterCandidate([FromBody] CreateUserRequest request)
        {
            request.Role = "Candidate"; // Bắt buộc là Candidate để tránh bị hack quyền Admin
            var result = await _userService.CreateUserAsync(request);
            if (!result.Success) return BadRequest(new { message = result.Message });

            return Ok(new { message = "Đăng ký thành công!" });
        }
    }
}
