using Microsoft.AspNetCore.Mvc;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CandidateEmailsController : ControllerBase
    {
        private readonly IEmailSenderService _emailSenderService;
        private readonly ICandidateEmailAiService _candidateEmailAiService;

        public CandidateEmailsController(
            IEmailSenderService emailSenderService,
            ICandidateEmailAiService candidateEmailAiService)
        {
            _emailSenderService = emailSenderService;
            _candidateEmailAiService = candidateEmailAiService;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateCandidateEmail(
            [FromBody] GenerateCandidateEmailRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Dữ liệu yêu cầu AI soạn email không hợp lệ."
                });
            }

            (bool isSuccess, string message, var data) =
                await _candidateEmailAiService.GenerateEmailAsync(request);

            if (isSuccess == false)
            {
                return BadRequest(new
                {
                    message = message
                });
            }

            return Ok(new
            {
                message = message,
                subject = data?.Subject,
                body = data?.Body
            });
        }

        [HttpPost("send")]
        [RequestSizeLimit(25 * 1024 * 1024)]
        public async Task<IActionResult> SendCandidateEmail(
            [FromForm] SendCandidateEmailRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Dữ liệu gửi email không hợp lệ."
                });
            }

            if (string.IsNullOrWhiteSpace(request.ToEmail))
            {
                return BadRequest(new
                {
                    message = "Email người nhận không được để trống."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Subject))
            {
                return BadRequest(new
                {
                    message = "Tiêu đề email không được để trống."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Body))
            {
                return BadRequest(new
                {
                    message = "Nội dung email không được để trống."
                });
            }

            (bool isSuccess, string message) = await _emailSenderService.SendEmailAsync(
                request.ToEmail,
                request.Subject,
                request.Body,
                request.CcEmail,
                request.IsHtml,
                request.Attachments);

            if (isSuccess == false)
            {
                return BadRequest(new
                {
                    message = message
                });
            }

            return Ok(new
            {
                message = message
            });
        }
    }
}