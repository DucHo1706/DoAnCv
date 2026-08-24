using System.Threading;
using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface ISkillDiscoveryService
    {
        Task<int> CollectAsync(CancellationToken cancellationToken = default);
    }
}
