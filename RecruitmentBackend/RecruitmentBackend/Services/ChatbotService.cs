using Microsoft.Extensions.Configuration;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace RecruitmentBackend.Services
{
    public class ChatbotService : IChatbotService
    {
        private readonly HttpClient _httpClient;
        private readonly string _pythonApiUrl;
        private readonly AppDbContext _context;

        public ChatbotService(HttpClient httpClient, IConfiguration configuration, AppDbContext context)
        {
            _httpClient = httpClient;
            _pythonApiUrl = configuration["PythonAiApiUrl"] ?? "http://127.0.0.1:8000";
            _context = context;
        }

        public async Task<(string Reply, string ExtractedText)> GetChatResponseAsync(ChatRequest request)
        {
            string url = $"{_pythonApiUrl}/chat";
            
            using var content = new MultipartFormDataContent();
            content.Add(new StringContent(request.Prompt ?? ""), "prompt");
            content.Add(new StringContent(request.HistoryJson ?? "[]"), "history");

            // Nếu có JobId, truy vấn DB lấy thông tin JD để gửi cho AI
            string jobDescriptionForAi = "";
            if (!string.IsNullOrEmpty(request.JobId))
            {
                var job = await _context.JobPostings.FindAsync(request.JobId);
                if (job != null)
                {
                    jobDescriptionForAi = $"Mô tả công việc:\n{job.JobDescription}\n\nYêu cầu:\n{job.JobRequirement}";
                }
            }
            content.Add(new StringContent(jobDescriptionForAi), "job_description");

            // TÍCH HỢP DỮ LIỆU TỪ DATABASE VÀO AI
            // Lấy tự động tối đa 10 công việc đang tuyển dụng trên hệ thống
            DateTime todayVietnam = JobLifecyclePolicy.TodayVietnam;
            var publishedJobs = await (from j in _context.JobPostings
                                       join p in _context.Positions on j.PositionID equals p.PositionID into pj
                                       from p in pj.DefaultIfEmpty()
                                       join b in _context.Branches on j.BranchID equals b.BranchID into bj
                                       from b in bj.DefaultIfEmpty()
                                       where j.Status == "Published"
                                             && (!j.StartDate.HasValue || j.StartDate.Value.Date <= todayVietnam)
                                             && j.Deadline.Date >= todayVietnam
                                       orderby j.CreatedAt descending
                                       select new
                                       {
                                           j.JobID,
                                           PositionName = p != null ? p.PositionName : "Vị trí IT",
                                           BranchName = b != null ? b.BranchName : "Chưa cập nhật",
                                           j.JobRequirement,
                                           j.SalaryMin,
                                           j.SalaryMax
                                       }).Take(10).ToListAsync();

            string salaryInfo = "Hệ thống hiện tại chưa có đủ dữ liệu lương để thống kê.";
            string jobRecommendations = "Hiện hệ thống chưa có tin tuyển dụng nào mới.";

            if (publishedJobs.Any())
            {
                var jobsWithSalary = publishedJobs.Where(j => j.SalaryMin > 0 || j.SalaryMax > 0).ToList();
                if (jobsWithSalary.Any())
                {
                    var minSal = jobsWithSalary.Min(j => j.SalaryMin);
                    var maxSal = jobsWithSalary.Max(j => j.SalaryMax > 0 ? j.SalaryMax : j.SalaryMin);

                    var examples = new StringBuilder();
                    foreach (var j in jobsWithSalary.Take(3)) // Trích xuất 3 công việc làm dẫn chứng cụ thể
                    {
                        string sal = j.SalaryMax == 0 ? $"{j.SalaryMin} triệu" : $"{j.SalaryMin} - {j.SalaryMax} triệu";
                        examples.AppendLine($"- {j.PositionName}: {sal} VNĐ");
                    }

                    salaryInfo = $@"
Dữ liệu lương thực tế từ các công việc ĐANG TUYỂN trên hệ thống AI Recruitment: Dao động từ {minSal} triệu đến {maxSal} triệu VNĐ/tháng.
Dẫn chứng cụ thể một số vị trí đang đăng tuyển:
{examples.ToString().Trim()}
**CHỈ THỊ VỀ LƯƠNG**: Khi người dùng hỏi về mức lương, hãy đưa ra khoảng lương trên và trích dẫn các ví dụ từ hệ thống. SAU ĐÓ, bạn BẮT BUỘC phải phân tích và khái quát thêm về mức lương thị trường bên ngoài hệ thống (VD: Fresher/Junior/Senior bên ngoài thị trường thường nhận mức lương bao nhiêu) để câu trả lời sâu sắc và khách quan hơn.";
                }

                var jobList = new StringBuilder();
                foreach (var j in publishedJobs)
                {
                    string sal = (j.SalaryMin == 0 && j.SalaryMax == 0) ? "Thỏa thuận" : (j.SalaryMax == 0 ? $"{j.SalaryMin} triệu" : $"{j.SalaryMin} - {j.SalaryMax} triệu");
                    // Rút gọn requirement để tránh quá tải Token của AI
                    string req = j.JobRequirement?.Length > 150 ? j.JobRequirement.Substring(0, 150) + "..." : j.JobRequirement;
                    jobList.AppendLine($"- ID: {j.JobID} | Vị trí: {j.PositionName} | Khu vực: {j.BranchName} | Lương: {sal} | Yêu cầu: {req}");
                }

                jobRecommendations = $@"
DANH SÁCH CÁC CÔNG VIỆC ĐANG TUYỂN DỤNG TRÊN HỆ THỐNG:
{jobList.ToString().Trim()}

**CHỈ THỊ GỢI Ý VIỆC LÀM**: 
Nếu người dùng hỏi 'Có việc làm nào phù hợp không', 'Gợi ý việc làm', 'Tìm việc', hoặc nếu bạn thấy kỹ năng trong CV của họ khớp với công việc nào trong danh sách trên:
1. Hãy chọn ra 1-2 công việc phù hợp nhất để giới thiệu.
2. Nêu rõ lý do tại sao họ phù hợp.
3. BẮT BUỘC chèn đoạn mã thẻ đặc biệt sau vào cuối câu trả lời ứng với mỗi công việc được giới thiệu để hệ thống hiển thị thẻ công việc trực quan cho người dùng click xem chi tiết và ứng tuyển:
[RECOMMEND_JOB: <ID> | <Vị trí> | <Khu vực> | <Lương>]
(Ví dụ: [RECOMMEND_JOB: {publishedJobs.FirstOrDefault()?.JobID ?? "job_example"} | {publishedJobs.FirstOrDefault()?.PositionName ?? "Senior Developer"} | {publishedJobs.FirstOrDefault()?.BranchName ?? "Quận 1, TP.HCM"} | {((publishedJobs.FirstOrDefault()?.SalaryMax ?? 0) == 0 ? "Thỏa thuận" : publishedJobs.FirstOrDefault()?.SalaryMin + " - " + publishedJobs.FirstOrDefault()?.SalaryMax + " triệu")}])";
            }

            string systemKnowledge = $@"
Thông tin hệ thống AI Recruitment: Chúng tôi hỗ trợ ứng viên nộp CV và AI sẽ chấm điểm hồ sơ.
Địa chỉ: Khu Công Nghệ Cao, TP.HCM.
{salaryInfo}

{jobRecommendations}";
            content.Add(new StringContent(systemKnowledge), "system_knowledge");

            // Nếu người dùng có đính kèm file, Forward sang Python luôn
            if (request.File != null && request.File.Length > 0)
            {
                var fileStream = request.File.OpenReadStream();
                var fileContent = new StreamContent(fileStream);
                if (!string.IsNullOrWhiteSpace(request.File.ContentType))
                {
                    fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(request.File.ContentType);
                }
                content.Add(fileContent, "file", request.File.FileName);
            }

            try
            {
                var response = await _httpClient.PostAsync(url, content);
                response.EnsureSuccessStatusCode();

                var responseString = await response.Content.ReadAsStringAsync();
                using var jsonDocument = JsonDocument.Parse(responseString);
                
                var root = jsonDocument.RootElement;
                if (root.TryGetProperty("status", out var status) && status.GetString() == "success")
                {
                    string reply = root.GetProperty("reply").GetString() ?? "Lỗi: Không có nội dung trả lời.";
                    string extractedText = root.TryGetProperty("extracted_text", out var ext) ? ext.GetString() : "";
                    return (reply, extractedText);
                }
                
                return ("Lỗi từ máy chủ AI: " + (root.TryGetProperty("message", out var msg) ? msg.GetString() : "Unknown"), "");
            }
            catch (Exception ex)
            {
                return ("Lỗi kết nối tới máy chủ Python AI: " + ex.Message, "");
            }
        }
    }
}
