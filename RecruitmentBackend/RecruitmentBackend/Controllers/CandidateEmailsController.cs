using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;
using System.Security.Claims;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Recruiter")]
    public class CandidateEmailsController : ControllerBase
    {
        private readonly IEmailSenderService _emailSenderService;
        private readonly ICandidateEmailAiService _candidateEmailAiService;
        private readonly AppDbContext _context;

        public CandidateEmailsController(
            IEmailSenderService emailSenderService,
            ICandidateEmailAiService candidateEmailAiService,
            AppDbContext context)
        {
            _emailSenderService = emailSenderService;
            _candidateEmailAiService = candidateEmailAiService;
            _context = context;
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
                body = data?.Body,
                source = data?.Source
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

            // Log email to database
            try
            {
                var log = new EmailLog
                {
                    RecipientEmail = request.ToEmail,
                    Subject = request.Subject,
                    Body = request.Body,
                    SentAt = DateTime.Now
                };

                if (!string.IsNullOrEmpty(request.ApplicationId))
                {
                    var application = await _context.Applications
                        .Include(a => a.CandidateCV)
                        .Include(a => a.JobPosting)
                        .FirstOrDefaultAsync(a => a.ApplicationID == request.ApplicationId);

                    if (application != null)
                    {
                        log.ApplicationID = request.ApplicationId;
                        log.JobID = application.JobID;
                        log.CandidateID = application.CandidateCV?.CandidateID;

                        var candidate = await _context.Candidates
                            .FirstOrDefaultAsync(c => c.CandidateID == application.CandidateCV.CandidateID);
                        if (candidate != null)
                        {
                            log.CandidateName = candidate.FullName;
                        }

                        var job = application.JobPosting;
                        if (job != null)
                        {
                            var position = await _context.Positions
                                .FirstOrDefaultAsync(p => p.PositionID == job.PositionID);
                            if (position != null)
                            {
                                log.JobTitle = position.PositionName;
                            }

                            var category = await _context.Categories
                                .FirstOrDefaultAsync(c => c.CategoryID == job.CategoryID);
                            if (category != null)
                            {
                                log.CategoryName = category.Name;
                            }
                        }
                    }
                }

                if (string.IsNullOrEmpty(log.CandidateName))
                {
                    var candidate = await _context.Candidates
                        .FirstOrDefaultAsync(c => c.Account.Email == request.ToEmail);
                    log.CandidateName = candidate?.FullName ?? request.ToEmail;
                }

                _context.EmailLogs.Add(log);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error logging email: " + ex.Message);
            }

            return Ok(new
            {
                message = message
            });
        }

        [HttpGet("hr/logs")]
        [Authorize(Roles = "Recruiter")]
        public async Task<IActionResult> GetHrEmailLogs()
        {
            try
            {
                var logs = await _context.EmailLogs
                    .OrderByDescending(l => l.SentAt)
                    .ToListAsync();
                return Ok(logs);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lấy danh sách nhật ký gửi mail: " + ex.Message });
            }
        }
    }
}
