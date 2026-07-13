using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
using System;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly AppDbContext _context;
        private readonly IEmailSenderService _emailSenderService;

        public AuthController(IAuthService authService, AppDbContext context, IEmailSenderService emailSenderService)
        {
            _authService = authService;
            _context = context;
            _emailSenderService = emailSenderService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var response = await _authService.LoginAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        public class ForgotPasswordRequest
        {
            public string Email { get; set; }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Email))
            {
                return BadRequest("Email không được để trống.");
            }

            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Email == request.Email);
            if (account == null)
            {
                return NotFound("Không tìm thấy tài khoản với email này trong hệ thống.");
            }

            var otp = new Random().Next(100000, 999999).ToString();
            account.PasswordResetOtp = otp;
            account.OtpExpiry = DateTime.Now.AddMinutes(10);

            _context.Accounts.Update(account);
            await _context.SaveChangesAsync();

            var subject = "Mã OTP khôi phục mật khẩu - AI Recruitment";
            var body = $"Chào bạn,\n\nBạn đã yêu cầu khôi phục mật khẩu tài khoản của mình tại hệ thống AI Recruitment. Mã xác thực (OTP) của bạn là:\n\n{otp}\n\nMã này có hiệu lực trong vòng 10 phút. Nếu bạn không yêu cầu hành động này, vui lòng bảo mật tài khoản.\n\nTrân trọng,\nĐội ngũ tuyển dụng AI.";
            
            var emailResult = await _emailSenderService.SendEmailAsync(account.Email, subject, body, isHtml: false);

            if (!emailResult.IsSuccess)
            {
                return BadRequest($"Gửi email OTP thất bại: {emailResult.Message}");
            }

            return Ok(new { message = "Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn." });
        }

        public class ResetPasswordRequest
        {
            public string Email { get; set; }
            public string Otp { get; set; }
            public string NewPassword { get; set; }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Otp) || string.IsNullOrEmpty(request.NewPassword))
            {
                return BadRequest("Dữ liệu gửi lên không đầy đủ.");
            }

            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Email == request.Email);
            if (account == null)
            {
                return NotFound("Tài khoản không tồn tại.");
            }

            if (account.PasswordResetOtp != request.Otp)
            {
                return BadRequest("Mã xác thực OTP không chính xác.");
            }

            if (account.OtpExpiry == null || account.OtpExpiry < DateTime.Now)
            {
                return BadRequest("Mã xác thực OTP đã hết hạn.");
            }

            account.PasswordHash = request.NewPassword;
            account.PasswordResetOtp = null;
            account.OtpExpiry = null;
            account.AccessFailedCount = 0;
            account.LockoutEnd = null;

            _context.Accounts.Update(account);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Khôi phục mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới để đăng nhập." });
        }

        public class ChangePasswordRequest
        {
            public string CurrentPassword { get; set; }
            public string NewPassword { get; set; }
        }

        [HttpPost("change-password")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.CurrentPassword) || string.IsNullOrEmpty(request.NewPassword))
            {
                return BadRequest("Dữ liệu không hợp lệ.");
            }

            string accountId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return Unauthorized("Không xác định được tài khoản.");

            var account = await _context.Accounts.FindAsync(accountId);
            if (account == null) return NotFound("Tài khoản không tồn tại.");

            if (account.PasswordHash != request.CurrentPassword)
            {
                return BadRequest("Mật khẩu hiện tại không chính xác.");
            }

            account.PasswordHash = request.NewPassword;
            _context.Accounts.Update(account);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đổi mật khẩu thành công!" });
        }
    }
}