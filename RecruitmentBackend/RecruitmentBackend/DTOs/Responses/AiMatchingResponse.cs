using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace RecruitmentBackend.DTOs.Responses
{
    public class AiMatchingResponse
    {
        [JsonPropertyName("status")]
        public string Status { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; }

        [JsonPropertyName("candidate_info")]
        public CandidateInfo CandidateInfo { get; set; }

        [JsonPropertyName("matching_result")]
        public MatchingResult MatchingResult { get; set; }
    }

    public class CandidateInfo
    {
        [JsonPropertyName("email")]
        public string Email { get; set; }

        [JsonPropertyName("phone")]
        public string Phone { get; set; }

        [JsonPropertyName("extracted_skills")]
        public List<string> ExtractedSkills { get; set; } = new List<string>();
    }

    public class MatchingResult
    {
        [JsonPropertyName("total_score")]
        public double? TotalScore { get; set; }

        [JsonPropertyName("summary")]
        public string? Summary { get; set; }

        [JsonPropertyName("classification")]
        public string? Classification { get; set; }

        [JsonPropertyName("criteria_results")]
        public List<CriteriaScoreResult> CriteriaResults { get; set; } = new List<CriteriaScoreResult>();

        [JsonPropertyName("matched_skills")]
        public List<string> MatchedSkills { get; set; } = new List<string>();

        [JsonPropertyName("missing_skills")]
        public List<string> MissingSkills { get; set; } = new List<string>();

        // Field cũ: giữ lại để không làm lỗi code cũ của project hoặc partner
        // Không dùng làm luồng chính cho nghiệp vụ mới
        [JsonPropertyName("score")]
        public double? Score { get; set; }

        [JsonPropertyName("explanation")]
        public string? Explanation { get; set; }
    }

    public class CriteriaScoreResult
    {
        [JsonPropertyName("criterion_name")]
        public string CriterionName { get; set; }

        [JsonPropertyName("weight")]
        public int Weight { get; set; }

        [JsonPropertyName("score")]
        public int Score { get; set; }

        [JsonPropertyName("max_score")]
        public int MaxScore { get; set; }

        [JsonPropertyName("comment")]
        public string Comment { get; set; }
    }
}