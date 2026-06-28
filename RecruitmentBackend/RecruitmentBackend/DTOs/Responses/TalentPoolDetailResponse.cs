namespace RecruitmentBackend.DTOs.Responses
{
    public class TalentPoolDetailResponse
    {
        public TalentPoolCandidateResponse Candidate { get; set; }

        public List<TalentPoolInteractionResponse> Timeline { get; set; }
    }
}