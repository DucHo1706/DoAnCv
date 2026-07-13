using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    public class InterviewSchedule
    {
        [Key]
        public string ScheduleID { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string ApplicationID { get; set; }

        [ForeignKey("ApplicationID")]
        public virtual Application Application { get; set; }

        [Required]
        public DateTime InterviewDate { get; set; }

        [Required]
        [MaxLength(50)]
        public string Format { get; set; } // "Online" or "Offline"

        [Required]
        [MaxLength(500)]
        public string LocationOrLink { get; set; } // Address or Meet/Zoom URL

        [MaxLength(100)]
        public string? MeetingID { get; set; }

        [MaxLength(50)]
        public string? Passcode { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
