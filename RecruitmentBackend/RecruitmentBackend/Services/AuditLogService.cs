using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;

namespace RecruitmentBackend.Services
{
    public class AuditLogService : IAuditLogService
    {
        private readonly AppDbContext _context;

        public AuditLogService(AppDbContext context)
        {
            _context = context;
        }

        public async Task WriteLogAsync(string userEmail, string action, string target, string? ipAddress)
        {
            try
            {
                var log = new AuditLog
                {
                    UserEmail = userEmail,
                    Action = action,
                    Target = target,
                    IPAddress = ipAddress ?? "Unknown",
                    CreatedAt = DateTime.Now
                };

                _context.AuditLogs.Add(log);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Ghi nhận lỗi ra console để không làm gián đoạn luồng chính của người dùng
                Console.WriteLine($"[AuditLog Error]: {ex.Message}");
            }
        }

        public async Task<List<AuditLog>> GetAllLogsAsync()
        {
            return await _context.AuditLogs
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();
        }
    }
}
