using System;
using System.Collections.Generic;

namespace RecruitmentBackend.DTOs.Responses
{
    public class JobSummaryDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string Salary { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public DateTime? UpdatedAt { get; set; }
        public string Logo { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> Skills { get; set; } = new List<string>();
        public int AiScore { get; set; } = 0;
    }
}