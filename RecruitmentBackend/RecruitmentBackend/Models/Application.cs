using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    public class Application
    {
        [Key]
        public string ApplicationID { get; set; } = Guid.NewGuid().ToString();
        public string JobID { get; set; }
        [ForeignKey("JobID")]
        public virtual JobPosting JobPosting { get; set; }
        
        public string CVID { get; set; }
        [ForeignKey("CVID")]
        public virtual CandidateCV CandidateCV { get; set; }
        
        public string Status { get; set; } = "Applied"; 
        public DateTime AppliedAt { get; set; } = DateTime.Now;
        public virtual AIEvaluation AIEvaluation { get; set; }
        public virtual InterviewSchedule? InterviewSchedule { get; set; }
        public virtual ICollection<ApplicationStatusHistory> StatusHistory { get; set; } = new List<ApplicationStatusHistory>();
    }
}
