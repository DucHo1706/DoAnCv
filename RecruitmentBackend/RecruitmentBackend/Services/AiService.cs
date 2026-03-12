using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Interfaces;

namespace RecruitmentBackend.Services
{
    public class AiService : IAiService
    {
        private readonly HttpClient _httpClient;

        public AiService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _httpClient.BaseAddress = new Uri("http://127.0.0.1:8000/");
        }

        public async Task<AiServiceResponseDto> GetMatchingScoreAsync(IFormFile file, string jobDescription)
        {
            using var content = new MultipartFormDataContent();

            // 1. Đóng gói file CV
            var fileStream = file.OpenReadStream();
            var fileContent = new StreamContent(fileStream);
            fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
            content.Add(fileContent, "file", file.FileName);

            // 2. Đóng gói JD
            content.Add(new StringContent(jobDescription), "job_description");

            // 3. Gọi sang Python
            var response = await _httpClient.PostAsync("score-cv", content);

            if (!response.IsSuccessStatusCode)
                throw new Exception("AI Service đang bận hoặc có lỗi.");

            var jsonResponse = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<AiServiceResponseDto>(jsonResponse);
        }
        public async Task<bool> SyncSkillsToAiAsync(List<string> skills)
        {
            var payload = new { skills = skills };
            var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("update-skills", jsonContent);
            return response.IsSuccessStatusCode;
        }
    }
}