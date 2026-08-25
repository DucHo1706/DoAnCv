using System;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Models
{
    public static class SkillObservationStatuses
    {
        public const string Quarantine = "Quarantine";
        public const string CandidateForReview = "CandidateForReview";
        public const string Mapped = "Mapped";
        public const string Approved = "Approved";
        public const string Rejected = "Rejected";
    }

    /// <summary>
    /// Một cụm kỹ năng chưa có trong taxonomy, kèm nguồn quan sát độc lập.
    /// Bản ghi này không tham gia chấm điểm/Apriori/HUIM cho tới khi được ánh xạ
    /// hoặc duyệt thành Skill chính thức.
    /// </summary>
    public class SkillObservation
    {
        [Key]
        public long SkillObservationID { get; set; }

        [Required, StringLength(20)]
        public string SourceType { get; set; } = string.Empty;

        [Required, StringLength(450)]
        public string SourceEntityID { get; set; } = string.Empty;

        [Required, StringLength(100)]
        public string DisplayText { get; set; } = string.Empty;

        [Required, StringLength(120)]
        public string NormalizedCandidate { get; set; } = string.Empty;

        [StringLength(500)]
        public string? EvidenceText { get; set; }

        [StringLength(100)]
        public string? SourceSection { get; set; }

        public decimal Confidence { get; set; }

        [Required, StringLength(32)]
        public string Status { get; set; } = SkillObservationStatuses.Quarantine;

        public int? ResolvedSkillID { get; set; }

        [StringLength(500)]
        public string? ReviewNote { get; set; }

        public DateTime FirstObservedAtUtc { get; set; } = DateTime.UtcNow;

        public DateTime LastObservedAtUtc { get; set; } = DateTime.UtcNow;

        public DateTime? ReviewedAtUtc { get; set; }
    }
}
