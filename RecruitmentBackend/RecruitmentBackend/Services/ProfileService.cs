using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Utilities;
using RecruitmentBackend.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace RecruitmentBackend.Services
{
    public class ProfileService : IProfileService
    {
        private readonly AppDbContext _context;
        private readonly IFileService _fileService;

        public ProfileService(AppDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        public async Task<object?> GetProfileAsync(ClaimsPrincipal user)
        {
            string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return null;

            var candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.AccountID == accountId);

            if (candidate == null)
            {
                var account = await _context.Accounts.FindAsync(accountId);
                if (account == null) return null;

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

            // 1. Tìm CV từ DefaultCvUrl
            if (!string.IsNullOrEmpty(candidate.DefaultCvUrl))
            {
                defaultCv = await _context.CandidateCVs
                    .Where(cv => cv.CandidateID == candidate.CandidateID && cv.FilePath == candidate.DefaultCvUrl)
                    .OrderByDescending(cv => cv.CreatedAt)
                    .FirstOrDefaultAsync();
            }

            // 2. Nếu chưa có, tìm CV mới nhất trong hệ thống nộp bởi candidate này
            if (defaultCv == null)
            {
                defaultCv = await _context.CandidateCVs
                    .Where(cv => cv.CandidateID == candidate.CandidateID)
                    .OrderByDescending(cv => cv.CreatedAt)
                    .FirstOrDefaultAsync();

                if (defaultCv != null && string.IsNullOrEmpty(candidate.DefaultCvUrl))
                {
                    candidate.DefaultCvUrl = defaultCv.FilePath;
                    candidate.DefaultCvName = CvFileNameHelper.GetDisplayName(defaultCv.FilePath);
                    _context.Candidates.Update(candidate);
                    await _context.SaveChangesAsync();
                }
            }

            return new
            {
                fullName = candidate.FullName,
                phone = candidate.Phone,
                dob = candidate.DOB,
                gender = candidate.Gender,
                address = candidate.Address,
                avatarUrl = candidate.AvatarUrl,
                defaultCvUrl = candidate.DefaultCvUrl,
                defaultCvName = CvFileNameHelper.GetDisplayName(candidate.DefaultCvName ?? candidate.DefaultCvUrl, "CV mặc định"),
                skills = defaultCv != null ? defaultCv.CVExtractedSkills : "[]",
                degree = defaultCv?.Degree,
                major = defaultCv?.Major,
                university = defaultCv?.University,
                yearsOfExperience = defaultCv?.YearsOfExperience ?? 0,
                extractedPhone = defaultCv?.ExtractedPhone
            };
        }

        public async Task<(bool Success, string Message)> UpdateProfileAsync(ClaimsPrincipal user, string fullName, string phone, DateTime? dob, string gender, string address)
        {
            string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return (false, "Không xác định được tài khoản.");

            var candidate = await _context.Candidates.FirstOrDefaultAsync(c => c.AccountID == accountId);
            if (candidate == null) return (false, "Không tìm thấy thông tin ứng viên.");

            candidate.FullName = fullName;
            candidate.Phone = phone;
            candidate.DOB = dob;
            candidate.Gender = gender;
            candidate.Address = address;

            _context.Candidates.Update(candidate);
            await _context.SaveChangesAsync();

            return (true, "Cập nhật thông tin cá nhân thành công!");
        }

        public async Task<(bool Success, string Message, string AvatarUrl)> UploadAvatarAsync(ClaimsPrincipal user, IFormFile file)
        {
            string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return (false, "Không xác định được tài khoản.", "");

            var candidate = await _context.Candidates.FirstOrDefaultAsync(c => c.AccountID == accountId);
            if (candidate == null) return (false, "Không tìm thấy thông tin ứng viên.", "");

            try
            {
                string imageUrl = await _fileService.SaveFileAsync(file);
                candidate.AvatarUrl = imageUrl;

                _context.Candidates.Update(candidate);
                await _context.SaveChangesAsync();

                return (true, "Cập nhật ảnh đại diện thành công!", imageUrl);
            }
            catch (Exception ex)
            {
                return (false, ex.Message, "");
            }
        }

        public async Task<(bool Success, string Message, object? Data)> UploadDefaultCvAsync(ClaimsPrincipal user, IFormFile file)
        {
            string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return (false, "Không xác định được tài khoản.", null);

            var candidate = await _context.Candidates.FirstOrDefaultAsync(c => c.AccountID == accountId);
            if (candidate == null) return (false, "Không tìm thấy thông tin ứng viên.", null);

            try
            {
                string cvUrl = await _fileService.SaveFileAsync(file);
                candidate.DefaultCvUrl = cvUrl;
                candidate.DefaultCvName = file.FileName;

                string rawText = "";
                try
                {
                    using (var stream = file.OpenReadStream())
                    using (var reader = new StreamReader(stream, Encoding.UTF8, true, 1024, leaveOpen: true))
                    {
                        rawText = await reader.ReadToEndAsync();
                    }
                }
                catch { }

                string? extractedPhone = null;
                string? extractedEmail = null;
                var extractedSkills = new List<string>();

                if (!string.IsNullOrWhiteSpace(rawText))
                {
                    var phoneMatch = Regex.Match(rawText, @"(?:0|\+84)[35789]\d{8}\b");
                    if (phoneMatch.Success) extractedPhone = phoneMatch.Value;

                    var emailMatch = Regex.Match(rawText, @"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}");
                    if (emailMatch.Success) extractedEmail = emailMatch.Value;

                    var commonSkills = new[] { "React", "TypeScript", "JavaScript", "C#", ".NET", "Python", "SQL", "HTML", "CSS", "Node.js", "Java", "Docker", "Git", "Figma", "Go", "Github" };
                    foreach (var sk in commonSkills)
                    {
                        if (rawText.Contains(sk, StringComparison.OrdinalIgnoreCase))
                        {
                            extractedSkills.Add(sk);
                        }
                    }
                }

                if (!string.IsNullOrEmpty(extractedPhone) && string.IsNullOrEmpty(candidate.Phone))
                {
                    candidate.Phone = extractedPhone;
                }

                var defaultCv = await _context.CandidateCVs
                    .FirstOrDefaultAsync(cv => cv.CandidateID == candidate.CandidateID && cv.FilePath == cvUrl);

                if (defaultCv == null)
                {
                    defaultCv = new CandidateCV
                    {
                        CVID = Guid.NewGuid().ToString(),
                        CandidateID = candidate.CandidateID,
                        FilePath = cvUrl,
                        RawText = rawText,
                        ExtractedEmail = extractedEmail,
                        ExtractedPhone = extractedPhone,
                        CVExtractedSkills = JsonSerializer.Serialize(extractedSkills),
                        CreatedAt = DateTime.Now
                    };
                    _context.CandidateCVs.Add(defaultCv);
                }
                else
                {
                    defaultCv.ExtractedPhone = extractedPhone ?? defaultCv.ExtractedPhone;
                    defaultCv.ExtractedEmail = extractedEmail ?? defaultCv.ExtractedEmail;
                    if (extractedSkills.Count > 0)
                    {
                        defaultCv.CVExtractedSkills = JsonSerializer.Serialize(extractedSkills);
                    }
                    _context.CandidateCVs.Update(defaultCv);
                }

                _context.Candidates.Update(candidate);
                await _context.SaveChangesAsync();

                var data = new
                {
                    defaultCvUrl = cvUrl,
                    defaultCvName = file.FileName,
                    phone = candidate.Phone,
                    address = candidate.Address,
                    extractedPhone = extractedPhone,
                    extractedEmail = extractedEmail,
                    skills = extractedSkills
                };

                return (true, "Tải lên và bóc tách thông tin CV thành công!", data);
            }
            catch (Exception ex)
            {
                return (false, ex.Message, null);
            }
        }

        public async Task<(bool Success, string Message, object? Data)> SyncCvInfoAsync(ClaimsPrincipal user)
        {
            string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return (false, "Không xác định được tài khoản.", null);

            var candidate = await _context.Candidates.FirstOrDefaultAsync(c => c.AccountID == accountId);
            if (candidate == null) return (false, "Không tìm thấy thông tin ứng viên.", null);

            // 1. Tìm CV trong bảng CandidateCVs
            var candidateCv = await _context.CandidateCVs
                .Where(cv => cv.CandidateID == candidate.CandidateID)
                .OrderByDescending(cv => cv.CreatedAt)
                .FirstOrDefaultAsync();

            // 2. Nếu chưa có CandidateCV nhưng có DefaultCvUrl
            string cvPath = candidateCv?.FilePath ?? candidate.DefaultCvUrl;

            if (string.IsNullOrEmpty(cvPath))
            {
                return (false, "Bạn chưa có CV mẫu hoặc đơn ứng tuyển nào trong hệ thống để thực hiện đồng bộ.", null);
            }

            // Đảm bảo candidate.DefaultCvUrl luôn trỏ đến CV này
            if (string.IsNullOrEmpty(candidate.DefaultCvUrl))
            {
                candidate.DefaultCvUrl = cvPath;
                candidate.DefaultCvName = CvFileNameHelper.GetDisplayName(cvPath);
            }

            string rawText = candidateCv?.RawText ?? "";
            string? extractedPhone = candidateCv?.ExtractedPhone;

            // 3. Nếu chưa có RawText hoặc ExtractedPhone, tải và bóc tách file CV
            if (string.IsNullOrEmpty(rawText) || string.IsNullOrEmpty(extractedPhone))
            {
                try
                {
                    byte[] fileBytes = null;
                    if (cvPath.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                    {
                        using var httpClient = new HttpClient();
                        httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0");
                        fileBytes = await httpClient.GetByteArrayAsync(cvPath);
                    }
                    else
                    {
                        string localPath = Path.Combine(Directory.GetCurrentDirectory(), cvPath.TrimStart('/'));
                        if (!File.Exists(localPath))
                        {
                            localPath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", Path.GetFileName(cvPath));
                        }
                        if (File.Exists(localPath))
                        {
                            fileBytes = await File.ReadAllBytesAsync(localPath);
                        }
                    }

                    if (fileBytes != null && fileBytes.Length > 0)
                    {
                        rawText = Encoding.UTF8.GetString(fileBytes);
                        
                        var phoneMatch = Regex.Match(rawText, @"(?:0|\+84)[35789]\d{8}\b");
                        if (phoneMatch.Success) extractedPhone = phoneMatch.Value;
                    }
                }
                catch { }
            }

            // 4. Đồng bộ SĐT và Địa chỉ vào Candidate
            if (!string.IsNullOrEmpty(extractedPhone))
            {
                candidate.Phone = extractedPhone;
            }

            if (!string.IsNullOrWhiteSpace(rawText))
            {
                var lines = rawText.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                foreach (var line in lines)
                {
                    if (line.Contains("Hồ Chí Minh", StringComparison.OrdinalIgnoreCase) ||
                        line.Contains("Hà Nội", StringComparison.OrdinalIgnoreCase) ||
                        line.Contains("Đà Nẵng", StringComparison.OrdinalIgnoreCase) ||
                        line.Contains("Cần Thơ", StringComparison.OrdinalIgnoreCase) ||
                        line.Contains("Quận", StringComparison.OrdinalIgnoreCase) ||
                        line.Contains("Địa chỉ", StringComparison.OrdinalIgnoreCase) ||
                        line.Contains("Address", StringComparison.OrdinalIgnoreCase))
                    {
                        candidate.Address = line.Trim();
                        break;
                    }
                }
            }

            if (candidateCv != null)
            {
                candidateCv.ExtractedPhone = extractedPhone ?? candidateCv.ExtractedPhone;
                candidateCv.RawText = string.IsNullOrEmpty(candidateCv.RawText) ? rawText : candidateCv.RawText;
                _context.CandidateCVs.Update(candidateCv);
            }

            _context.Candidates.Update(candidate);
            await _context.SaveChangesAsync();

            var dataToReturn = new
            {
                fullName = candidate.FullName,
                phone = candidate.Phone,
                address = candidate.Address,
                dob = candidate.DOB,
                gender = candidate.Gender,
                extractedPhone = extractedPhone ?? candidate.Phone,
                extractedEmail = candidateCv?.ExtractedEmail,
                skills = candidateCv != null ? candidateCv.CVExtractedSkills : "[]",
                degree = candidateCv?.Degree,
                major = candidateCv?.Major,
                university = candidateCv?.University
            };

            return (true, "Đồng bộ thông tin cá nhân từ CV thành công!", dataToReturn);
        }

        public async Task<(bool Success, string Message)> UpdateSkillsAsync(ClaimsPrincipal user, List<string> skills)
        {
            string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return (false, "Không xác định được tài khoản.");

            var candidate = await _context.Candidates.FirstOrDefaultAsync(c => c.AccountID == accountId);
            if (candidate == null) return (false, "Không tìm thấy thông tin ứng viên.");

            if (string.IsNullOrEmpty(candidate.DefaultCvUrl))
            {
                return (false, "Vui lòng tải lên CV mẫu trước khi cập nhật kỹ năng.");
            }

            var defaultCv = await _context.CandidateCVs
                .Where(cv => cv.CandidateID == candidate.CandidateID && cv.FilePath == candidate.DefaultCvUrl)
                .OrderByDescending(cv => cv.CreatedAt)
                .FirstOrDefaultAsync();

            if (defaultCv == null) return (false, "Không tìm thấy thông tin CV mẫu trong hệ thống.");

            defaultCv.CVExtractedSkills = JsonSerializer.Serialize(skills);
            _context.CandidateCVs.Update(defaultCv);
            await _context.SaveChangesAsync();

            return (true, "Cập nhật danh sách kỹ năng thành công!");
        }
    }
}
