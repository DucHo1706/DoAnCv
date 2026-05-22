using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.DTOs.Requests
{
    public class JobLevelRequest
    {
        [Required(ErrorMessage = "Tên cấp bậc không được để trống")]
        public string Name { get; set; }
        
        public string? ParentId { get; set; }
    }
}