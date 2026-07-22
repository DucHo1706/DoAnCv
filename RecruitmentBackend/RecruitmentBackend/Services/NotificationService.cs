using Microsoft.AspNetCore.SignalR;
using RecruitmentBackend.Data;
using RecruitmentBackend.Hubs;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
using System;
using System.Threading.Tasks;

namespace RecruitmentBackend.Services
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(AppDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public async Task CreateNotificationAsync(string accountId, string title, string content, string? redirectUrl)
        {
            var notification = new Notification
            {
                AccountID = accountId,
                Title = title,
                Content = content,
                RedirectUrl = redirectUrl,
                IsRead = false,
                CreatedAt = DateTime.Now
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Push notification in real-time to the SignalR group representing this user's accountId
            await _hubContext.Clients.Group(accountId).SendAsync("ReceiveNotification", new
            {
                id = notification.NotificationID,
                title = notification.Title,
                content = notification.Content,
                redirectUrl = notification.RedirectUrl,
                isRead = notification.IsRead,
                createdAt = notification.CreatedAt
            });
        }
    }
}
