using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Utilities;

namespace RecruitmentBackend.Controllers;

[ApiController]
[Route("api/candidate-cvs")]
[Authorize(Roles = "Candidate")]
public class CandidateCvsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public CandidateCvsController(AppDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyUploadedCvs()
    {
        var accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var candidate = await _context.Candidates.AsNoTracking()
            .FirstOrDefaultAsync(item => item.AccountID == accountId);
        if (candidate == null) return Unauthorized(new { message = "Không xác định được tài khoản ứng viên." });

        var rows = await _context.CandidateCVs.AsNoTracking()
            .Where(item => item.CandidateID == candidate.CandidateID && item.FilePath != null && item.FilePath != "")
            .OrderByDescending(item => item.CreatedAt)
            .Select(item => new { item.CVID, item.FilePath, item.CreatedAt })
            .ToListAsync();

        var result = rows
            .GroupBy(item => item.FilePath, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .Select(item => new
            {
                id = item.CVID,
                name = CvFileNameHelper.GetDisplayName(item.FilePath),
                isDefault = string.Equals(item.FilePath, candidate.DefaultCvUrl, StringComparison.OrdinalIgnoreCase),
                createdAt = item.CreatedAt
            })
            .ToList();

        return Ok(result);
    }

    [HttpGet("{id}/file")]
    public async Task<IActionResult> Download(string id)
    {
        var accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var candidate = await _context.Candidates.AsNoTracking()
            .FirstOrDefaultAsync(item => item.AccountID == accountId);
        if (candidate == null) return Unauthorized();

        var cv = await _context.CandidateCVs.AsNoTracking()
            .FirstOrDefaultAsync(item => item.CVID == id && item.CandidateID == candidate.CandidateID);
        if (cv == null || string.IsNullOrWhiteSpace(cv.FilePath)) return NotFound(new { message = "Không tìm thấy tệp CV." });

        var fileName = Path.GetFileName(new Uri(cv.FilePath, UriKind.RelativeOrAbsolute).IsAbsoluteUri
            ? new Uri(cv.FilePath).AbsolutePath
            : cv.FilePath);
        var localCandidates = new[]
        {
            Path.Combine(_environment.ContentRootPath, "Uploads", fileName),
            Path.Combine(_environment.ContentRootPath, cv.FilePath.TrimStart('/', '\\'))
        };

        byte[] bytes;
        var localPath = localCandidates.FirstOrDefault(System.IO.File.Exists);
        if (localPath != null)
        {
            bytes = await System.IO.File.ReadAllBytesAsync(localPath);
        }
        else if (Uri.TryCreate(cv.FilePath, UriKind.Absolute, out var remoteUri) && remoteUri.Scheme is "http" or "https")
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
            bytes = await client.GetByteArrayAsync(remoteUri);
        }
        else
        {
            return NotFound(new { message = "Tệp CV không còn tồn tại trên hệ thống." });
        }

        var contentType = Path.GetExtension(fileName).ToLowerInvariant() switch
        {
            ".pdf" => "application/pdf",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };
        return File(bytes, contentType, fileName);
    }
}
