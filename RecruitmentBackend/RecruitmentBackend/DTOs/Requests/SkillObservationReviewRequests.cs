namespace RecruitmentBackend.DTOs.Requests
{
    public class MapSkillObservationRequest
    {
        public int SkillId { get; set; }
    }

    public class ApproveSkillObservationRequest
    {
        public string CanonicalName { get; set; } = string.Empty;
    }

    public class RejectSkillObservationRequest
    {
        public string? Reason { get; set; }
    }
}
