namespace RecruitmentBackend.DTOs.Responses;

public class CandidateDiscoverySearchResponse
{
    public string CandidateId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Major { get; set; }
    public string? Address { get; set; }
    public double? YearsOfExperience { get; set; }
    public decimal? HighestAiScore { get; set; }
    public string SkillsJson { get; set; } = "[]";
    public bool ContactAllowed { get; set; }
    public bool CvAllowed { get; set; }
    public string? LatestCvUrl { get; set; }
    public List<string> ProfileDomains { get; set; } = new();
    public List<string> ProfilePositions { get; set; } = new();
    public List<CandidatePublicCvResponse> PublicCvs { get; set; } = new();
    public bool AlreadyInTalentPool { get; set; }
}
