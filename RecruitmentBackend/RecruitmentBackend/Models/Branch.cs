using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Models
{
    public class Branch
    {
        [Key]
        public string Id { get; set; } = System.Guid.NewGuid().ToString();
        
        [Required]
        [StringLength(150)]
        public string Name { get; set; } // Ví dụ: Trụ sở Hồ Chí Minh, Chi nhánh Hà Nội

        public ICollection<Job> Jobs { get; set; }
    }
}