using System.Net.Http.Json;
using System.Text.Json;
using System.Net;
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
        private readonly bool _enableAiEmailDraft;

        public CandidateEmailAiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            string apiBase = configuration["PythonAiApiUrl"] ?? "http://127.0.0.1:8000";
            if (!apiBase.EndsWith("/")) apiBase += "/";
            _generateEmailUrl = apiBase + "generate-email";
            _enableAiEmailDraft = configuration.GetValue<bool>("EnableAiEmailDraft");
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

            if (!_enableAiEmailDraft)
            {
                GenerateCandidateEmailResponse template = BuildEditableTemplate(request, emailType);
                template.Source = "template";
                return (true, "Đã tạo mẫu email chỉnh sửa được (AI đang tắt).", template);
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
                    Body = pythonResponse.Body ?? string.Empty,
                    Source = "ai"
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

        private static GenerateCandidateEmailResponse BuildEditableTemplate(
            GenerateCandidateEmailRequest request,
            string emailType)
        {
            string rawCandidateName = request.CandidateName.Trim();
            string rawJobTitle = request.JobTitle.Trim();
            string rawCompanyName = string.IsNullOrWhiteSpace(request.CompanyName)
                ? "AI Recruitment"
                : request.CompanyName.Trim();
            string candidateName = WebUtility.HtmlEncode(rawCandidateName);
            string jobTitle = WebUtility.HtmlEncode(rawJobTitle);
            string companyName = WebUtility.HtmlEncode(rawCompanyName);
            bool isTalentPoolInvite = emailType == "invite" &&
                (request.EmailContext ?? string.Empty).Contains("talent pool", StringComparison.OrdinalIgnoreCase);

            if (emailType == "reject")
            {
                string reason = WebUtility.HtmlEncode(request.RejectReason?.Trim() ?? string.Empty);
                return new GenerateCandidateEmailResponse
                {
                    Subject = $"[{rawCompanyName}] Kết quả ứng tuyển vị trí {rawJobTitle}",
                    Body = $"""
                        <p>Chào {candidateName},</p>
                        <p>Cảm ơn bạn đã quan tâm và ứng tuyển vào vị trí <strong>{jobTitle}</strong>.</p>
                        <p>Sau khi xem xét hồ sơ, chúng tôi rất tiếc chưa thể tiếp tục đồng hành cùng bạn trong đợt tuyển dụng này. Lý do: {reason}.</p>
                        <p>Chúng tôi trân trọng sự quan tâm của bạn và sẽ lưu hồ sơ để xem xét cho các cơ hội phù hợp hơn trong tương lai.</p>
                        <p>Trân trọng,<br/>Phòng Nhân sự<br/>{companyName}</p>
                        """
                };
            }

            if (isTalentPoolInvite)
            {
                return new GenerateCandidateEmailResponse
                {
                    Subject = $"[{rawCompanyName}] Lời mời ứng tuyển vị trí {rawJobTitle}",
                    Body = $"""
                        <p>Chào {candidateName},</p>
                        <p>Phòng Nhân sự đang lưu hồ sơ của bạn trong Ngân hàng ứng viên. Hiện tại, chúng tôi có vị trí <strong>{jobTitle}</strong> đang mở và nhận thấy hồ sơ của bạn có thể phù hợp.</p>
                        <p>Nếu quan tâm, vui lòng phản hồi email này để chúng tôi trao đổi thêm về công việc và quy trình tuyển dụng.</p>
                        <p>Trân trọng,<br/>Phòng Nhân sự<br/>{companyName}</p>
                        """
                };
            }

            return new GenerateCandidateEmailResponse
            {
                Subject = $"[{rawCompanyName}] Thư mời phỏng vấn vị trí {rawJobTitle}",
                Body = $"""
                    <p>Chào {candidateName},</p>
                    <p>Cảm ơn bạn đã ứng tuyển vào vị trí <strong>{jobTitle}</strong>. Chúng tôi trân trọng mời bạn tham gia buổi phỏng vấn.</p>
                    <p><strong>Thông tin phỏng vấn dự kiến:</strong></p>
                    <ul>
                      <li><strong>Thời gian:</strong> [Điền thời gian]</li>
                      <li><strong>Hình thức:</strong> [Điền hình thức: trực tuyến/trực tiếp]</li>
                      <li><strong>Địa điểm:</strong> [Điền địa điểm/link họp]</li>
                    </ul>
                    <p>Vui lòng phản hồi email này để xác nhận tham gia.</p>
                    <p>Trân trọng,<br/>Phòng Nhân sự<br/>{companyName}</p>
                    """
            };
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
