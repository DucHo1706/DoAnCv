using System.Threading.Tasks;
using System.Collections.Generic;
using RecruitmentBackend.Models;

namespace RecruitmentBackend.Interfaces
{
    public interface IAuditLogService
    {
        Task WriteLogAsync(string userEmail, string action, string target, string? ipAddress);
        Task<List<AuditLog>> GetAllLogsAsync();
    }
}
