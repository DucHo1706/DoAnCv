using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.DTOs.Requests
{
    public class UpdateUserRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập họ tên")]
        public string Name { get; set; }
        public List<string> BranchIds { get; set; }
    }
}