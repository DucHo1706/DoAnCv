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

        [JsonPropertyName("job_extracted_skills")]
        public List<string> JobExtractedSkills { get; set; } = new List<string>();

        [JsonPropertyName("job_skill_observations")]
        public List<SkillObservationCandidate> JobSkillObservations { get; set; } = new List<SkillObservationCandidate>();

      
    }

    public class CandidateInfo
    {
        [JsonPropertyName("email")]
        public string Email { get; set; }

        [JsonPropertyName("phone")]
        public string Phone { get; set; }

        [JsonPropertyName("extracted_skills")]
        public List<string> ExtractedSkills { get; set; } = new List<string>();

        [JsonPropertyName("raw_text")]
        public string RawText { get; set; }

        [JsonPropertyName("skill_observations")]
        public List<SkillObservationCandidate> SkillObservations { get; set; } = new List<SkillObservationCandidate>();
    }

    public class SkillObservationCandidate
    {
        [JsonPropertyName("raw_text")]
        public string RawText { get; set; } = string.Empty;

        [JsonPropertyName("normalized_candidate")]
        public string NormalizedCandidate { get; set; } = string.Empty;

        [JsonPropertyName("evidence_text")]
        public string EvidenceText { get; set; } = string.Empty;

        [JsonPropertyName("source_section")]
        public string SourceSection { get; set; } = string.Empty;

        [JsonPropertyName("confidence")]
        public double Confidence { get; set; }
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

        [JsonPropertyName("extracted_info")]
        public ExtractedInfoResponse? ExtractedInfo { get; set; }

        [JsonPropertyName("whitebox_score")]
        public double? WhiteboxScore { get; set; }

        [JsonPropertyName("blackbox_score")]
        public double? BlackboxScore { get; set; }
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

        [JsonPropertyName("match_level")]
        public string? MatchLevel { get; set; }

        [JsonPropertyName("confidence")]
        public double? Confidence { get; set; }

        [JsonPropertyName("evidence_text")]
        public string? EvidenceText { get; set; }

        [JsonPropertyName("evidence_section")]
        public string? EvidenceSection { get; set; }

        [JsonPropertyName("extracted_value")]
        public string? ExtractedValue { get; set; }

        [JsonPropertyName("needs_verification")]
        public bool NeedsVerification { get; set; }

    }

}
