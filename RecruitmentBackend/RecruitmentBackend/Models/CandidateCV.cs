using System;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Models
{
    public class CandidateCV
    {
        [Key]
        public string CVID { get; set; } = Guid.NewGuid().ToString();
        public string CandidateID { get; set; }
        
        public string FilePath { get; set; }
        public string RawText { get; set; } 
        public string CVExtractedSkills { get; set; } 
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}