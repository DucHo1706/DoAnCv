using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.DTOs.Requests
{
    public class CreateSkillAliasRequest
    {
        [Required]
        [StringLength(100)]
        public string Alias { get; set; } = string.Empty;
    }
}
