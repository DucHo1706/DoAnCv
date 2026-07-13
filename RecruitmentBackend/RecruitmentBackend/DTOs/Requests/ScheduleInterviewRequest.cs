using System;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.DTOs.Requests
{
    public class ScheduleInterviewRequest
    {
        [Required(ErrorMessage = "Thời gian phỏng vấn không được để trống.")]
        public DateTime InterviewDate { get; set; }

        [Required(ErrorMessage = "Hình thức phỏng vấn không được để trống.")]
        [MaxLength(50)]
        public string Format { get; set; } // "Online" hoặc "Offline"

        [Required(ErrorMessage = "Địa điểm hoặc đường dẫn họp trực tuyến không được để trống.")]
        [MaxLength(500)]
        public string LocationOrLink { get; set; }

        [MaxLength(100)]
        public string? MeetingID { get; set; }

        [MaxLength(50)]
        public string? Passcode { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }
    }
}
