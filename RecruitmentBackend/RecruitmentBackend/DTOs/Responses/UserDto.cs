using System;
using System.Collections.Generic;

namespace RecruitmentBackend.DTOs.Responses
{
    public class UserDto
    {
        public string Id { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public string FullName { get; set; }
        public List<string> BranchIds { get; set; }
    }
}