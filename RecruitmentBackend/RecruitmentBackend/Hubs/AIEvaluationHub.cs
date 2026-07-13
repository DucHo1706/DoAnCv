using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace RecruitmentBackend.Hubs
{
    public class AIEvaluationHub : Hub
    {
        public async Task JoinApplicationGroup(string applicationId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, applicationId);
        }
    }
}
