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
    }
}