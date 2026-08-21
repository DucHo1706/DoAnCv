using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Threading.Tasks;

namespace RecruitmentBackend.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        public async Task JoinGroup(string accountId)
        {
            string? currentAccountId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(currentAccountId) || !string.Equals(currentAccountId, accountId, StringComparison.Ordinal))
            {
                throw new HubException("Không có quyền tham gia kênh thông báo này.");
            }
            await Groups.AddToGroupAsync(Context.ConnectionId, accountId);
        }

        public async Task LeaveGroup(string accountId)
        {
            string? currentAccountId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.Equals(currentAccountId, accountId, StringComparison.Ordinal))
            {
                throw new HubException("Không có quyền rời kênh thông báo này.");
            }
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, accountId);
        }
    }
}
