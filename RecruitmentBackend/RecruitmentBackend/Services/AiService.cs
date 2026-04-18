using Microsoft.AspNetCore.Http;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace RecruitmentBackend.Services
{
    public class AiService : IAiService
    {
        private readonly HttpClient _httpClient;

        public AiService(HttpClient httpClient)
        {
            // Cấu hình base URL trỏ tới FastAPI của Python
            _httpClient = httpClient;
            _httpClient.BaseAddress = new Uri("http://127.0.0.1:8000/");
        }

        public async Task<AiMatchingResponse> GetMatchingScoreAsync(IFormFile cvFile, string jobRequirements)
        {
            using var content = new MultipartFormDataContent();

            // 1. Đính kèm file PDF
            using var fileStream = cvFile.OpenReadStream();
            var fileContent = new StreamContent(fileStream);
            fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(cvFile.ContentType);
            content.Add(fileContent, "file", cvFile.FileName);

            // 2. Đính kèm Mô tả công việc (JD)
            content.Add(new StringContent(jobRequirements ?? ""), "job_description");

            // 3. Gửi Request sang Python AI
            var response = await _httpClient.PostAsync("score-cv", content);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync();
                throw new Exception($"Lỗi từ AI Service (Python): {response.StatusCode} - {errorText}");
            }

            // 4. Đọc kết quả JSON trả về
            var jsonResponse = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<AiMatchingResponse>(jsonResponse);

            return result;
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