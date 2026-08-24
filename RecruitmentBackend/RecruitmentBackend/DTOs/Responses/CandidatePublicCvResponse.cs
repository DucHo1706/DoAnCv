namespace RecruitmentBackend.DTOs.Responses;

public class CandidatePublicCvResponse
{
    public string CvId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string SourceLabel { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsApplicationSnapshot { get; set; }
    public string? FileUrl { get; set; }
    public string? BuilderContentJson { get; set; }
    public string? BuilderSettingsJson { get; set; }
}
