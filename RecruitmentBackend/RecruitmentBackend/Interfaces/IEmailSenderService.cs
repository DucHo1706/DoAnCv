using Microsoft.AspNetCore.Http;

namespace RecruitmentBackend.Interfaces
{
    public interface IEmailSenderService
    {
        Task<(bool IsSuccess, string Message)> SendEmailAsync(
            string toEmail,
            string subject,
            string body,
            string? ccEmail = null,
            bool isHtml = false,
            List<IFormFile>? attachments = null);
    }
}