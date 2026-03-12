using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace RecruitmentBackend.Models
{
    public class Category
    {
        [Key]
        public string Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } 

        [JsonIgnore] 
        public ICollection<Job> Jobs { get; set; } = new List<Job>();
    }
}
