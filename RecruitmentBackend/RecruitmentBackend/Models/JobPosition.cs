using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Models
{
    public class JobPosition
    {
        [Key]
        public string Id { get; set; } = System.Guid.NewGuid().ToString();
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; } // Ví dụ: Frontend Developer, Business Analyst

        public ICollection<Job> Jobs { get; set; }
    }
}