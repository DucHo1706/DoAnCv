using System;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Models
{
    public class CriterionGroup
    {
        [Key]
        public string CriterionGroupID { get; set; } = Guid.NewGuid().ToString();

        [Required, MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [Required, MaxLength(40)]
        public string EvaluationMode { get; set; } = "CUSTOM";

        [MaxLength(500)]
        public string? Description { get; set; }

        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
