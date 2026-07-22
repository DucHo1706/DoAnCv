using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    public class Notification
    {
        [Key]
        public string NotificationID { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string AccountID { get; set; }

        [ForeignKey("AccountID")]
        public virtual Account Account { get; set; }

        [Required]
        public string Title { get; set; }

        [Required]
        public string Content { get; set; }

        public string? RedirectUrl { get; set; }

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
