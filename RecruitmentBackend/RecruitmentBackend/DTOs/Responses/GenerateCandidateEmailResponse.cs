namespace RecruitmentBackend.DTOs.Responses
{
    public class GenerateCandidateEmailResponse
    {
        public string Subject { get; set; } = string.Empty;

        public string Body { get; set; } = string.Empty;

        // ai: nội dung do Python tạo; template: mẫu chỉnh sửa được khi AI tắt.
        public string Source { get; set; } = "ai";
    }
}
