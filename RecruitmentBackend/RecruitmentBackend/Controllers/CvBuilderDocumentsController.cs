using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;

namespace RecruitmentBackend.Controllers;

[ApiController]
[Route("api/cv-builder-documents")]
[Authorize(Roles = "Candidate")]
public class CvBuilderDocumentsController : ControllerBase
{
    private const int MaxContentLength = 500_000;
    private const int MaxSettingsLength = 100_000;
    private readonly AppDbContext _context;

    public CvBuilderDocumentsController(AppDbContext context) => _context = context;

    public sealed class SaveDocumentRequest
    {
        public string Name { get; set; } = string.Empty;
        public JsonElement Content { get; set; }
        public JsonElement Settings { get; set; }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var candidate = await GetCandidateAsync();
        if (candidate == null) return Unauthorized(new { message = "Không xác định được tài khoản ứng viên." });

        var documents = await _context.CvBuilderDocuments
            .AsNoTracking()
            .Where(document => document.CandidateID == candidate.CandidateID)
            .OrderByDescending(document => document.IsDefault)
            .ThenByDescending(document => document.UpdatedAt)
            .Select(document => new
            {
                document.Id,
                document.Name,
                document.IsDefault,
                document.CreatedAt,
                document.UpdatedAt
            })
            .ToListAsync();

        return Ok(documents);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var candidate = await GetCandidateAsync();
        if (candidate == null) return Unauthorized(new { message = "Không xác định được tài khoản ứng viên." });

        var document = await _context.CvBuilderDocuments.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id && item.CandidateID == candidate.CandidateID);
        if (document == null) return NotFound(new { message = "Không tìm thấy CV." });

        return Ok(ToDetail(document));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveDocumentRequest request)
    {
        var candidate = await GetOrCreateCandidateAsync();
        if (candidate == null) return Unauthorized(new { message = "Không xác định được tài khoản ứng viên." });
        var validation = Validate(request);
        if (validation != null) return BadRequest(new { message = validation });

        var hasDocument = await _context.CvBuilderDocuments.AnyAsync(item => item.CandidateID == candidate.CandidateID);
        var document = new CvBuilderDocument
        {
            CandidateID = candidate.CandidateID,
            Name = request.Name.Trim(),
            ContentJson = request.Content.GetRawText(),
            SettingsJson = request.Settings.GetRawText(),
            IsDefault = !hasDocument
        };
        _context.CvBuilderDocuments.Add(document);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = document.Id }, ToDetail(document));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] SaveDocumentRequest request)
    {
        var candidate = await GetCandidateAsync();
        if (candidate == null) return Unauthorized(new { message = "Không xác định được tài khoản ứng viên." });
        var validation = Validate(request);
        if (validation != null) return BadRequest(new { message = validation });

        var document = await _context.CvBuilderDocuments
            .FirstOrDefaultAsync(item => item.Id == id && item.CandidateID == candidate.CandidateID);
        if (document == null) return NotFound(new { message = "Không tìm thấy CV." });

        document.Name = request.Name.Trim();
        document.ContentJson = request.Content.GetRawText();
        document.SettingsJson = request.Settings.GetRawText();
        document.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(ToDetail(document));
    }

    [HttpPut("{id}/default")]
    public async Task<IActionResult> SetDefault(string id)
    {
        var candidate = await GetCandidateAsync();
        if (candidate == null) return Unauthorized(new { message = "Không xác định được tài khoản ứng viên." });
        var documents = await _context.CvBuilderDocuments
            .Where(item => item.CandidateID == candidate.CandidateID)
            .ToListAsync();
        var selected = documents.FirstOrDefault(item => item.Id == id);
        if (selected == null) return NotFound(new { message = "Không tìm thấy CV." });

        foreach (var document in documents) document.IsDefault = document.Id == id;
        selected.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Đã đặt làm CV mặc định." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var candidate = await GetCandidateAsync();
        if (candidate == null) return Unauthorized(new { message = "Không xác định được tài khoản ứng viên." });
        var document = await _context.CvBuilderDocuments
            .FirstOrDefaultAsync(item => item.Id == id && item.CandidateID == candidate.CandidateID);
        if (document == null) return NotFound(new { message = "Không tìm thấy CV." });

        _context.CvBuilderDocuments.Remove(document);
        await _context.SaveChangesAsync();
        if (document.IsDefault)
        {
            var latest = await _context.CvBuilderDocuments
                .Where(item => item.CandidateID == candidate.CandidateID)
                .OrderByDescending(item => item.UpdatedAt)
                .FirstOrDefaultAsync();
            if (latest != null)
            {
                latest.IsDefault = true;
                await _context.SaveChangesAsync();
            }
        }
        return NoContent();
    }

    private async Task<Candidate?> GetCandidateAsync()
    {
        var accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return string.IsNullOrWhiteSpace(accountId)
            ? null
            : await _context.Candidates.FirstOrDefaultAsync(candidate => candidate.AccountID == accountId);
    }

    private async Task<Candidate?> GetOrCreateCandidateAsync()
    {
        var accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(accountId)) return null;
        var candidate = await _context.Candidates.FirstOrDefaultAsync(item => item.AccountID == accountId);
        if (candidate != null) return candidate;
        var account = await _context.Accounts.FindAsync(accountId);
        if (account == null) return null;
        candidate = new Candidate
        {
            AccountID = accountId,
            FullName = account.Email.Split('@')[0],
            Phone = string.Empty,
            Gender = "Chưa cập nhật",
            Address = string.Empty
        };
        _context.Candidates.Add(candidate);
        await _context.SaveChangesAsync();
        return candidate;
    }

    private static string? Validate(SaveDocumentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) return "Vui lòng đặt tên CV.";
        if (request.Name.Trim().Length > 150) return "Tên CV không được vượt quá 150 ký tự.";
        if (request.Content.ValueKind != JsonValueKind.Object) return "Nội dung CV không hợp lệ.";
        if (request.Settings.ValueKind != JsonValueKind.Object) return "Cấu hình CV không hợp lệ.";
        if (request.Content.GetRawText().Length > MaxContentLength) return "Nội dung CV vượt quá giới hạn cho phép.";
        if (request.Settings.GetRawText().Length > MaxSettingsLength) return "Cấu hình CV vượt quá giới hạn cho phép.";
        return null;
    }

    private static object ToDetail(CvBuilderDocument document) => new
    {
        document.Id,
        document.Name,
        content = JsonSerializer.Deserialize<JsonElement>(document.ContentJson),
        settings = JsonSerializer.Deserialize<JsonElement>(document.SettingsJson),
        document.IsDefault,
        document.CreatedAt,
        document.UpdatedAt
    };
}
