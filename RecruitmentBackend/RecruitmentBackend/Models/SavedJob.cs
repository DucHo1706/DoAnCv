using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    public class SavedJob
    {
        [Key]
        public string SavedJobID { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string CandidateID { get; set; }

        [ForeignKey("CandidateID")]
        public virtual Candidate Candidate { get; set; }

        [Required]
        public string JobID { get; set; }

        [ForeignKey("JobID")]
        public virtual JobPosting JobPosting { get; set; }

        public DateTime SavedAt { get; set; } = DateTime.Now;
    }
}
