using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;
using System;
using System.Linq;
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
            public string? Department { get; set; }
            public string? CompanyBranch { get; set; }
            public string? Bio { get; set; }
            public string? LinkedInUrl { get; set; }
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return Unauthorized("Không xác định được tài khoản.");

            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.AccountID == accountId);
            if (account == null) return NotFound("Tài khoản không tồn tại.");

            var recruiter = await _context.Recruiters
                .FirstOrDefaultAsync(r => r.AccountID == accountId);

            if (recruiter == null)
            {
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

            // Calculate statistics
            var recruiterJobIds = await _context.JobPostings
                .Where(j => j.RecruiterID == recruiter.RecruiterID)
                .Select(j => j.JobID)
                .ToListAsync();

            int totalJobsPosted = recruiterJobIds.Count;

            int totalApplications = await _context.Applications
                .CountAsync(a => recruiterJobIds.Contains(a.JobID));

            int totalInterviewsScheduled = await _context.InterviewSchedules
                .CountAsync(i => _context.Applications
                    .Where(a => recruiterJobIds.Contains(a.JobID))
                    .Select(a => a.ApplicationID)
                    .Contains(i.ApplicationID));

            // 5 Recent jobs
            var recentJobs = await _context.JobPostings
                .Where(j => j.RecruiterID == recruiter.RecruiterID)
                .OrderByDescending(j => j.CreatedAt)
                .Take(5)
                .Select(j => new
                {
                    jobId = j.JobID,
                    status = j.Status,
                    createdAt = j.CreatedAt,
                    deadline = j.Deadline,
                    viewCount = j.ViewCount,
                    positionName = _context.Positions.Where(p => p.PositionID == j.PositionID).Select(p => p.PositionName).FirstOrDefault() ?? "Vị trí tuyển dụng",
                    categoryName = j.Category != null ? j.Category.Name : "Khác"
                })
                .ToListAsync();

            return Ok(new
            {
                recruiterId = recruiter.RecruiterID,
                fullName = recruiter.FullName,
                phone = recruiter.Phone,
                department = recruiter.Department ?? "Tuyển dụng & Nhân sự",
                companyBranch = recruiter.CompanyBranch ?? "Trụ sở chính",
                bio = recruiter.Bio ?? "",
                linkedInUrl = recruiter.LinkedInUrl ?? "",
                email = account.Email,
                createdAt = account.CreatedAt,
                status = account.Status,
                stats = new
                {
                    totalJobsPosted,
                    totalApplications,
                    totalInterviewsScheduled
                },
                recentJobs
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
            recruiter.Department = request.Department;
            recruiter.CompanyBranch = request.CompanyBranch;
            recruiter.Bio = request.Bio;
            recruiter.LinkedInUrl = request.LinkedInUrl;

            _context.Recruiters.Update(recruiter);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật thông tin thành công!" });
        }
    }
}
