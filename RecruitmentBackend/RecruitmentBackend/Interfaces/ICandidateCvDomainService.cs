using System.Threading;
using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface ICandidateCvDomainService
    {
        Task<int> InferAndPersistAsync(CancellationToken cancellationToken = default);
    }
}
