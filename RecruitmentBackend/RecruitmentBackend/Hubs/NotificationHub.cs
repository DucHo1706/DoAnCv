using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace RecruitmentBackend.Hubs
{
    public class NotificationHub : Hub
    {
        public async Task JoinGroup(string accountId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, accountId);
        }

        public async Task LeaveGroup(string accountId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, accountId);
        }
    }
}
