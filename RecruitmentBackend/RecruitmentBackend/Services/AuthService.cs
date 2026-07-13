using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Interfaces;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace RecruitmentBackend.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthService(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        public async Task<LoginResponse> LoginAsync(LoginRequest request)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Email == request.Email);

            if (account == null)
            {
                throw new Exception("Email hoặc mật khẩu không chính xác.");
            }

            // Kiểm tra tài khoản có đang bị khóa tạm thời do nhập sai quá 5 lần không
            if (account.LockoutEnd != null && account.LockoutEnd > DateTime.Now)
            {
                var remainingMinutes = Math.Ceiling((account.LockoutEnd.Value - DateTime.Now).TotalMinutes);
                throw new Exception($"Tài khoản của bạn tạm thời bị khóa do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau {remainingMinutes} phút.");
            }

            if (account.Status != "Active")
            {
                throw new Exception("Tài khoản của bạn đã bị khóa.");
            }

            if (account.PasswordHash != request.Password)
            {
                account.AccessFailedCount += 1;
                if (account.AccessFailedCount >= 5)
                {
                    account.LockoutEnd = DateTime.Now.AddMinutes(15);
                    _context.Accounts.Update(account);
                    await _context.SaveChangesAsync();
                    throw new Exception("Bạn đã nhập sai mật khẩu quá 5 lần. Tài khoản tạm thời bị khóa trong 15 phút.");
                }
                _context.Accounts.Update(account);
                await _context.SaveChangesAsync();

                var remainingAttempts = 5 - account.AccessFailedCount;
                throw new Exception($"Mật khẩu không chính xác. Bạn còn {remainingAttempts} lần thử lại trước khi bị khóa tài khoản.");
            }

            // Đăng nhập thành công, reset số lần nhập sai
            account.AccessFailedCount = 0;
            account.LockoutEnd = null;
            _context.Accounts.Update(account);
            await _context.SaveChangesAsync();

            // Lấy FullName tùy theo Role
            string fullName = "Quản trị viên";
            if (account.Role == "Candidate")
            {
                var candidate = await _context.Candidates.FirstOrDefaultAsync(c => c.AccountID == account.AccountID);
                fullName = candidate?.FullName ?? "Ứng viên";
            }
            else if (account.Role == "Recruiter")
            {
                var recruiter = await _context.Recruiters.FirstOrDefaultAsync(r => r.AccountID == account.AccountID);
                fullName = recruiter?.FullName ?? "Nhà tuyển dụng";
            }

            // Tạo Token JWT
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"]);
            
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, account.AccountID),
                new Claim(ClaimTypes.Email, account.Email),
                new Claim(ClaimTypes.Role, account.Role)
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7), // Token có hiệu lực 7 ngày
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"]
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);

            return new LoginResponse
            {
                Token = tokenHandler.WriteToken(token),
                AccountId = account.AccountID,
                Email = account.Email,
                Role = account.Role,
                FullName = fullName
            };
        }
    }
}