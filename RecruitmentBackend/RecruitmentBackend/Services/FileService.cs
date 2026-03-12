using RecruitmentBackend.Interfaces;

namespace RecruitmentBackend.Services
{
    public class FileService : IFileService
    {
        private readonly IWebHostEnvironment _env;

        public FileService(IWebHostEnvironment env)
        {
            _env = env;
        }

        public async Task<string> SaveFileAsync(IFormFile file)
        {
            var contentPath = _env.ContentRootPath;
            var path = Path.Combine(contentPath, "Uploads");

            if (!Directory.Exists(path)) Directory.CreateDirectory(path);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var fullPath = Path.Combine(path, fileName);

            using var stream = new FileStream(fullPath, FileMode.Create);
            await file.CopyToAsync(stream);

            return fileName; // Trả về tên file để lưu vào DB
        }

        public void DeleteFile(string fileName)
        {
            var path = Path.Combine(_env.ContentRootPath, "Uploads", fileName);
            if (File.Exists(path)) File.Delete(path);
        }
    }
}
