using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
using System;
using System.Collections.Concurrent;
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
        private readonly IAuditLogService _auditLogService;

        // Theo dõi tần suất gửi OTP khôi phục mật khẩu (Email -> (Count, LastSent))
        private static readonly ConcurrentDictionary<string, (int Count, DateTime LastSent)> _otpRequestTracker = new();

        public AuthController(IAuthService authService, AppDbContext context, IEmailSenderService emailSenderService, IAuditLogService auditLogService)
        {
            _authService = authService;
            _context = context;
            _emailSenderService = emailSenderService;
            _auditLogService = auditLogService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var response = await _authService.LoginAsync(request);
                
                // GHI NHẬT KÝ BẢO MẬT ĐĂNG NHẬP
                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                await _auditLogService.WriteLogAsync(request.Email ?? "User", "Đăng nhập hệ thống", "Xác thực tài khoản thành công", ipAddress);

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
                return BadRequest(new { message = "Email không được để trống." });
            }

            var emailKey = request.Email.Trim().ToLower();
            var now = DateTime.Now;

            // KIỂM TRA TẦN SUẤT GỬI OTP (COOLDOWN 60s & GIỚI HẠN 3 LẦN / 10 PHÚT)
            if (_otpRequestTracker.TryGetValue(emailKey, out var trackingInfo))
            {
                var timeSinceLastSent = (now - trackingInfo.LastSent).TotalSeconds;
                if (timeSinceLastSent < 60)
                {
                    int remaining = (int)Math.Ceiling(60 - timeSinceLastSent);
                    return BadRequest(new { message = $"Vui lòng đợi {remaining} giây trước khi yêu cầu mã OTP mới." });
                }

                if ((now - trackingInfo.LastSent).TotalMinutes < 10)
                {
                    if (trackingInfo.Count >= 3)
                    {
                        return BadRequest(new { message = "Bạn đã vượt quá giới hạn 3 lần yêu cầu gửi OTP trong 10 phút. Vui lòng thử lại sau." });
                    }
                    _otpRequestTracker[emailKey] = (trackingInfo.Count + 1, now);
                }
                else
                {
                    _otpRequestTracker[emailKey] = (1, now);
                }
            }
            else
            {
                _otpRequestTracker[emailKey] = (1, now);
            }

            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Email == request.Email);
            if (account == null)
            {
                return NotFound(new { message = "Không tìm thấy tài khoản với email này trong hệ thống." });
            }

            var otp = new Random().Next(100000, 999999).ToString();
            account.PasswordResetOtp = otp;
            account.OtpExpiry = DateTime.Now.AddMinutes(10);

            _context.Accounts.Update(account);
            await _context.SaveChangesAsync();

            var subject = "Mã OTP khôi phục mật khẩu - AI Recruitment";
            var body = $"Chào bạn,\n\nBạn đã yêu cầu khôi phục mật khẩu tài khoản của mình tại hệ thống AI Recruitment. Mã xác thực (OTP) của bạn là:\n\n{otp}\n\nMã này có hiệu lực trong vòng 10 phút. Nếu bạn không yêu cầu hành động này, vui lòng bảo mật tài khoản.\n\nTrân trọng,\nĐội ngũ tuyển dụng AI.";
            
            Console.WriteLine($"[SECURITY OTP] Generated OTP for {account.Email}: {otp}");
            var emailResult = await _emailSenderService.SendEmailAsync(account.Email, subject, body, isHtml: false);

            if (!emailResult.IsSuccess)
            {
                Console.WriteLine($"[SMTP WARNING] Failed to send email to {account.Email}: {emailResult.Message}");
                return Ok(new { message = "Mã OTP khôi phục mật khẩu đã được tạo (Bypass: Email gửi lỗi, vui lòng lấy OTP từ server console)." });
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

            var passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<Account>();
            account.PasswordHash = passwordHasher.HashPassword(account, request.NewPassword);
            account.PasswordResetOtp = null;
            account.OtpExpiry = null;
            account.AccessFailedCount = 0;
            account.LockoutEnd = null;

            _context.Accounts.Update(account);
            await _context.SaveChangesAsync();

            // XÓA THEO DÕI OTP KHI ĐỔI MẬT KHẨU THÀNH CÔNG
            var emailKey = request.Email.Trim().ToLower();
            _otpRequestTracker.TryRemove(emailKey, out _);

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

            var passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<Account>();
            var verificationResult = passwordHasher.VerifyHashedPassword(
                account,
                account.PasswordHash ?? string.Empty,
                request.CurrentPassword
            );

            if (verificationResult == Microsoft.AspNetCore.Identity.PasswordVerificationResult.Failed)
            {
                return BadRequest("Mật khẩu hiện tại không chính xác.");
            }

            account.PasswordHash = passwordHasher.HashPassword(account, request.NewPassword);
            _context.Accounts.Update(account);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đổi mật khẩu thành công!" });
        }
    }
}