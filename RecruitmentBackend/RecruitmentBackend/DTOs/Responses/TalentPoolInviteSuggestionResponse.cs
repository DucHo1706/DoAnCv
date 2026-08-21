namespace RecruitmentBackend.DTOs.Responses
{
    public class TalentPoolInviteSuggestionResponse
    {
        public bool IsLocked { get; set; }

        public string LockReason { get; set; }

        public TalentPoolCandidateResponse Candidate { get; set; }

        public List<TalentPoolSuggestedJobResponse> SuggestedJobs { get; set; }
    }

    public class TalentPoolSuggestedJobResponse
    {
        public string JobId { get; set; }

        public string JobTitle { get; set; }

        public string BranchName { get; set; }

        public int MatchScore { get; set; }

        public List<string> MatchedSkills { get; set; } = new();

        public List<string> MissingSkills { get; set; } = new();

        public int JobSkillCount { get; set; }

        public string ScoreMethod { get; set; } = "JOB_SKILL_COVERAGE";

        public string Reason { get; set; }

        public string SalaryRange { get; set; }

        public string Deadline { get; set; }
    }
}
