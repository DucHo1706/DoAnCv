using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    public class ApplicationStatusHistory
    {
        [Key]
        public string ApplicationStatusHistoryID { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string ApplicationID { get; set; } = string.Empty;

        [ForeignKey(nameof(ApplicationID))]
        public virtual Application Application { get; set; } = null!;

        [Required]
        [MaxLength(50)]
        public string FromStatus { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string ToStatus { get; set; } = string.Empty;

        public DateTime ChangedAtUtc { get; set; } = DateTime.UtcNow;

        [MaxLength(450)]
        public string? ChangedByAccountID { get; set; }

        [MaxLength(100)]
        public string Source { get; set; } = "System";
    }
}
