using System.Diagnostics;
using System.Globalization;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;

namespace RecruitmentBackend.Services;

public class ChatbotService : IChatbotService
{
    private const int MaxPromptLength = 4_000;
    private const int MaxHistoryLength = 12_000;
    private const int MaxJobTextLength = 6_000;
    private readonly HttpClient _httpClient;
    private readonly string _pythonApiUrl;
    private readonly AppDbContext _context;
    private readonly ILogger<ChatbotService> _logger;

    public ChatbotService(
        HttpClient httpClient,
        IConfiguration configuration,
        AppDbContext context,
        ILogger<ChatbotService> logger)
    {
        _httpClient = httpClient;
        _pythonApiUrl = configuration["PythonAiApiUrl"] ?? "http://127.0.0.1:8000";
        _context = context;
        _logger = logger;
    }

    public async Task<(string Reply, string ExtractedText)> GetChatResponseAsync(ChatRequest request)
    {
        var stopwatch = Stopwatch.StartNew();
        var prompt = Truncate(request.Prompt, MaxPromptLength);
        var history = Truncate(request.HistoryJson, MaxHistoryLength, "[]");
        var includeJobCatalog = HasJobSearchIntent(prompt);

        var jobDescription = await BuildSelectedJobContextAsync(request.JobId);
        var systemKnowledge = await BuildSystemKnowledgeAsync(includeJobCatalog);

        using var content = new MultipartFormDataContent();
        content.Add(new StringContent(prompt), "prompt");
        content.Add(new StringContent(history), "history");
        content.Add(new StringContent(jobDescription), "job_description");
        content.Add(new StringContent(systemKnowledge), "system_knowledge");

        if (request.File is { Length: > 0 })
        {
            var fileContent = new StreamContent(request.File.OpenReadStream());
            if (!string.IsNullOrWhiteSpace(request.File.ContentType))
            {
                fileContent.Headers.ContentType =
                    new System.Net.Http.Headers.MediaTypeHeaderValue(request.File.ContentType);
            }
            content.Add(fileContent, "file", request.File.FileName);
        }

        try
        {
            using var response = await _httpClient.PostAsync($"{_pythonApiUrl}/chat", content);
            var responseString = await response.Content.ReadAsStringAsync();
            response.EnsureSuccessStatusCode();

            using var jsonDocument = JsonDocument.Parse(responseString);
            var root = jsonDocument.RootElement;
            if (root.TryGetProperty("status", out var status) && status.GetString() == "success")
            {
                var reply = root.TryGetProperty("reply", out var replyElement)
                    ? replyElement.GetString() ?? "Trợ lý chưa tạo được nội dung trả lời."
                    : "Trợ lý chưa tạo được nội dung trả lời.";
                var extractedText = root.TryGetProperty("extracted_text", out var extracted)
                    ? extracted.GetString() ?? string.Empty
                    : string.Empty;

                _logger.LogInformation(
                    "Chatbot hoàn tất sau {ElapsedMs} ms; JobCatalog={JobCatalog}; HasFile={HasFile}",
                    stopwatch.ElapsedMilliseconds,
                    includeJobCatalog,
                    request.File is { Length: > 0 });
                return (reply, extractedText);
            }

            var message = root.TryGetProperty("message", out var error)
                ? error.GetString()
                : null;
            return ($"Trợ lý AI chưa thể phản hồi: {message ?? "không xác định được nguyên nhân"}.", string.Empty);
        }
        catch (TaskCanceledException) when (!_httpClient.Timeout.Equals(Timeout.InfiniteTimeSpan))
        {
            _logger.LogWarning("Chatbot hết thời gian chờ sau {ElapsedMs} ms.", stopwatch.ElapsedMilliseconds);
            return ("Trợ lý AI phản hồi quá chậm. Vui lòng thử lại sau ít phút.", string.Empty);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Chatbot lỗi sau {ElapsedMs} ms.", stopwatch.ElapsedMilliseconds);
            return ("Chưa thể kết nối với trợ lý AI. Vui lòng thử lại sau.", string.Empty);
        }
    }

    private async Task<string> BuildSelectedJobContextAsync(string? jobId)
    {
        if (string.IsNullOrWhiteSpace(jobId))
        {
            return string.Empty;
        }

        var job = await _context.JobPostings
            .AsNoTracking()
            .Where(item => item.JobID == jobId)
            .Select(item => new { item.JobDescription, item.JobRequirement })
            .SingleOrDefaultAsync();

        return job == null
            ? string.Empty
            : Truncate(
                $"Mô tả công việc:\n{job.JobDescription}\n\nYêu cầu:\n{job.JobRequirement}",
                MaxJobTextLength);
    }

    private async Task<string> BuildSystemKnowledgeAsync(bool includeJobCatalog)
    {
        const string baseKnowledge =
            "RecruitInsightAI hỗ trợ ứng viên quản lý CV, ứng tuyển, xem trạng thái và nhận tư vấn nghề nghiệp.";
        if (!includeJobCatalog)
        {
            return baseKnowledge;
        }

        var todayVietnam = JobLifecyclePolicy.TodayVietnam;
        var jobs = await (from job in _context.JobPostings.AsNoTracking()
                          join position in _context.Positions.AsNoTracking()
                              on job.PositionID equals position.PositionID into positions
                          from position in positions.DefaultIfEmpty()
                          join branch in _context.Branches.AsNoTracking()
                              on job.BranchID equals branch.BranchID into branches
                          from branch in branches.DefaultIfEmpty()
                          where job.Status == "Published"
                                && (!job.StartDate.HasValue || job.StartDate.Value.Date <= todayVietnam)
                                && job.Deadline.Date >= todayVietnam
                          orderby job.CreatedAt descending
                          select new
                          {
                              job.JobID,
                              PositionName = position != null ? position.PositionName : "Chưa cập nhật",
                              BranchName = branch != null ? branch.BranchName : "Chưa cập nhật",
                              job.JobRequirement,
                              job.SalaryMin,
                              job.SalaryMax
                          })
            .Take(6)
            .ToListAsync();

        if (jobs.Count == 0)
        {
            return $"{baseKnowledge}\nHiện chưa có tin tuyển dụng còn hạn đang hiển thị.";
        }

        var lines = jobs.Select(job =>
        {
            var salary = job.SalaryMin <= 0 && job.SalaryMax <= 0
                ? "Thỏa thuận"
                : job.SalaryMax <= 0
                    ? $"{FormatSalary(job.SalaryMin)} triệu"
                    : $"{FormatSalary(job.SalaryMin)}–{FormatSalary(job.SalaryMax)} triệu";
            return $"- ID: {job.JobID} | {job.PositionName} | {job.BranchName} | " +
                   $"Lương: {salary} | Yêu cầu: {Truncate(job.JobRequirement, 180)}";
        });

        return Truncate(
            $"{baseKnowledge}\nCác tin còn hạn phù hợp để tham khảo:\n{string.Join("\n", lines)}\n" +
            "Chỉ gợi ý 1–2 tin phù hợp nhất. Khi gợi ý, thêm thẻ " +
            "[RECOMMEND_JOB: <ID> | <Vị trí> | <Khu vực> | <Lương>] ở cuối mỗi tin.",
            8_000);
    }

    private static bool HasJobSearchIntent(string prompt)
    {
        var normalized = prompt.ToLowerInvariant();
        string[] keywords =
        {
            "tìm việc", "việc làm", "tin tuyển", "đang tuyển", "ứng tuyển",
            "công việc phù hợp", "gợi ý job", "gợi ý việc", "mức lương", "lương bao nhiêu"
        };
        return keywords.Any(normalized.Contains);
    }

    private static string Truncate(string? value, int maxLength, string fallback = "")
    {
        var normalized = value?.Trim() ?? fallback;
        return normalized.Length <= maxLength ? normalized : normalized[..maxLength];
    }

    private static string FormatSalary(decimal value) =>
        value.ToString("0.##", CultureInfo.InvariantCulture);
}
