using System;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Models
{
    public class Branch
    {
        [Key]
        public string BranchID { get; set; } = Guid.NewGuid().ToString();
        public string BranchName { get; set; }
        public string Address { get; set; }
        public string Phone { get; set; }
        public bool IsActive { get; set; } = true;
    }
}