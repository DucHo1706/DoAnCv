using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace RecruitmentBackend.Services
{
    public class HighUtilityService : IHighUtilityService
    {
        private readonly AppDbContext _context;
        private readonly IAiService _aiService;

        public HighUtilityService(AppDbContext context, IAiService aiService)
        {
            _context = context;
            _aiService = aiService;
        }

        public async Task<(bool IsSuccess, string Message, object Data)> TrainHighUtilityModelAsync(double minUtility)
        {
            try
            {
                // 1. Tính toán External Utilities (Lợi ích ngoài - Trọng số kỹ năng dựa trên lương trung bình của Job JD)
                var jobs = await _context.JobPostings
                    .Where(j => string.IsNullOrEmpty(j.JDExtractedSkills) == false)
                    .Select(j => new { j.JDExtractedSkills, j.SalaryMax })
                    .ToListAsync();

                var skillSalarySum = new Dictionary<string, decimal>();
                var skillSalaryCount = new Dictionary<string, int>();

                foreach (var j in jobs)
                {
                    try
                    {
                        var jdSkills = JsonSerializer.Deserialize<List<string>>(j.JDExtractedSkills);
                        if (jdSkills != null)
                        {
                            foreach (var s in jdSkills)
                            {
                                var sClean = s.ToLower().Trim();
                                if (string.IsNullOrEmpty(sClean)) continue;

                                decimal salary = j.SalaryMax > 0 ? j.SalaryMax : 15.0m; // Fallback lương cơ bản
                                if (skillSalarySum.ContainsKey(sClean))
                                {
                                    skillSalarySum[sClean] += salary;
                                    skillSalaryCount[sClean]++;
                                }
                                else
                                {
                                    skillSalarySum[sClean] = salary;
                                    skillSalaryCount[sClean] = 1;
                                }
                            }
                        }
                    }
                    catch { }
                }

                var externalUtilities = new Dictionary<string, double>();
                foreach (var key in skillSalarySum.Keys)
                {
                    double avgSalary = (double)(skillSalarySum[key] / skillSalaryCount[key]);
                    externalUtilities[key] = Math.Round(avgSalary, 2);
                }

                // 2. Tính toán Transactions & Quantities từ CV ứng viên
                var cvs = await _context.CandidateCVs
                    .Where(cv => string.IsNullOrEmpty(cv.CVExtractedSkills) == false)
                    .Select(cv => cv.CVExtractedSkills)
                    .ToListAsync();

                var transactions = new List<object>();

                foreach (var cvSkillsJson in cvs)
                {
                    try
                    {
                        var skills = JsonSerializer.Deserialize<List<string>>(cvSkillsJson);
                        if (skills != null && skills.Count > 0)
                        {
                            var items = new List<string>();
                            var quantities = new Dictionary<string, int>();

                            foreach (var s in skills)
                            {
                                var sClean = s.ToLower().Trim();
                                if (string.IsNullOrEmpty(sClean)) continue;

                                items.Add(sClean);
                                // Số lượng o(i, T) đại diện cho mức thành thạo (ví dụ từ độ dài của chữ để phân bổ 2-5 ngẫu nhiên nhưng ổn định)
                                int quantity = (sClean.Length % 4) + 2; 
                                quantities[sClean] = quantity;
                            }

                            transactions.Add(new
                            {
                                items = items,
                                quantities = quantities
                            });
                        }
                    }
                    catch { }
                }

                // 3. Fallback Mock Data: Nếu chưa có đủ dữ liệu giao dịch
                if (transactions.Count < 5)
                {
                    // Nạp bộ trọng số kỹ năng lợi nhuận cao giả lập (Đơn vị triệu VNĐ)
                    var mockWeights = new Dictionary<string, double>
                    {
                        { "machine learning", 55.0 },
                        { "deep learning", 65.0 },
                        { "python", 30.0 },
                        { "sql", 20.0 },
                        { "react", 28.0 },
                        { "javascript", 22.0 },
                        { "node.js", 26.0 },
                        { "c#", 32.0 },
                        { ".net", 30.0 },
                        { "sql server", 24.0 },
                        { "fastapi", 28.0 },
                        { "typescript", 25.0 },
                        { "entity framework", 24.0 }
                    };

                    foreach (var mw in mockWeights)
                    {
                        if (!externalUtilities.ContainsKey(mw.Key))
                        {
                            externalUtilities[mw.Key] = mw.Value;
                        }
                    }

                    // Nạp 10 CV giả lập kèm độ thành thạo kỹ năng
                    transactions.Add(new { items = new List<string> { "python", "sql", "machine learning" }, quantities = new Dictionary<string, int> { { "python", 4 }, { "sql", 3 }, { "machine learning", 5 } } });
                    transactions.Add(new { items = new List<string> { "python", "sql", "fastapi" }, quantities = new Dictionary<string, int> { { "python", 3 }, { "sql", 2 }, { "fastapi", 4 } } });
                    transactions.Add(new { items = new List<string> { "react", "node.js", "javascript" }, quantities = new Dictionary<string, int> { { "react", 5 }, { "node.js", 4 }, { "javascript", 4 } } });
                    transactions.Add(new { items = new List<string> { "react", "javascript", "typescript" }, quantities = new Dictionary<string, int> { { "react", 4 }, { "javascript", 3 }, { "typescript", 4 } } });
                    transactions.Add(new { items = new List<string> { "c#", ".net", "sql server" }, quantities = new Dictionary<string, int> { { "c#", 5 }, { ".net", 4 }, { "sql server", 3 } } });
                    transactions.Add(new { items = new List<string> { "c#", ".net", "entity framework" }, quantities = new Dictionary<string, int> { { "c#", 4 }, { ".net", 5 }, { "entity framework", 4 } } });
                    transactions.Add(new { items = new List<string> { "python", "machine learning", "deep learning" }, quantities = new Dictionary<string, int> { { "python", 5 }, { "machine learning", 5 }, { "deep learning", 4 } } });
                    transactions.Add(new { items = new List<string> { "react", "node.js", "javascript", "typescript" }, quantities = new Dictionary<string, int> { { "react", 4 }, { "node.js", 4 }, { "javascript", 5 }, { "typescript", 3 } } });
                    transactions.Add(new { items = new List<string> { "c#", ".net", "sql server", "entity framework" }, quantities = new Dictionary<string, int> { { "c#", 5 }, { ".net", 4 }, { "sql server", 4 }, { "entity framework", 5 } } });
                    transactions.Add(new { items = new List<string> { "python", "sql", "fastapi", "machine learning" }, quantities = new Dictionary<string, int> { { "python", 4 }, { "sql", 3 }, { "fastapi", 3 }, { "machine learning", 4 } } });
                }

                var payload = new
                {
                    transactions = transactions,
                    external_utilities = externalUtilities,
                    min_utility = minUtility
                };

                // 4. Gọi Python FastAPI để huấn luyện mô hình HUIM
                var isSuccess = await _aiService.TrainHuimAsync(payload);
                if (isSuccess == false)
                {
                    return (false, "Lỗi từ dịch vụ Python khi khai phá High-Utility Itemsets.", null);
                }

                return (true, $"Khai phá High-Utility thành công với {transactions.Count} tập dữ liệu CV.", null);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi hệ thống: " + ex.Message, null);
            }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> GetHighUtilityItemsetsAsync()
        {
            try
            {
                var itemsetsJson = await _aiService.GetHighUtilityItemsetsJsonAsync();
                using var doc = JsonDocument.Parse(itemsetsJson);
                var root = doc.RootElement;
                if (root.TryGetProperty("itemsets", out var itemsetsProp))
                {
                    return (true, "Lấy danh sách tập kỹ năng lợi ích cao thành công.", itemsetsProp.Clone());
                }
                return (false, "Dịch vụ AI trả về dữ liệu không đúng định dạng.", null);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi lấy danh sách HUIM: " + ex.Message, null);
            }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> RecommendSkillsAsync(List<string> currentSkills, int topN)
        {
            try
            {
                if (currentSkills == null || currentSkills.Count == 0)
                {
                    return (true, "Danh sách kỹ năng đầu vào trống.", new List<object>());
                }

                var recsJson = await _aiService.RecommendHighUtilitySkillsAsync(currentSkills, topN);
                using var doc = JsonDocument.Parse(recsJson);
                var root = doc.RootElement;
                if (root.TryGetProperty("recommended_skills", out var recommendedProp))
                {
                    return (true, "Đề xuất kỹ năng lợi ích cao thành công.", recommendedProp.Clone());
                }
                return (false, "Dịch vụ AI trả về dữ liệu gợi ý không đúng định dạng.", null);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi gợi ý kỹ năng HUIM: " + ex.Message, null);
            }
        }
    }
}
