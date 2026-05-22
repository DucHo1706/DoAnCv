using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    public class JobLevel
    {
        [Key]
        public string JobLevelID { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        public string? ParentId { get; set; }

        [ForeignKey("ParentId")]
        public virtual JobLevel? ParentLevel { get; set; }

        public virtual ICollection<JobLevel> SubLevels { get; set; } = new List<JobLevel>();
        
        public bool IsActive { get; set; } = true;
    }
}