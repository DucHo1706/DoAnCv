namespace RecruitmentBackend.DTOs.Requests
{
    public class GenerateCandidateEmailRequest
    {
        public string EmailType { get; set; } = string.Empty;

        public string CandidateName { get; set; } = string.Empty;

        public string JobTitle { get; set; } = string.Empty;

        public string CompanyName { get; set; } = "AI Recruitment";

        public int FitScore { get; set; }

        public string? Classification { get; set; }

        public string? Summary { get; set; }

        public List<string>? MatchedSkills { get; set; }

        public List<string>? MissingSkills { get; set; }

        public string? RejectReason { get; set; }

        public string? EmailContext { get; set; }
    }
}