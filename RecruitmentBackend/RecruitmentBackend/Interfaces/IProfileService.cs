using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface IProfileService
    {
        Task<object?> GetProfileAsync(ClaimsPrincipal user);
        Task<(bool Success, string Message)> UpdateProfileAsync(ClaimsPrincipal user, string fullName, string phone, DateTime? dob, string gender, string address);
        Task<(bool Success, string Message, string AvatarUrl)> UploadAvatarAsync(ClaimsPrincipal user, IFormFile file);
        Task<(bool Success, string Message, object? Data)> UploadDefaultCvAsync(ClaimsPrincipal user, IFormFile file);
        Task<(bool Success, string Message, object? Data)> SyncCvInfoAsync(ClaimsPrincipal user);
        Task<(bool Success, string Message)> UpdateSkillsAsync(ClaimsPrincipal user, List<string> skills);
        Task<(bool Success, string Message, object? Data)> UpdateRecruiterDiscoveryAsync(
            ClaimsPrincipal user,
            bool enabled,
            bool contactAllowed,
            bool cvAllowed,
            DateTime? expiresAt
        );
    }
}
