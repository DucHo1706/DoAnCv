using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Models
{
    public class CandidateProfile
    {
        [Key]
        public string Id { get; set; }

        [Required]
        public string FullName { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        public string Phone { get; set; }

        public string CvFilePath { get; set; } 

        public double MatchScore { get; set; } 

        public string? AiExplanation { get; set; }

        public string? ExtractedSkills { get; set; } 

        public DateTime AppliedAt { get; set; } = DateTime.Now;

        public string JobId { get; set; }

        [ForeignKey("JobId")]
        public Job Job { get; set; }
    }
}
