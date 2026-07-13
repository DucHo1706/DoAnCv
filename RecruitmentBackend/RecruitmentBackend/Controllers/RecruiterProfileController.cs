using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Recruiter")]
    public class RecruiterProfileController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RecruiterProfileController(AppDbContext context)
        {
            _context = context;
        }

        public class UpdateRecruiterProfileRequest
        {
            public string FullName { get; set; }
            public string Phone { get; set; }
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return Unauthorized("Không xác định được tài khoản.");

            var recruiter = await _context.Recruiters
                .FirstOrDefaultAsync(r => r.AccountID == accountId);

            if (recruiter == null)
            {
                var account = await _context.Accounts.FindAsync(accountId);
                if (account == null) return NotFound("Tài khoản không tồn tại.");

                recruiter = new Recruiter
                {
                    RecruiterID = Guid.NewGuid().ToString(),
                    AccountID = accountId,
                    FullName = account.Email.Split('@')[0],
                    Phone = ""
                };
                _context.Recruiters.Add(recruiter);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                fullName = recruiter.FullName,
                phone = recruiter.Phone
            });
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateRecruiterProfileRequest request)
        {
            if (request == null) return BadRequest("Dữ liệu không hợp lệ.");

            string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return Unauthorized("Không xác định được tài khoản.");

            var recruiter = await _context.Recruiters
                .FirstOrDefaultAsync(r => r.AccountID == accountId);

            if (recruiter == null) return NotFound("Không tìm thấy thông tin nhà tuyển dụng.");

            recruiter.FullName = request.FullName;
            recruiter.Phone = request.Phone;

            _context.Recruiters.Update(recruiter);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật thông tin thành công!" });
        }
    }
}
