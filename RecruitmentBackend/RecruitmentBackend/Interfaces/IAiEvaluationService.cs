using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface IAiEvaluationService
    {
        Task RunAiEvaluationInBackgroundAsync(string applicationId, byte[] cvFileBytes, string fileName, string contentType, string? structuredCvText = null);
    }
}
