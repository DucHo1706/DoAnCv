using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    public class JobPosting
    {
        [Key]
        public string JobID { get; set; } = Guid.NewGuid().ToString();
        
        public string RecruiterID { get; set; }
        public string PositionID { get; set; }
        public string BranchID { get; set; }
        public DateTime? StartDate { get; set; }
        public int? MaxCandidates { get; set; }

        public decimal SalaryMin { get; set; }
        public decimal SalaryMax { get; set; }
        public string JobDescription { get; set; }
        public string JobRequirement { get; set; }
        
        public string JDExtractedSkills { get; set; } // Chuỗi JSON Kỹ năng AI bóc từ JD
        
        public DateTime Deadline { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Rejected, Published, Closed
        public string RejectReason { get; set; }
        
        public string ApprovedBy { get; set; } 
        public DateTime? ApprovedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public int ViewCount { get; set; } = 0;

        [MaxLength(450)]
        public string? RepostedFromJobID { get; set; }

        [MaxLength(450)]
        public string? CampaignGroupID { get; set; }

        public int RecruitmentRound { get; set; } = 1;

        [ForeignKey(nameof(RepostedFromJobID))]
        public virtual JobPosting? RepostedFromJob { get; set; }

        public virtual ICollection<JobPosting> RepostedJobs { get; set; } = new List<JobPosting>();

        public string? CategoryID { get; set; }
        [ForeignKey("CategoryID")]
        public virtual Category? Category { get; set; }

        public string? JobLevelID { get; set; }
        [ForeignKey("JobLevelID")]
        public virtual JobLevel? JobLevel { get; set; }

        // Thêm danh sách tiêu chí đánh giá động cho từng Job
        public virtual ICollection<JobCriterion> Criteria { get; set; } = new List<JobCriterion>();
    }
}
