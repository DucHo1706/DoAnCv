namespace RecruitmentBackend.DTOs.Requests;

public class CandidateDiscoverySearchRequest
{
    public string? Keyword { get; set; }
    public string? Skill { get; set; }
    public string? JobId { get; set; }
    public double? MinYearsOfExperience { get; set; }
    public decimal? MinAiScore { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
