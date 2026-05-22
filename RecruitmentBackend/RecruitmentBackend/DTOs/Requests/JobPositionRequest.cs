using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.DTOs.Requests
{
    public class JobPositionRequest
    {
        [Required(ErrorMessage = "Tên vị trí không được để trống")]
        public string Name { get; set; }
        
        [Required(ErrorMessage = "Vui lòng chọn lĩnh vực")]
        public string CategoryId { get; set; }
    }
}