﻿using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace RecruitmentBackend.Interfaces
{
    public interface IFileService
    {
        Task<string> SaveFileAsync(IFormFile file);
        Task<bool> DeleteFileAsync(string publicId);
    }
}
