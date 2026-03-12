using System.Text.Json.Serialization;

namespace RecruitmentBackend.DTOs.Responses
{
    public class AiServiceResponseDto
    {
        [JsonPropertyName("status")]
        public string Status { get; set; }

        [JsonPropertyName("candidate_info")]
        public CandidateInfoDetail CandidateInfo { get; set; } // ứng viên info

        [JsonPropertyName("matching_result")]
        public MatchingResultDetail MatchingResult { get; set; } // kết quả matching
    }
}
