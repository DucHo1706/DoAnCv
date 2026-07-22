using System;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Models
{
    public class AuditLog
    {
        [Key]
        public string AuditLogID { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string UserEmail { get; set; } = string.Empty;
        
        [Required]
        public string Action { get; set; } = string.Empty; // e.g. "Khóa tài khoản", "Phê duyệt tin", "Tạo tài khoản"
        
        [Required]
        public string Target { get; set; } = string.Empty; // e.g. "Tài khoản: hr@gmail.com", "Tin tuyển dụng: dev_1"
        
        public string? IPAddress { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
