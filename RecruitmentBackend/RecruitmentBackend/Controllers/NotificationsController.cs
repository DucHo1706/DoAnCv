using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;
using System;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/notifications
        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return Unauthorized("Không xác định được tài khoản.");

            var notifications = await _context.Notifications
                .Where(n => n.AccountID == accountId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(50) // Limit to last 50 notifications
                .Select(n => new
                {
                    id = n.NotificationID,
                    title = n.Title,
                    content = n.Content,
                    redirectUrl = n.RedirectUrl,
                    isRead = n.IsRead,
                    createdAt = n.CreatedAt
                })
                .ToListAsync();

            return Ok(notifications);
        }

        // PUT: api/notifications/{id}/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(string id)
        {
            string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return Unauthorized("Không xác định được tài khoản.");

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.NotificationID == id && n.AccountID == accountId);

            if (notification == null) return NotFound("Không tìm thấy thông báo.");

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã đánh dấu thông báo đã đọc." });
        }

        // PUT: api/notifications/read-all
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return Unauthorized("Không xác định được tài khoản.");

            var unreadNotifications = await _context.Notifications
                .Where(n => n.AccountID == accountId && !n.IsRead)
                .ToListAsync();

            foreach (var n in unreadNotifications)
            {
                n.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã đánh dấu đọc toàn bộ thông báo." });
        }
    }
}
