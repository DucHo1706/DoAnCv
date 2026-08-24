namespace RecruitmentBackend.DTOs.Responses
{
    public sealed class RecruiterCampaignSummaryDto
    {
        public string Id { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string LifecycleStatus { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? Deadline { get; set; }
        public int ViewCount { get; set; }
        public int RecruitmentRound { get; set; }
        public RecruiterCampaignLookupDto? Position { get; set; }
        public RecruiterCampaignLookupDto? Category { get; set; }
        public RecruiterCampaignLookupDto? Branch { get; set; }
        public RecruiterCampaignLookupDto? JobLevel { get; set; }
        public RecruiterCampaignStatsDto Stats { get; set; } = new();
    }

    public sealed class RecruiterCampaignLookupDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }

    public sealed class RecruiterCampaignStatsDto
    {
        public int Total { get; set; }
        public int NewApplications { get; set; }
        public int Interviewing { get; set; }
        public int Offers { get; set; }
        public int Hired { get; set; }
    }
}
