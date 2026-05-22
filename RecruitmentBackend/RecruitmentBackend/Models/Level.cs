using System;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Models
{
    public class Level
    {
        [Key]
        public string LevelID { get; set; } = Guid.NewGuid().ToString();
        public string LevelName { get; set; } // Intern, Fresher, Junior...
    }
}