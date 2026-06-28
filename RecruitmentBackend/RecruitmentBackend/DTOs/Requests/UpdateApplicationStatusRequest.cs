using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.DTOs.Requests
{
    public class UpdateApplicationStatusRequest
    {
        [Required]
        public string Status { get; set; }
    }
}