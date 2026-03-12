using RecruitmentBackend.Models;

namespace RecruitmentBackend.DTOs.Responses
{
    public class JobReviewDto
    {
        public Job JobInfo { get; set; }
        public List<string> WordsToHighlight { get; set; }
    }
}
