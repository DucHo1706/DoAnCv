using System;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Models
{
    public class ChatMessage
    {
        [Key]
        public int Id { get; set; }
        public string SessionId { get; set; }
        public string Role { get; set; } // "user" hoặc "ai"
        public string Text { get; set; }
        public string? AttachedFileUrl { get; set; } // Chứa link Cloudinary của CV
        public string? ExtractedText { get; set; } // Chứa Text bóc tách để mớm cho AI huấn luyện sau này
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}