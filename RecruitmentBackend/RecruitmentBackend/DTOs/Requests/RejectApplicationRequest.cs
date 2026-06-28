using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.DTOs.Requests
{
    public class RejectApplicationRequest
    {
        [Required]
        public string ReasonType { get; set; }
        public string Note { get; set; }
    }
}