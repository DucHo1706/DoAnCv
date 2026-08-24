using System;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Models
{
    public class TalentPoolCandidate
    {
        [Key]
        public string TalentPoolCandidateID { get; set; } = Guid.NewGuid().ToString();
        public string? RecruiterID { get; set; }
        [Required]
        public string CandidateID { get; set; }
        public string LatestCVID { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string HighlightSkillsJson { get; set; }
        public int HighestAiScore { get; set; }
        public string HighestScoreJobTitle { get; set; }
        public string CurrentAvailabilityStatus { get; set; }
        public DateTime? LastAppliedAt { get; set; }
        public DateTime LastUpdatedAt { get; set; } = DateTime.Now;
        public string Source { get; set; }
        public bool IsActive { get; set; } = true;

        // Dữ liệu sourcing có cấu trúc, dùng cho lọc, đề xuất job và mining.
        public string DomainJson { get; set; } = "[]";
        public string TargetPositionsJson { get; set; } = "[]";
        public string? JobLevel { get; set; }
        public string SourcingPriority { get; set; } = "Normal";
        public string SourcingStage { get; set; } = "Saved";
        public string TagsJson { get; set; } = "[]";
        public decimal? ExpectedSalary { get; set; }
        public DateTime? AvailableFrom { get; set; }
    }
}
