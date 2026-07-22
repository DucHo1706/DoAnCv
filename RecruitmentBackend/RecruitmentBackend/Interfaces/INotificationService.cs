using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface INotificationService
    {
        Task CreateNotificationAsync(string accountId, string title, string content, string? redirectUrl);
    }
}
