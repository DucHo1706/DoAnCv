﻿using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    public class Job
    {
        [Key]
        public string Id { get; set; }
        
        [Required]
        public string PositionId { get; set; }
        [ForeignKey("PositionId")]
        public JobPosition Position { get; set; }

        [Required]
        public string Description { get; set; }
        [Required]
        public string Requirements { get; set; }

        [Required]
        public string BranchId { get; set; }
        [ForeignKey("BranchId")]
        public Branch Branch { get; set; }

        public string SalaryRange { get; set; }
        // trạng thái 
        public bool IsActive { get; set; } = true;
        public bool IsApproved { get; set; } = false;
        // thời gian 
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? StartDate { get; set; } // Ngày bắt đầu nhận CV
        public DateTime? Deadline { get; set; }  // Hạn chót nộp CV
        // giới hạn số lượng 
        public int? MaxCandidates { get; set; } // Số CV tối đa nhận được

        public ICollection<CandidateProfile> Candidates { get; set; }
        public ICollection<Category> Categories { get; set; } = new List<Category>();
    }
}
