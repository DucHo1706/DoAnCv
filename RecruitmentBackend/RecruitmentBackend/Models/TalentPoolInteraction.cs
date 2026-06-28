using System;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Models
{
    public class TalentPoolInteraction
    {
        [Key]
        public string InteractionID { get; set; } = Guid.NewGuid().ToString();
        [Required]
        public string TalentPoolCandidateID { get; set; }
        public string? ApplicationID { get; set; }
        public string? JobID { get; set; }
        [Required]
        public string Type { get; set; }
        public string? Title { get; set; }
        public string? Content { get; set; }
        public int? AiScore { get; set; }
        public string? StatusSnapshot { get; set; }
        public string? CreatedByRecruiterID { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}