using Microsoft.AspNetCore.Http;

namespace RecruitmentBackend.DTOs.Requests
{
    public class SendCandidateEmailRequest
    {
        public string? ApplicationId { get; set; }

        public string ToEmail { get; set; } = string.Empty;

        public string? CcEmail { get; set; }

        public string Subject { get; set; } = string.Empty;

        public string Body { get; set; } = string.Empty;

        public bool IsHtml { get; set; } = false;

        public List<IFormFile>? Attachments { get; set; }
    }
}