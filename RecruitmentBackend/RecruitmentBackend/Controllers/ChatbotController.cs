using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;
using System;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Candidate,Recruiter,Admin")]
    public class ChatbotController : ControllerBase
    {
        private readonly IChatbotService _chatbotService;
        private readonly AppDbContext _context;
        private readonly IFileService _fileService;

        public ChatbotController(IChatbotService chatbotService, AppDbContext context, IFileService fileService)
        {
            _chatbotService = chatbotService;
            _context = context;
            _fileService = fileService;
        }

        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromForm] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Prompt) && request.File == null)
            {
                return BadRequest(new { message = "Vui lòng nhập câu hỏi hoặc đính kèm CV." });
            }

            try
            {
                string attachedFileUrl = null;
                // 1. Nếu có file đính kèm, upload lên Cloudinary để lấy link lưu lại
                if (request.File != null && request.File.Length > 0)
                {
                    attachedFileUrl = await _fileService.SaveFileAsync(request.File);
                }

                // 2. Gửi sang Python để AI xử lý và bóc tách nội dung
                var aiResult = await _chatbotService.GetChatResponseAsync(request);

                // 3. Lưu toàn bộ xuống DB (bao gồm cả URL file và Text bóc tách)
                var userMsg = new ChatMessage 
                { 
                    SessionId = request.SessionId, 
                    Role = "user", 
                    Text = request.Prompt ?? "Đã gửi tệp CV",
                    AttachedFileUrl = attachedFileUrl,
                    ExtractedText = aiResult.ExtractedText
                };
                var aiMsg = new ChatMessage { SessionId = request.SessionId, Role = "ai", Text = aiResult.Reply };
                _context.ChatMessages.AddRange(userMsg, aiMsg);
                await _context.SaveChangesAsync();

                return Ok(new { reply = aiResult.Reply });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi kết nối AI: " + ex.Message });
            }
        }
    }
}
