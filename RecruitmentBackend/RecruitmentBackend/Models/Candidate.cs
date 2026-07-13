using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    public class Candidate
    {
        [Key]
        public string CandidateID { get; set; } = Guid.NewGuid().ToString();
        public string AccountID { get; set; }
        [ForeignKey("AccountID")]
        public virtual Account Account { get; set; }

        public string FullName { get; set; }
        public string Phone { get; set; }
        public DateTime? DOB { get; set; }
        public string Gender { get; set; }
        public string Address { get; set; }
        public string? AvatarUrl { get; set; }
        public string? DefaultCvUrl { get; set; }
        public string? DefaultCvName { get; set; }
    }
}