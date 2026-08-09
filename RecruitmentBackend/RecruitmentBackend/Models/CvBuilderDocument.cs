using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Models;

public class CvBuilderDocument
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string CandidateID { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string Name { get; set; } = "CV chưa đặt tên";

    [Required]
    public string ContentJson { get; set; } = "{}";

    [Required]
    public string SettingsJson { get; set; } = "{}";

    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
