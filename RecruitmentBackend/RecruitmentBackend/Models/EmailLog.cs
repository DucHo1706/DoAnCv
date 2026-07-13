using System;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Models
{
    public class EmailLog
    {
        [Key]
        public string EmailLogID { get; set; } = Guid.NewGuid().ToString();
        
        public string? CandidateID { get; set; }
        
        public string? ApplicationID { get; set; }
        
        public string? JobID { get; set; }
        
        [Required]
        public string RecipientEmail { get; set; } = string.Empty;
        
        [Required]
        public string Subject { get; set; } = string.Empty;
        
        [Required]
        public string Body { get; set; } = string.Empty;
        
        public string? CategoryName { get; set; } // Ngành nghề
        
        public string? JobTitle { get; set; } // Vị trí công việc
        
        public string? CandidateName { get; set; }
        
        public DateTime SentAt { get; set; } = DateTime.Now;
    }
}
