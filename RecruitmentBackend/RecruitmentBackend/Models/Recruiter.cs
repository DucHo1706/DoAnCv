using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    public class Recruiter
    {
        [Key]
        public string RecruiterID { get; set; } = Guid.NewGuid().ToString();
        public string AccountID { get; set; }
        [ForeignKey("AccountID")]
        public virtual Account Account { get; set; }

        public string FullName { get; set; }
        public string Phone { get; set; }
        public string? Department { get; set; }
        public string? CompanyBranch { get; set; }
        public string? Bio { get; set; }
        public string? LinkedInUrl { get; set; }

        public virtual ICollection<RecruiterBranch> RecruiterBranches { get; set; }
    }
}