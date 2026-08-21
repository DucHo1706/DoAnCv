using Microsoft.AspNetCore.SignalR;
using RecruitmentBackend.Hubs;

namespace RecruitmentBackend.Services
{
    public interface IMetadataChangeNotifier
    {
        Task NotifyAsync(string resource, string action);
    }

    public class MetadataChangeNotifier : IMetadataChangeNotifier
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public MetadataChangeNotifier(IHubContext<NotificationHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public Task NotifyAsync(string resource, string action)
        {
            return _hubContext.Clients.All.SendAsync("MetadataChanged", new
            {
                resource,
                action,
                changedAt = DateTime.UtcNow
            });
        }
    }
}
