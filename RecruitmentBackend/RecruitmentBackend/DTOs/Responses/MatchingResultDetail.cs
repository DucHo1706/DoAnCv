using System.Text.Json.Serialization;

namespace RecruitmentBackend.DTOs.Responses
{
    public class MatchingResultDetail
    {
        [JsonPropertyName("score")]
        public double Score { get; set; } // điểm số matching

        [JsonPropertyName("explanation")]
        public string Explanation { get; set; } //  giải thích chi tiết về điểm số matching

    }
}
