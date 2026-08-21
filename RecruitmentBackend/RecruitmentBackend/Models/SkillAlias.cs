using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Models
{
    public class SkillAlias
    {
        [Key]
        public int SkillAliasID { get; set; }

        public int SkillID { get; set; }

        [Required]
        [StringLength(100)]
        public string Alias { get; set; } = string.Empty;

        [Required]
        [StringLength(120)]
        public string NormalizedAlias { get; set; } = string.Empty;

        public Skill Skill { get; set; } = null!;
    }
}
