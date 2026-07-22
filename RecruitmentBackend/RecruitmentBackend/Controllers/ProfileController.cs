using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Candidate")]
    public class ProfileController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IFileService _fileService;

        public ProfileController(AppDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        public class UpdateProfileRequest
        {
            public string FullName { get; set; }
            public string Phone { get; set; }
            public DateTime? DOB { get; set; }
            public string Gender { get; set; }
            public string Address { get; set; }
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return Unauthorized("Không xác định được tài khoản.");

            var candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.AccountID == accountId);

            if (candidate == null)
            {
                var account = await _context.Accounts.FindAsync(accountId);
                if (account == null) return NotFound("Tài khoản không tồn tại.");

                candidate = new Candidate
                {
                    CandidateID = Guid.NewGuid().ToString(),
                    AccountID = accountId,
                    FullName = account.Email.Split('@')[0],
                    Phone = "",
                    Gender = "Nam",
                    Address = ""
                };
                _context.Candidates.Add(candidate);
                await _context.SaveChangesAsync();
            }

            CandidateCV defaultCv = null;
            if (string.IsNullOrEmpty(candidate.DefaultCvUrl) == false)
            {
                defaultCv = await _context.CandidateCVs
                    .Where(cv => cv.CandidateID == candidate.CandidateID && cv.FilePath == candidate.DefaultCvUrl)
                    .OrderByDescending(cv => cv.CreatedAt)
                    .FirstOrDefaultAsync();
            }

            return Ok(new
            {
                fullName = candidate.FullName,
                phone = candidate.Phone,
                dob = candidate.DOB,
                gender = candidate.Gender,
                address = candidate.Address,
                avatarUrl = candidate.AvatarUrl,
                defaultCvUrl = candidate.DefaultCvUrl,
                defaultCvName = candidate.DefaultCvName,
                skills = defaultCv != null ? defaultCv.CVExtractedSkills : "[]",
                degree = defaultCv != null ? defaultCv.Degree : null,
                major = defaultCv != null ? defaultCv.Major : null,
                university = defaultCv != null ? defaultCv.University : null,
                yearsOfExperience = defaultCv != null ? defaultCv.YearsOfExperience : 0,
                extractedPhone = defaultCv != null ? defaultCv.ExtractedPhone : null
            });
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return Unauthorized("Không xác định được tài khoản.");

            var candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.AccountID == accountId);

            if (candidate == null) return NotFound("Không tìm thấy thông tin ứng viên.");

            candidate.FullName = request.FullName;
            candidate.Phone = request.Phone;
            candidate.DOB = request.DOB;
            candidate.Gender = request.Gender;
            candidate.Address = request.Address;

            _context.Candidates.Update(candidate);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật thông tin cá nhân thành công!" });
        }

        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("Vui lòng tải lên file ảnh.");

            string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return Unauthorized("Không xác định được tài khoản.");

            var candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.AccountID == accountId);

            if (candidate == null) return NotFound("Không tìm thấy thông tin ứng viên.");

            try
            {
                string imageUrl = await _fileService.SaveFileAsync(file);
                candidate.AvatarUrl = imageUrl;

                _context.Candidates.Update(candidate);
                await _context.SaveChangesAsync();

                return Ok(new { avatarUrl = imageUrl, message = "Cập nhật ảnh đại diện thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("cv")]
        public async Task<IActionResult> UploadDefaultCv(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("Vui lòng tải lên file CV.");

            string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return Unauthorized("Không xác định được tài khoản.");

            var candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.AccountID == accountId);

            if (candidate == null) return NotFound("Không tìm thấy thông tin ứng viên.");

            try
            {
                string cvUrl = await _fileService.SaveFileAsync(file);
                candidate.DefaultCvUrl = cvUrl;
                candidate.DefaultCvName = file.FileName;

                _context.Candidates.Update(candidate);
                await _context.SaveChangesAsync();

                return Ok(new 
                { 
                    defaultCvUrl = cvUrl, 
                    defaultCvName = file.FileName, 
                    message = "Tải lên CV mặc định thành công!" 
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        public class UpdateSkillsRequest
        {
            public System.Collections.Generic.List<string> Skills { get; set; }
        }

        [HttpPut("skills")]
        public async Task<IActionResult> UpdateSkills([FromBody] UpdateSkillsRequest request)
        {
            if (request == null || request.Skills == null) return BadRequest("Danh sách kỹ năng không hợp lệ.");

            string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return Unauthorized("Không xác định được tài khoản.");

            var candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.AccountID == accountId);

            if (candidate == null) return NotFound("Không tìm thấy thông tin ứng viên.");

            if (string.IsNullOrEmpty(candidate.DefaultCvUrl))
            {
                return BadRequest("Vui lòng tải lên CV mẫu trước khi cập nhật kỹ năng.");
            }

            var defaultCv = await _context.CandidateCVs
                .Where(cv => cv.CandidateID == candidate.CandidateID && cv.FilePath == candidate.DefaultCvUrl)
                .OrderByDescending(cv => cv.CreatedAt)
                .FirstOrDefaultAsync();

            if (defaultCv == null) return NotFound("Không tìm thấy thông tin CV mẫu trong hệ thống.");

            defaultCv.CVExtractedSkills = System.Text.Json.JsonSerializer.Serialize(request.Skills);
            _context.CandidateCVs.Update(defaultCv);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật danh sách kỹ năng thành công!" });
        }
    }
}
