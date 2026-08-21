using System.Text.Json.Serialization;

namespace RecruitmentBackend.DTOs.Responses
{
    public class CvExtractionResponse
    {
        [JsonPropertyName("status")] public string Status { get; set; } = string.Empty;
        [JsonPropertyName("message")] public string Message { get; set; } = string.Empty;
        [JsonPropertyName("raw_text")] public string RawText { get; set; } = string.Empty;
        [JsonPropertyName("email")] public string? Email { get; set; }
        [JsonPropertyName("phone")] public string? Phone { get; set; }
        [JsonPropertyName("skills")] public List<string> Skills { get; set; } = new();
        [JsonPropertyName("years_of_experience")] public double? YearsOfExperience { get; set; }
        [JsonPropertyName("extraction_quality")] public CvExtractionQualityResponse? ExtractionQuality { get; set; }
    }

    public class CvExtractionQualityResponse
    {
        [JsonPropertyName("method")] public string Method { get; set; } = string.Empty;
        [JsonPropertyName("quality_score")] public double QualityScore { get; set; }
        [JsonPropertyName("quality_level")] public string QualityLevel { get; set; } = string.Empty;
        [JsonPropertyName("warnings")] public List<string> Warnings { get; set; } = new();
    }
}
