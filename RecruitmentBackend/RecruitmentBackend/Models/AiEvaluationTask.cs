using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    public class AiEvaluationTask
    {
        [Key]
        public string AiEvaluationTaskID { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string ApplicationID { get; set; } = string.Empty;

        [ForeignKey(nameof(ApplicationID))]
        public virtual Application Application { get; set; } = null!;

        [Required]
        [MaxLength(32)]
        public string Status { get; set; } = Constants.AiEvaluationTaskStatuses.Pending;

        public DateTime NotBeforeUtc { get; set; }
        public int AttemptCount { get; set; }
        public int MaxAttempts { get; set; } = 3;
        public int ManualRetryCount { get; set; }
        public DateTime? LastAttemptAtUtc { get; set; }
        public DateTime? ProcessingStartedAtUtc { get; set; }
        public DateTime? CompletedAtUtc { get; set; }

        [MaxLength(64)]
        public string? LastErrorCode { get; set; }

        [MaxLength(1000)]
        public string? LastErrorMessage { get; set; }

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

        [Timestamp]
        public byte[] RowVersion { get; set; } = Array.Empty<byte>();
    }
}
