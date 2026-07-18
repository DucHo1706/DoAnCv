using System.Collections.Generic;

namespace RecruitmentBackend.DTOs.Requests
{
    public class CompareCandidatesRequest
    {
        public string JobId { get; set; } = string.Empty;
        public List<string> ApplicationIds { get; set; } = new List<string>();
    }
}
