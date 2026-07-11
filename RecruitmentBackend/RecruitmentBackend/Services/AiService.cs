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

        public async Task<bool> TrainAprioriAsync(List<List<string>> transactions)
        {
            var payload = new 
            { 
                transactions = transactions,
                min_support = 0.05,
                min_confidence = 0.3
            };
            var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("train-apriori", jsonContent);
            return response.IsSuccessStatusCode;
        }

        public async Task<List<string>> RecommendSkillsAsync(List<string> currentSkills, int topN = 5)
        {
            var payload = new 
            { 
                current_skills = currentSkills,
                top_n = topN
            };
            var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("recommend-skills", jsonContent);
            if (response.IsSuccessStatusCode == false)
            {
                return new List<string>();
            }

            var jsonResponse = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(jsonResponse);
            var root = doc.RootElement;
            if (root.TryGetProperty("recommended_skills", out var recommendedProp) && recommendedProp.ValueKind == JsonValueKind.Array)
            {
                var result = new List<string>();
                foreach (var item in recommendedProp.EnumerateArray())
                {
                    result.Add(item.GetString());
                }
                return result;
            }

            return new List<string>();
        }

        public async Task<string> GetAssociationRulesJsonAsync()
        {
            var response = await _httpClient.GetAsync("association-rules");
            if (response.IsSuccessStatusCode == false)
            {
                return "{\"rules\":[]}";
            }

            return await response.Content.ReadAsStringAsync();
        }
    }
}