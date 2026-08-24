using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    /// <summary>Domain gắn với từng CV, không gắn cứng vào Candidate.</summary>
    public class CandidateCvDomain
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string CVID { get; set; } = string.Empty;

        [ForeignKey(nameof(CVID))]
        public CandidateCV? CandidateCV { get; set; }

        [Required, MaxLength(100)]
        public string Domain { get; set; } = string.Empty;

        public decimal Confidence { get; set; }

        [Required, MaxLength(40)]
        public string Source { get; set; } = string.Empty;

        public string EvidenceJson { get; set; } = "[]";
        public bool IsConfirmed { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
