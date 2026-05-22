using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")] // Khóa API: Yêu cầu phải đăng nhập và là Admin!
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
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
            var result = await _userService.ToggleUserStatusAsync(id);
            if (!result.Success) return NotFound(new { message = result.Message });
            
            return Ok(new { message = result.Message, newStatus = result.NewStatus });
        }

        // 3. API Tạo tài khoản mới
        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            var result = await _userService.CreateUserAsync(request);
            if (!result.Success) return BadRequest(new { message = result.Message });

            return Ok(new { message = result.Message });
        }

        // 4. API Cập nhật tài khoản
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserRequest request)
        {
            var result = await _userService.UpdateUserAsync(id, request);
            if (!result.Success) return BadRequest(new { message = result.Message });

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
