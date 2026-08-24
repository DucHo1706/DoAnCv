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
        private readonly ILogger<MetadataChangeNotifier> _logger;

        public MetadataChangeNotifier(
            IHubContext<NotificationHub> hubContext,
            ILogger<MetadataChangeNotifier> logger)
        {
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task NotifyAsync(string resource, string action)
        {
            try
            {
                await _hubContext.Clients.All.SendAsync("MetadataChanged", new
                {
                    resource,
                    action,
                    changedAt = DateTime.UtcNow
                });
            }
            catch (Exception exception)
            {
                // SignalR là kênh đồng bộ bổ sung; lỗi broadcast không được làm API nghiệp vụ
                // báo thất bại sau khi dữ liệu đã lưu thành công.
                _logger.LogWarning(
                    exception,
                    "Không phát được sự kiện realtime cho tài nguyên {Resource}, thao tác {Action}.",
                    resource,
                    action);
            }
        }
    }
}
