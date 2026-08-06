using System.Net.Http.Json;
using System.Text.Json;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Interfaces;

using Microsoft.Extensions.Configuration;

namespace RecruitmentBackend.Services
{
    public class CandidateEmailAiService : ICandidateEmailAiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _generateEmailUrl;

        public CandidateEmailAiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            string apiBase = configuration["PythonAiApiUrl"] ?? "http://127.0.0.1:8000";
            if (!apiBase.EndsWith("/")) apiBase += "/";
            _generateEmailUrl = apiBase + "generate-email";
        }

        public async Task<(bool IsSuccess, string Message, GenerateCandidateEmailResponse? Data)> GenerateEmailAsync(
            GenerateCandidateEmailRequest request)
        {
            if (request == null)
            {
                return (false, "Dữ liệu yêu cầu AI soạn email không hợp lệ.", null);
            }

            if (string.IsNullOrWhiteSpace(request.EmailType))
            {
                return (false, "Loại email không được để trống.", null);
            }

            string emailType = request.EmailType.Trim().ToLower();

            if (emailType != "invite" && emailType != "reject")
            {
                return (false, "Loại email chỉ được là invite hoặc reject.", null);
            }

            if (string.IsNullOrWhiteSpace(request.CandidateName))
            {
                return (false, "Tên ứng viên không được để trống.", null);
            }

            if (string.IsNullOrWhiteSpace(request.JobTitle))
            {
                return (false, "Tên vị trí ứng tuyển không được để trống.", null);
            }

            if (emailType == "reject" && string.IsNullOrWhiteSpace(request.RejectReason))
            {
                return (false, "Vui lòng nhập lý do từ chối để AI soạn email phù hợp.", null);
            }

            object pythonRequest = new
            {
                email_type = emailType,
                candidate_name = request.CandidateName,
                job_title = request.JobTitle,
                company_name = string.IsNullOrWhiteSpace(request.CompanyName)
                    ? "AI Recruitment"
                    : request.CompanyName,
                fit_score = request.FitScore,
                classification = request.Classification ?? string.Empty,
                summary = request.Summary ?? string.Empty,
                matched_skills = request.MatchedSkills ?? new List<string>(),
                missing_skills = request.MissingSkills ?? new List<string>(),
                reject_reason = request.RejectReason,
                email_context = request.EmailContext ?? string.Empty
            };

            try
            {
                HttpResponseMessage httpResponse = await _httpClient.PostAsJsonAsync(
                    _generateEmailUrl,
                    pythonRequest);

                string responseContent = await httpResponse.Content.ReadAsStringAsync();

                if (httpResponse.IsSuccessStatusCode == false)
                {
                    return (false, "Python AI service trả về lỗi: " + responseContent, null);
                }

                PythonGenerateEmailResponse? pythonResponse =
                    JsonSerializer.Deserialize<PythonGenerateEmailResponse>(
                        responseContent,
                        new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });

                if (pythonResponse == null)
                {
                    return (false, "Không đọc được phản hồi từ Python AI service.", null);
                }

                if (pythonResponse.Status != "success")
                {
                    string errorMessage = pythonResponse.Message;

                    if (string.IsNullOrWhiteSpace(errorMessage))
                    {
                        errorMessage = "AI không thể tạo nội dung email.";
                    }

                    return (false, errorMessage, null);
                }

                GenerateCandidateEmailResponse result = new GenerateCandidateEmailResponse
                {
                    Subject = pythonResponse.Subject ?? string.Empty,
                    Body = pythonResponse.Body ?? string.Empty
                };

                if (string.IsNullOrWhiteSpace(result.Subject))
                {
                    result.Subject = "[AI Recruitment] Kết quả ứng tuyển vị trí " + request.JobTitle;
                }

                if (string.IsNullOrWhiteSpace(result.Body))
                {
                    return (false, "AI đã phản hồi nhưng nội dung email bị trống.", null);
                }

                return (true, "Đã tạo nội dung email thành công.", result);
            }
            catch (HttpRequestException)
            {
                return (false, "Không thể kết nối tới Python AI service. Vui lòng kiểm tra server Python đã chạy chưa.", null);
            }
            catch (Exception exception)
            {
                return (false, "Lỗi hệ thống khi gọi AI soạn email: " + exception.Message, null);
            }
        }

        private class PythonGenerateEmailResponse
        {
            public string Status { get; set; } = string.Empty;

            public string? Message { get; set; }

            public string? Subject { get; set; }

            public string? Body { get; set; }
        }
    }
}
