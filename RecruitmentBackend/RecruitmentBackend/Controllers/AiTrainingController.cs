using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AiTrainingController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AiTrainingController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("export-cv-data")]
        public async Task<IActionResult> ExportCvData()
        {
            // Tạm thời bỏ điều kiện lọc "[]" để bạn có thể xuất được toàn bộ CV ra file phục vụ demo đồ án
            var cvs = await _context.CandidateCVs
                .Where(cv => !string.IsNullOrEmpty(cv.RawText))
                .Select(cv => new 
                {
                    InputText = cv.RawText,
                    OutputSkills = string.IsNullOrEmpty(cv.CVExtractedSkills) ? "[]" : cv.CVExtractedSkills
                })
                .ToListAsync();

            var sb = new StringBuilder();
            foreach (var cv in cvs)
            {
                var jsonLine = new
                {
                    messages = new[]
                    {
                        new { role = "system", content = "Bạn là chuyên gia bóc tách dữ liệu nhân sự. Hãy trích xuất danh sách các kỹ năng chuyên môn từ văn bản CV sau. Chỉ trả về một mảng JSON các chuỗi." },
                        new { role = "user", content = cv.InputText },
                        new { role = "model", content = cv.OutputSkills } // Dữ liệu đáp án chuẩn để AI học
                    }
                };
                
                sb.AppendLine(JsonSerializer.Serialize(jsonLine, new JsonSerializerOptions 
                { 
                    Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping 
                }));
            }

            var fileBytes = Encoding.UTF8.GetBytes(sb.ToString());
            return File(fileBytes, "application/jsonl", "cv_training_data.jsonl");
        }
    }
}