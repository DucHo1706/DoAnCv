using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    public class Position
    {
        [Key]
        public string PositionID { get; set; } = Guid.NewGuid().ToString();
        public string CategoryID { get; set; }
        [ForeignKey("CategoryID")]
        public virtual Category Category { get; set; }
        
        public string PositionName { get; set; }
        public bool IsActive { get; set; } = true;
    }
}