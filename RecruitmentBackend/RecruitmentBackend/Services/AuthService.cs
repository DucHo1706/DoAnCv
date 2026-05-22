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

            // Tạm thời so sánh chuỗi mật khẩu trực tiếp. 
            // Nếu có chức năng tạo tài khoản sau này, ta có thể tích hợp thư viện BCrypt.Net để mã hóa.
            if (account == null || account.PasswordHash != request.Password)
            {
                throw new Exception("Email hoặc mật khẩu không chính xác.");
            }

            if (account.Status != "Active")
            {
                throw new Exception("Tài khoản của bạn đã bị khóa.");
            }

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