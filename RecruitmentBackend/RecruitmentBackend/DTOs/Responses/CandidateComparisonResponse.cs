using System;
using System.Collections.Generic;

namespace RecruitmentBackend.DTOs.Responses
{
    public class CandidateComparisonResponse
    {
        public string JobId { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public List<CandidateCriterionDefinitionDto> AvailableCriteria { get; set; } = new List<CandidateCriterionDefinitionDto>();
        public List<CandidateComparisonItemDto> Candidates { get; set; } = new List<CandidateComparisonItemDto>();
    }

    public class CandidateRankingResponse : CandidateComparisonResponse
    {
        public string SortBy { get; set; } = "overall";
        public string? CriterionName { get; set; }
        public string Search { get; set; } = string.Empty;
    }

    public class CandidateCriterionDefinitionDto
    {
        public string CriterionName { get; set; } = string.Empty;
        public int Weight { get; set; }
        public int MaxScore { get; set; }
    }

    public class CandidateComparisonItemDto
    {
        public string ApplicationId { get; set; } = string.Empty;
        public string CandidateId { get; set; } = string.Empty;
        public string CandidateName { get; set; } = string.Empty;
        public string CandidateEmail { get; set; } = string.Empty;
        public string CandidatePhone { get; set; } = string.Empty;
        public string JobId { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public string ApplicationStatus { get; set; } = string.Empty;
        public DateTime AppliedAt { get; set; }
        public string CvUrl { get; set; } = string.Empty;
        public decimal? AiScore { get; set; }
        public int? OverallRank { get; set; }
        public int? SelectedCriterionRank { get; set; }
        public string Classification { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string AiDataStatus { get; set; } = "missing";
        public string AiDataMessage { get; set; } = string.Empty;
        public List<string> MatchedSkills { get; set; } = new List<string>();
        public List<string> MissingSkills { get; set; } = new List<string>();
        public List<string> Strengths { get; set; } = new List<string>();
        public List<string> Weaknesses { get; set; } = new List<string>();
        public string Degree { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public string University { get; set; } = string.Empty;
        public double? YearsOfExperience { get; set; }
        public List<string> Certificates { get; set; } = new List<string>();
        public List<CandidateCriterionResultDto> CriteriaResults { get; set; } = new List<CandidateCriterionResultDto>();
    }

    public class CandidateCriterionResultDto
    {
        public string CriterionName { get; set; } = string.Empty;
        public int Weight { get; set; }
        public int MaxScore { get; set; }
        public int? Score { get; set; }
        public string Comment { get; set; } = string.Empty;
        public bool HasData { get; set; }
    }
}
