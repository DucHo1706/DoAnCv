using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Responses;
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
        private readonly IAiService _aiService;

        public ProfileService(AppDbContext context, IFileService fileService, IAiService aiService)
        {
            _context = context;
            _fileService = fileService;
            _aiService = aiService;
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
                extractedPhone = defaultCv?.ExtractedPhone,
                recruiterDiscoveryEnabled = candidate.RecruiterDiscoveryEnabled,
                recruiterContactAllowed = candidate.RecruiterContactAllowed,
                recruiterCvAllowed = candidate.RecruiterCvAllowed,
                recruiterDiscoveryUpdatedAt = candidate.RecruiterDiscoveryUpdatedAt,
                recruiterDiscoveryExpiresAt = candidate.RecruiterDiscoveryExpiresAt
            };
        }

        public async Task<(bool Success, string Message, object? Data)> UpdateRecruiterDiscoveryAsync(
            ClaimsPrincipal user,
            bool enabled,
            bool contactAllowed,
            bool cvAllowed,
            DateTime? expiresAt)
        {
            string? accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(accountId))
            {
                return (false, "Không xác định được tài khoản ứng viên.", null);
            }

            var candidate = await _context.Candidates.FirstOrDefaultAsync(item => item.AccountID == accountId);
            if (candidate == null)
            {
                return (false, "Không tìm thấy hồ sơ ứng viên.", null);
            }

            if (expiresAt.HasValue && expiresAt.Value <= DateTime.UtcNow)
            {
                return (false, "Thời hạn cho phép tìm kiếm phải ở tương lai.", null);
            }

            candidate.RecruiterDiscoveryEnabled = enabled;
            candidate.RecruiterContactAllowed = enabled && contactAllowed;
            candidate.RecruiterCvAllowed = enabled && cvAllowed;
            candidate.RecruiterDiscoveryExpiresAt = enabled ? expiresAt : null;
            candidate.RecruiterDiscoveryUpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return (true, enabled
                ? "Đã cho phép nhà tuyển dụng tìm kiếm hồ sơ của bạn."
                : "Đã tắt cho phép nhà tuyển dụng tìm kiếm hồ sơ.", new
                {
                enabled = candidate.RecruiterDiscoveryEnabled,
                contactAllowed = candidate.RecruiterContactAllowed,
                cvAllowed = candidate.RecruiterCvAllowed,
                    expiresAt = candidate.RecruiterDiscoveryExpiresAt
                });
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
                if (file.Length <= 0 || file.Length > 10 * 1024 * 1024)
                    return (false, "Tệp CV phải có dung lượng từ 1 byte đến 10 MB.", null);

                byte[] fileBytes;
                await using (var input = file.OpenReadStream())
                await using (var memory = new MemoryStream())
                {
                    await input.CopyToAsync(memory);
                    fileBytes = memory.ToArray();
                }

                var extraction = await _aiService.ExtractCvAsync(
                    fileBytes,
                    file.FileName,
                    file.ContentType ?? "application/octet-stream");
                if (!string.Equals(extraction.Status, "success", StringComparison.OrdinalIgnoreCase))
                {
                    var extractionMessage = string.IsNullOrWhiteSpace(extraction.Message)
                        ? "Không thể trích xuất đủ nội dung CV."
                        : extraction.Message;
                    return (false, extractionMessage, new
                    {
                        status = extraction.Status,
                        extractionQuality = extraction.ExtractionQuality
                    });
                }

                string cvUrl = await _fileService.SaveFileAsync(file);
                candidate.DefaultCvUrl = cvUrl;
                candidate.DefaultCvName = file.FileName;
                string rawText = extraction.RawText;
                string? extractedPhone = extraction.Phone;
                string? extractedEmail = extraction.Email;
                var extractedSkills = extraction.Skills;

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
                        YearsOfExperience = extraction.YearsOfExperience,
                        SourceType = "Uploaded",
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
                    defaultCv.RawText = rawText;
                    defaultCv.YearsOfExperience = extraction.YearsOfExperience;
                    defaultCv.SourceType = "Uploaded";
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
                    skills = extractedSkills,
                    yearsOfExperience = extraction.YearsOfExperience,
                    extractionQuality = extraction.ExtractionQuality
                };

                return (true, "Tải lên và trích xuất CV thành công.", data);
            }
            catch (HttpRequestException)
            {
                return (false, "Dịch vụ đọc CV đang tạm thời không khả dụng. Tệp chưa được đặt làm CV mặc định; vui lòng thử lại sau.", null);
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
            CvExtractionResponse? extraction = null;

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
                        var fileName = Path.GetFileName(
                            Uri.TryCreate(cvPath, UriKind.Absolute, out var uri) ? uri.LocalPath : cvPath);
                        var extension = Path.GetExtension(fileName).ToLowerInvariant();
                        var contentType = extension switch
                        {
                            ".pdf" => "application/pdf",
                            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                            ".png" => "image/png",
                            ".jpg" or ".jpeg" => "image/jpeg",
                            ".webp" => "image/webp",
                            _ => "application/octet-stream"
                        };
                        extraction = await _aiService.ExtractCvAsync(fileBytes, fileName, contentType);
                        if (string.Equals(extraction.Status, "success", StringComparison.OrdinalIgnoreCase))
                        {
                            rawText = extraction.RawText;
                            extractedPhone = extraction.Phone;
                        }
                    }
                }
                catch (Exception)
                {
                    return (false, "Không thể đọc lại CV lúc này. Dữ liệu hồ sơ hiện có vẫn được giữ nguyên.", null);
                }
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
                if (extraction != null && string.Equals(extraction.Status, "success", StringComparison.OrdinalIgnoreCase))
                {
                    candidateCv.ExtractedEmail = extraction.Email ?? candidateCv.ExtractedEmail;
                    candidateCv.CVExtractedSkills = JsonSerializer.Serialize(extraction.Skills);
                    candidateCv.YearsOfExperience = extraction.YearsOfExperience;
                }
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
