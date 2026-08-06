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

        public AiService(HttpClient httpClient, Microsoft.Extensions.Configuration.IConfiguration configuration)
        {
            _httpClient = httpClient;
            string apiBase = configuration["PythonAiApiUrl"] ?? "http://127.0.0.1:8000";
            if (!apiBase.EndsWith("/")) apiBase += "/";
            _httpClient.BaseAddress = new Uri(apiBase);
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

        public async Task<(bool IsValid, string Message)> ValidateCvAsync(byte[] fileBytes, string fileName, string contentType)
        {
            using var content = new MultipartFormDataContent();
            using var fileContent = new ByteArrayContent(fileBytes);
            if (!string.IsNullOrWhiteSpace(contentType))
            {
                fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
            }
            content.Add(fileContent, "file", fileName);

            using var response = await _httpClient.PostAsync("validate-cv", content);
            var responseBody = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException($"Dịch vụ kiểm tra CV trả về {response.StatusCode}.");
            }

            using var document = JsonDocument.Parse(responseBody);
            var root = document.RootElement;
            var isValid = root.TryGetProperty("is_valid", out var validElement) && validElement.GetBoolean();
            var message = root.TryGetProperty("message", out var messageElement)
                ? messageElement.GetString() ?? "Không thể xác minh nội dung CV."
                : "Không thể xác minh nội dung CV.";
            return (isValid, message);
        }

        public async Task<bool> SyncSkillsToAiAsync(List<string> skills)
        {
            try
            {
                var payload = new { skills = skills };
                var jsonContent = new StringContent(
                    JsonSerializer.Serialize(payload, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }),
                    Encoding.UTF8,
                    "application/json");

                var response = await _httpClient.PostAsync("update-skills", jsonContent);

                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> TrainAprioriAsync(List<List<string>> transactions)
        {
            try
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
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[AiService] TrainApriori error: {ex.Message}");
                return false;
            }
        }

        public async Task<List<string>> RecommendSkillsAsync(List<string> currentSkills, int topN = 5)
        {
            try
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
            catch
            {
                return new List<string>();
            }
        }

        public async Task<string> GetAssociationRulesJsonAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("association-rules");
                if (response.IsSuccessStatusCode == false)
                {
                    return "{\"rules\":[]}";
                }

                return await response.Content.ReadAsStringAsync();
            }
            catch
            {
                return "{\"rules\":[]}";
            }
        }

        public async Task<bool> TrainHuimAsync(object payload)
        {
            try
            {
                var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync("train-huim", jsonContent);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[AiService] TrainHuim error: {ex.Message}");
                return false;
            }
        }

        public async Task<string> RecommendHighUtilitySkillsAsync(List<string> currentSkills, int topN = 5)
        {
            try
            {
                var payload = new
                {
                    current_skills = currentSkills,
                    top_n = topN
                };
                var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync("recommend-high-utility-skills", jsonContent);
                if (response.IsSuccessStatusCode == false)
                {
                    return "{\"recommended_skills\":[]}";
                }
                return await response.Content.ReadAsStringAsync();
            }
            catch
            {
                return "{\"recommended_skills\":[]}";
            }
        }

        public async Task<string> GetHighUtilityItemsetsJsonAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("high-utility-itemsets");
                if (response.IsSuccessStatusCode == false)
                {
                    return "{\"itemsets\":[]}";
                }
                return await response.Content.ReadAsStringAsync();
            }
            catch
            {
                return "{\"itemsets\":[]}";
            }
        }

        public async Task<List<SemanticSearchResultItemDto>> SearchSemanticAsync(string query, List<DTOs.Requests.SemanticSearchJobItemDto> jobs)
        {
            try
            {
                var payload = new DTOs.Requests.SemanticSearchRequest
                {
                    Query = query,
                    Jobs = jobs
                };
                var jsonContent = new StringContent(
                    JsonSerializer.Serialize(payload, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }),
                    Encoding.UTF8,
                    "application/json");
                var response = await _httpClient.PostAsync("semantic-search", jsonContent);
                if (response.IsSuccessStatusCode == false)
                {
                    return new List<SemanticSearchResultItemDto>();
                }
                var jsonResponse = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<SemanticSearchResponse>(
                    jsonResponse,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );
                return result?.Results ?? new List<SemanticSearchResultItemDto>();
            }
            catch
            {
                return new List<SemanticSearchResultItemDto>();
            }
        }
    }
}
