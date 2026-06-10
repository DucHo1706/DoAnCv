using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace RecruitmentBackend.DTOs.Requests
{
    public class ChatMessageDto
    {
        public string Role { get; set; }
        public string Text { get; set; }
    }

    public class ChatRequest
    {
        public string SessionId { get; set; }
        public string Prompt { get; set; }
        public string HistoryJson { get; set; }
        public IFormFile? File { get; set; }
        public string? JobId { get; set; }
    }
}