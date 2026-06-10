namespace RecruitmentBackend.DTOs.Responses
{
    public class ExtractedInfoResponse
    {
        public string? Degree { get; set; }
        public string? Major { get; set; }
        public string? University { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("years_of_experience")]
        public double? YearsOfExperience { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("certificates")]
        public List<string>? Certificates { get; set; }

    }
}
