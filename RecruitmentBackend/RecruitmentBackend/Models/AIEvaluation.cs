using System;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Models
{
    public class AIEvaluation
    {
        [Key]
        public string EvaluationID { get; set; } = Guid.NewGuid().ToString();
        public string ApplicationID { get; set; }
        
        public decimal FitScore { get; set; } 
        public string Reason { get; set; } 
        public string MatchedSkills { get; set; } 
        public string MissingSkills { get; set; } 
        public DateTime EvaluatedAt { get; set; } = DateTime.Now;
    }
}