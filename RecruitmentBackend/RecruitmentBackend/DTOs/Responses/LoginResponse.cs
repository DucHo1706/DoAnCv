namespace RecruitmentBackend.DTOs.Responses
{
    public class LoginResponse
    {
        public string Token { get; set; } // Chuỗi JWT để Frontend lưu lại
        public string AccountId { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public string FullName { get; set; }
    }
}