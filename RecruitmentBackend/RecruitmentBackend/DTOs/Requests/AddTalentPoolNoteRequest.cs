using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.DTOs.Requests
{
    public class AddTalentPoolNoteRequest
    {
        [Required]
        public string Note { get; set; }
    }
}