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

        public async Task<AiMatchingResponse> GetMatchingScoreAsync(IFormFile cvFile, string jobDescription, string criteriaJson)
        {
            using var content = new MultipartFormDataContent();

            using var fileStream = cvFile.OpenReadStream();
            var fileContent = new StreamContent(fileStream);

            if (string.IsNullOrWhiteSpace(cvFile.ContentType) == false)
            {
                fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(cvFile.ContentType);
            }

            // 1. Đính kèm file CV
            content.Add(fileContent, "file", cvFile.FileName);

            // 2. Đính kèm mô tả công việc
            content.Add(new StringContent(jobDescription ?? ""), "job_description");

            // 3. Đính kèm danh sách tiêu chí chấm điểm và trọng số
            content.Add(new StringContent(criteriaJson ?? "[]"), "criteria");

            var response = await _httpClient.PostAsync("score-cv", content);

            var jsonResponse = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode == false)
            {
                throw new Exception("Lỗi từ AI Service Python: " + response.StatusCode + " - " + jsonResponse);
            }

            var result = JsonSerializer.Deserialize<AiMatchingResponse>(
                jsonResponse,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }
            );

            if (result == null)
            {
                throw new Exception("AI Service không trả về dữ liệu hợp lệ.");
            }

            if (result.Status != "success")
            {
                string errorMessage = result.Message;

                if (string.IsNullOrWhiteSpace(errorMessage) == true)
                {
                    errorMessage = "AI Service xử lý thất bại.";
                }

                throw new Exception(errorMessage);
            }

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