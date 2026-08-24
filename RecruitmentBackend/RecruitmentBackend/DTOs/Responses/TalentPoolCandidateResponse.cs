namespace RecruitmentBackend.DTOs.Responses
{
    public class TalentPoolCandidateResponse
    {
        public string TalentPoolCandidateId { get; set; }
        public string CandidateId { get; set; }
        public string LatestCvId { get; set; }
        public string LatestCvUrl { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string HighlightSkillsJson { get; set; }
        public int HighestAiScore { get; set; }
        public string HighestScoreJobTitle { get; set; }
        public string CurrentAvailabilityStatus { get; set; }
        public DateTime? LastAppliedAt { get; set; }
        public DateTime LastUpdatedAt { get; set; }
        public string Source { get; set; }
        public bool IsInviteLocked { get; set; }
        public string InviteLockReason { get; set; }
        public string DomainJson { get; set; } = "[]";
        public string TargetPositionsJson { get; set; } = "[]";
        public string JobLevel { get; set; }
        public string SourcingPriority { get; set; }
        public string SourcingStage { get; set; }
        public string TagsJson { get; set; } = "[]";
        public decimal? ExpectedSalary { get; set; }
        public DateTime? AvailableFrom { get; set; }
    }
}
