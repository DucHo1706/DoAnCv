using System.Text.Json.Serialization;

namespace RecruitmentBackend.DTOs.Responses
{
    public class CandidateInfoDetail
    {
        [JsonPropertyName("email")]
        public string Email { get; set; }

        [JsonPropertyName("phone")]
        public string Phone { get; set; }

        [JsonPropertyName("extracted_skills")]
        public List<string> ExtractedSkills { get; set; } // danh sách kỹ năng đã trích xuất
    }
}
