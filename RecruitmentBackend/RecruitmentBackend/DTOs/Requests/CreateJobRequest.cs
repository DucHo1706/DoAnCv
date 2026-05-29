﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.DTOs.Requests
{
    public class CreateJobRequest
    {
        [Required(ErrorMessage = "Vui lòng chọn Vị trí")] public string PositionId { get; set; }
        [Required(ErrorMessage = "Vui lòng chọn Chi nhánh")] public string BranchId { get; set; }
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

    }
}
