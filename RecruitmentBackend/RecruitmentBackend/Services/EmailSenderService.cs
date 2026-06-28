using System.Net;
using System.Net.Mail;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Settings;

namespace RecruitmentBackend.Services
{
    public class EmailSenderService : IEmailSenderService
    {
        private readonly EmailSettings _emailSettings;

        public EmailSenderService(IOptions<EmailSettings> emailSettings)
        {
            _emailSettings = emailSettings.Value;
        }

        public async Task<(bool IsSuccess, string Message)> SendEmailAsync(
            string toEmail,
            string subject,
            string body,
            string? ccEmail = null,
            bool isHtml = false,
            List<IFormFile>? attachments = null)
        {
            if (string.IsNullOrWhiteSpace(toEmail))
            {
                return (false, "Email người nhận không được để trống.");
            }

            if (string.IsNullOrWhiteSpace(subject))
            {
                return (false, "Tiêu đề email không được để trống.");
            }

            if (string.IsNullOrWhiteSpace(body))
            {
                return (false, "Nội dung email không được để trống.");
            }

            if (string.IsNullOrWhiteSpace(_emailSettings.SmtpHost))
            {
                return (false, "Chưa cấu hình SmtpHost.");
            }

            if (_emailSettings.SmtpPort <= 0)
            {
                return (false, "Chưa cấu hình SmtpPort hợp lệ.");
            }

            if (string.IsNullOrWhiteSpace(_emailSettings.SenderEmail))
            {
                return (false, "Chưa cấu hình SenderEmail.");
            }

            if (string.IsNullOrWhiteSpace(_emailSettings.Username))
            {
                return (false, "Chưa cấu hình Username.");
            }

            if (string.IsNullOrWhiteSpace(_emailSettings.Password) ||
                _emailSettings.Password == "APP_PASSWORD_HERE")
            {
                return (false, "Chưa cấu hình App Password cho email gửi.");
            }

            try
            {
                using MailMessage mailMessage = new MailMessage();

                MailAddress senderAddress = new MailAddress(
                    _emailSettings.SenderEmail,
                    _emailSettings.SenderName,
                    Encoding.UTF8);

                mailMessage.From = senderAddress;
                mailMessage.To.Add(toEmail);

                if (!string.IsNullOrWhiteSpace(ccEmail))
                {
                    mailMessage.CC.Add(ccEmail);
                }

                mailMessage.Subject = subject;
                mailMessage.Body = body;
                mailMessage.IsBodyHtml = isHtml;
                mailMessage.SubjectEncoding = Encoding.UTF8;
                mailMessage.BodyEncoding = Encoding.UTF8;

                if (attachments != null && attachments.Count > 0)
                {
                    foreach (IFormFile attachmentFile in attachments)
                    {
                        if (attachmentFile == null)
                        {
                            continue;
                        }

                        if (attachmentFile.Length <= 0)
                        {
                            continue;
                        }

                        MemoryStream attachmentStream = new MemoryStream();
                        await attachmentFile.CopyToAsync(attachmentStream);
                        attachmentStream.Position = 0;

                        Attachment mailAttachment = new Attachment(
                            attachmentStream,
                            attachmentFile.FileName,
                            attachmentFile.ContentType);

                        mailMessage.Attachments.Add(mailAttachment);
                    }
                }

                using SmtpClient smtpClient = new SmtpClient(
                    _emailSettings.SmtpHost,
                    _emailSettings.SmtpPort);

                smtpClient.EnableSsl = _emailSettings.EnableSsl;
                smtpClient.UseDefaultCredentials = false;
                smtpClient.Credentials = new NetworkCredential(
                    _emailSettings.Username,
                    _emailSettings.Password);

                await smtpClient.SendMailAsync(mailMessage);

                return (true, "Gửi email thành công.");
            }
            catch (SmtpException ex)
            {
                return (false, $"Lỗi SMTP khi gửi email: {ex.Message}");
            }
            catch (Exception ex)
            {
                return (false, $"Lỗi hệ thống khi gửi email: {ex.Message}");
            }
        }
    }
}