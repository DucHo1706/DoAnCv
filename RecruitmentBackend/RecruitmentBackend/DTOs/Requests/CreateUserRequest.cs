using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.DTOs.Requests
{
    public class CreateUserRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập họ tên")]
        public string Name { get; set; }
        [Required]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }
        public string Role { get; set; }
        public List<string>? BranchIds { get; set; }
    }
}