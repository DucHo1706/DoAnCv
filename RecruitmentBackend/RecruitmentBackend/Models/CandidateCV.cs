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
        public string? ExtractedEmail { get; set; }
        public string? ExtractedPhone { get; set; }
        public string CVExtractedSkills { get; set; }
        public string? Degree { get; set; }
        public string? Major { get; set; }
        public string? University { get; set; }
        public double? YearsOfExperience { get; set; }
        public string? Certificates { get; set; } // Lưu chuỗi JSON
        public string? SourceType { get; set; }
        public string? SourceDocumentId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
