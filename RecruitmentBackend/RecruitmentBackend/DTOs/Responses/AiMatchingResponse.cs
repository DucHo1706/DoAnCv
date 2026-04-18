using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace RecruitmentBackend.DTOs.Responses
{
    public class AiMatchingResponse
    {
        [JsonPropertyName("status")]
        public string Status { get; set; }

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
        public List<string> ExtractedSkills { get; set; }
    }

    public class MatchingResult
    {
        [JsonPropertyName("score")]
        public int Score { get; set; }

        [JsonPropertyName("matched_skills")]
        public List<string> MatchedSkills { get; set; }

        [JsonPropertyName("missing_skills")]
        public List<string> MissingSkills { get; set; }

        [JsonPropertyName("explanation")]
        public string Explanation { get; set; }
    }
}