using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using System.Security.Claims;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminProfileController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminProfileController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return Unauthorized("Không xác định được tài khoản.");

            var account = await _context.Accounts.FindAsync(accountId);
            if (account == null) return NotFound("Tài khoản không tồn tại.");

            return Ok(new
            {
                accountId = account.AccountID,
                email = account.Email,
                role = account.Role,
                status = account.Status,
                createdAt = account.CreatedAt
            });
        }
    }
}
