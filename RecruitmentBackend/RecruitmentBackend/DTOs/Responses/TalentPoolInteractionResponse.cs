namespace RecruitmentBackend.DTOs.Responses
{
    public class TalentPoolInteractionResponse
    {
        public string InteractionId { get; set; }
        public string TalentPoolCandidateId { get; set; }
        public string ApplicationId { get; set; }
        public string JobId { get; set; }
        public string Type { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public int? AiScore { get; set; }
        public string StatusSnapshot { get; set; }
        public string CreatedByRecruiterId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}