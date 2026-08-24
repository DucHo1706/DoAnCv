using System;
using System.Collections.Generic;

namespace RecruitmentBackend.DTOs.Requests
{
    public class UpdateTalentPoolProfileRequest
    {
        public List<string> Domains { get; set; } = new();
        public List<string> TargetPositions { get; set; } = new();
        public string JobLevel { get; set; }
        public string SourcingPriority { get; set; } = "Normal";
        public string SourcingStage { get; set; } = "Saved";
        public List<string> Tags { get; set; } = new();
        public decimal? ExpectedSalary { get; set; }
        public DateTime? AvailableFrom { get; set; }
    }
}
