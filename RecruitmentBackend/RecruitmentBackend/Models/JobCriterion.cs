using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    public class JobCriterion
    {
        [Key]
        public string CriterionID { get; set; } = Guid.NewGuid().ToString();

        public string JobID { get; set; }
        [ForeignKey("JobID")]
        public virtual JobPosting JobPosting { get; set; }

        [Required]
        public string Name { get; set; } 

        [Range(1, 100)]
        public int Weight { get; set; }

        [MaxLength(450)]
        public string? CriterionGroupId { get; set; }

        [MaxLength(40)]
        public string CriterionType { get; set; } = "CUSTOM";

        [MaxLength(20)]
        public string PriorityLevel { get; set; } = "PREFERRED";

        [MaxLength(30)]
        public string Operator { get; set; } = "EXISTS";

        [MaxLength(500)]
        public string? TargetValue { get; set; }

        public int? MinDurationMonths { get; set; }

        [MaxLength(500)]
        public string EvidenceSources { get; set; } = "SKILLS,EXPERIENCE,PROJECTS";

        [MaxLength(1000)]
        public string? EvaluationGuidance { get; set; }

        public int DisplayOrder { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
