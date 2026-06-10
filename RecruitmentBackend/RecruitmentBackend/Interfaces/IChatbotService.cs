using System.Threading.Tasks;
using RecruitmentBackend.DTOs.Requests;

namespace RecruitmentBackend.Interfaces
{
    public interface IChatbotService
    {
        Task<(string Reply, string ExtractedText)> GetChatResponseAsync(ChatRequest request);
    }
}