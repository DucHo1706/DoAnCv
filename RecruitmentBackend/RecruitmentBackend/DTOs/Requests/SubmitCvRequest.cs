using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.DTOs.Requests
{
    public class SubmitCvRequest
    {
        [Required]
        public string FullName { get; set; }

        public string? Email { get; set; }
        public string? Phone { get; set; }

        [Required]
        public string JobId { get; set; } // ID của công việc ứng tuyển

        [Required]
        public IFormFile CvFile { get; set; } // file CV được upload
    }
}
