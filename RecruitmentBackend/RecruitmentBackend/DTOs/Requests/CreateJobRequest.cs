﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.DTOs.Requests
{
    public class CreateJobRequest
    {
        [Required(ErrorMessage = "Vui lòng chọn Vị trí")] public string PositionId { get; set; }
        [Required(ErrorMessage = "Vui lòng chọn Chi nhánh")] public string BranchId { get; set; }
        public string? CategoryId { get; set; }
        public string? JobLevelId { get; set; }
        [Required(ErrorMessage = "Vui lòng nhập Mô tả")] public string Description { get; set; }
        [Required(ErrorMessage = "Vui lòng nhập Yêu cầu")] public string Requirements { get; set; }
        [Required(ErrorMessage = "Vui lòng nhập Mức lương")] public string SalaryRange { get; set; }
        public List<JobCriterionRequest> Criteria { get; set; } = new List<JobCriterionRequest>();
        public DateTime? StartDate { get; set; }
        public DateTime? Deadline { get; set; }
        public int? MaxCandidates { get; set; }
    }

    public class JobCriterionRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập tên tiêu chí")] public string Name { get; set; }
        [Range(1, 100, ErrorMessage = "Trọng số phải từ 1 đến 100")] public int Weight { get; set; }
        [MaxLength(450)] public string? CriterionGroupId { get; set; }
        [MaxLength(40)] public string? CriterionType { get; set; }
        [MaxLength(20)] public string? PriorityLevel { get; set; }
        [MaxLength(30)] public string? Operator { get; set; }
        [MaxLength(500)] public string? TargetValue { get; set; }
        [Range(1, 1200, ErrorMessage = "Thời lượng kinh nghiệm phải từ 1 đến 1200 tháng")]
        public int? MinDurationMonths { get; set; }
        [MaxLength(500)] public string? EvidenceSources { get; set; }
        [MaxLength(1000)] public string? EvaluationGuidance { get; set; }
        public int? DisplayOrder { get; set; }
    }
}
