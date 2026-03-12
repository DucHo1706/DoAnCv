using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.DTOs.Requests
{
    public class CreateJobRequest 
    {
        [Required]
        public string Title { get; set; }

        [Required]
        public string Description { get; set; }

        [Required]
        public string Requirements { get; set; }

        public string Location { get; set; }
        public string SalaryRange { get; set; }

        public DateTime? StartDate { get; set; }
        public DateTime? Deadline { get; set; }
        public int? MaxCandidates { get; set; }
        public List<string> CategoryIds { get; set; } = new List<string>();
    }
}
