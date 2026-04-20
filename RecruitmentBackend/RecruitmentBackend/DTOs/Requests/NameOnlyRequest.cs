using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.DTOs.Requests
{
    public class NameOnlyRequest
    {
        [Required]
        public string Name { get; set; }
    }
}