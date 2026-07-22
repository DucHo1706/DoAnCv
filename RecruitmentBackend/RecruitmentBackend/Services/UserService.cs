using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RecruitmentBackend.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;

        public UserService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
        {
            return await (from a in _context.Accounts
                          join c in _context.Candidates on a.AccountID equals c.AccountID into ac
                          from c in ac.DefaultIfEmpty()
                          join r in _context.Recruiters on a.AccountID equals r.AccountID into ar
                          from r in ar.DefaultIfEmpty()
                          orderby a.CreatedAt descending
                          select new UserDto
                          {
                              Id = a.AccountID,
                              Email = a.Email,
                              Role = a.Role,
                              Status = a.Status,
                              CreatedAt = a.CreatedAt,
                              FullName = a.Role == "Candidate" ? (c != null ? c.FullName : "Chưa cập nhật") :
                                         (a.Role == "Recruiter" ? (r != null ? r.FullName : "Chưa cập nhật") : "Quản trị viên"),
                              BranchIds = a.Role == "Recruiter" && r != null ? _context.RecruiterBranches.Where(rb => rb.RecruiterID == r.RecruiterID).Select(rb => rb.BranchID).ToList() : new List<string>()
                          }).ToListAsync();
        }

        public async Task<(bool Success, string Message, string NewStatus)> ToggleUserStatusAsync(string id)
        {
            var account = await _context.Accounts.FindAsync(id);
            if (account == null) return (false, "Không tìm thấy tài khoản", null);

            account.Status = account.Status == "Active" ? "Banned" : "Active";
            account.UpdatedAt = DateTime.Now;
            
            await _context.SaveChangesAsync();
            string message = account.Status == "Active" ? "Đã mở khóa tài khoản!" : "Đã khóa tài khoản!";
            
            return (true, message, account.Status);
        }

        public async Task<(bool Success, string Message)> CreateUserAsync(CreateUserRequest request)
        {
            if (await _context.Accounts.AnyAsync(a => a.Email == request.Email))
                return (false, "Email này đã được sử dụng trong hệ thống!");

            var accountId = Guid.NewGuid().ToString();
            var passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<Account>();
            var account = new Account
            {
                AccountID = accountId,
                Email = request.Email,
                Role = request.Role,
                Status = "Active",
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            account.PasswordHash = passwordHasher.HashPassword(account, request.Password);
            _context.Accounts.Add(account);

            if (request.Role == "Recruiter")
            {
                var recruiterId = Guid.NewGuid().ToString();
                _context.Recruiters.Add(new Recruiter
                {
                    RecruiterID = recruiterId,
                    AccountID = accountId,
                    FullName = request.Name,
                    Phone = "Chưa cập nhật"
                });

                if (request.BranchIds != null && request.BranchIds.Any())
                {
                    foreach (var branchId in request.BranchIds)
                    {
                        _context.RecruiterBranches.Add(new RecruiterBranch { RecruiterID = recruiterId, BranchID = branchId });
                    }
                }
            }
            else if (request.Role == "Candidate")
            {
                _context.Candidates.Add(new Candidate
                {
                    CandidateID = Guid.NewGuid().ToString(),
                    AccountID = accountId,
                    FullName = request.Name,
                    Phone = "Chưa cập nhật",
                    Gender = "Chưa cập nhật",
                    Address = "Chưa cập nhật"
                });
            }

            await _context.SaveChangesAsync();
            return (true, "Tạo tài khoản thành công!");
        }

        public async Task<(bool Success, string Message)> UpdateUserAsync(string id, UpdateUserRequest request)
        {
            var account = await _context.Accounts.FindAsync(id);
            if (account == null) return (false, "Không tìm thấy tài khoản!");

            if (account.Role == "Recruiter")
            {
                var recruiter = await _context.Recruiters.FirstOrDefaultAsync(r => r.AccountID == id);
                if (recruiter != null)
                {
                    recruiter.FullName = request.Name;

                    // Xóa các chi nhánh cũ và thêm chi nhánh mới
                    var existingBranches = _context.RecruiterBranches.Where(rb => rb.RecruiterID == recruiter.RecruiterID);
                    _context.RecruiterBranches.RemoveRange(existingBranches);

                    if (request.BranchIds != null && request.BranchIds.Any())
                    {
                        foreach (var branchId in request.BranchIds)
                            _context.RecruiterBranches.Add(new RecruiterBranch { RecruiterID = recruiter.RecruiterID, BranchID = branchId });
                    }
                }
            }
            else if (account.Role == "Candidate")
            {
                var candidate = await _context.Candidates.FirstOrDefaultAsync(c => c.AccountID == id);
                if (candidate != null) candidate.FullName = request.Name;
            }

            account.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return (true, "Cập nhật thông tin thành công!");
        }
    }
}