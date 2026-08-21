using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Models
{
    public class Skill
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } 

        public bool IsApproved { get; set; } = true;

        public ICollection<SkillAlias> Aliases { get; set; } = new List<SkillAlias>();
    }
}
