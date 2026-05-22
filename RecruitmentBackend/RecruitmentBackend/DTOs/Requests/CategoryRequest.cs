using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.DTOs.Requests
{
    public class CategoryRequest
    {
        [Required(ErrorMessage = "Tên lĩnh vực không được để trống")]
        public string Name { get; set; }
        
        public string? ParentId { get; set; }
    }
}