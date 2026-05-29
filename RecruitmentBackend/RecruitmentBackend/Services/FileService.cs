using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using RecruitmentBackend.Interfaces;
using System;
using System.IO;
using System.Threading.Tasks;

namespace RecruitmentBackend.Services
{
    public class FileService : IFileService
    {
        private readonly Cloudinary _cloudinary;

        public FileService(IConfiguration config)
        {
            var account = new Account(
                config["Cloudinary:CloudName"],
                config["Cloudinary:ApiKey"],
                config["Cloudinary:ApiSecret"]
            );

            _cloudinary = new Cloudinary(account);
        }

        public async Task<string> SaveFileAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return null;
            }

            string fileExtension = Path.GetExtension(file.FileName).ToLower();
            string fileNameWithoutExtension = Path.GetFileNameWithoutExtension(file.FileName);
            string publicId = $"{Guid.NewGuid()}_{fileNameWithoutExtension}";

            using var stream = file.OpenReadStream();

            if (fileExtension == ".png" || fileExtension == ".jpg" || fileExtension == ".jpeg")
            {
                var imageUploadParams = new ImageUploadParams()
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "cv_uploads",
                    PublicId = publicId,
                    Type = "upload"
                };

                var imageUploadResult = await _cloudinary.UploadAsync(imageUploadParams);

                if (imageUploadResult.Error != null)
                {
                    throw new Exception($"Lỗi upload Cloudinary: {imageUploadResult.Error.Message}");
                }

                return imageUploadResult.SecureUrl?.ToString();
            }

            var rawUploadParams = new RawUploadParams()
            {
                File = new FileDescription(file.FileName, stream),
                Folder = "cv_uploads",
                PublicId = publicId,
                Type = "upload"
            };

            var rawUploadResult = await _cloudinary.UploadAsync(rawUploadParams);

            if (rawUploadResult.Error != null)
            {
                throw new Exception($"Lỗi upload Cloudinary: {rawUploadResult.Error.Message}");
            }

            return rawUploadResult.SecureUrl?.ToString();
        }

        public async Task<bool> DeleteFileAsync(string publicId)
        {
            var deletionParams = new DeletionParams(publicId)
            {
                ResourceType = ResourceType.Raw
            };

            var result = await _cloudinary.DestroyAsync(deletionParams);

            return result.Result == "ok";
        }
    }
}