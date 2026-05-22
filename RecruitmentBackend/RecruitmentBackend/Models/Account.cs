using System;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Models
{
    public class Account
    {
        [Key]
        public string AccountID { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        [Required]
        public string PasswordHash { get; set; }
        
        public string Role { get; set; } // Admin, Recruiter, Candidate
        public string Status { get; set; } = "Active"; // Active, Banned
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
        public virtual Candidate Candidate { get; set; }
        public virtual Recruiter Recruiter { get; set; }
    }
}