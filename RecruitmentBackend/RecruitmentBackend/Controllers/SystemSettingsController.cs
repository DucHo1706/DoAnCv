using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    public class SystemSettingsModel
    {
        public int MinFitScoreThreshold { get; set; } = 70;
        public int OcrErrorNoticeThreshold { get; set; } = 15;
        public int JobDefaultDurationDays { get; set; } = 30;
        public bool AutoApproveRecruiters { get; set; } = false;
        public bool SystemMaintenanceMode { get; set; } = false;
    }

    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class SystemSettingsController : ControllerBase
    {
        private static readonly string SettingsFilePath = Path.Combine(Directory.GetCurrentDirectory(), "system_settings.json");
        private static SystemSettingsModel _currentSettings = LoadSettingsFromFile();

        private static SystemSettingsModel LoadSettingsFromFile()
        {
            try
            {
                if (System.IO.File.Exists(SettingsFilePath))
                {
                    string json = System.IO.File.ReadAllText(SettingsFilePath);
                    var settings = JsonSerializer.Deserialize<SystemSettingsModel>(json);
                    if (settings != null) return settings;
                }
            }
            catch
            {
                // Fallback to default
            }

            return new SystemSettingsModel();
        }

        private static void SaveSettingsToFile(SystemSettingsModel settings)
        {
            try
            {
                string json = JsonSerializer.Serialize(settings, new JsonSerializerOptions { WriteIndented = true });
                System.IO.File.WriteAllText(SettingsFilePath, json);
            }
            catch
            {
                // Ignore write errors
            }
        }

        [HttpGet]
        public IActionResult GetSettings()
        {
            return Ok(_currentSettings);
        }

        [HttpPut]
        [Authorize(Roles = "Admin")]
        public IActionResult UpdateSettings([FromBody] SystemSettingsModel request)
        {
            if (request == null) return BadRequest("Dữ liệu cài đặt không hợp lệ.");

            if (request.MinFitScoreThreshold < 0 || request.MinFitScoreThreshold > 100)
            {
                return BadRequest("Ngưỡng điểm phù hợp phải từ 0 đến 100%.");
            }

            if (request.OcrErrorNoticeThreshold < 0 || request.OcrErrorNoticeThreshold > 100)
            {
                return BadRequest("Ngưỡng tỷ lệ lỗi OCR phải từ 0 đến 100%.");
            }

            if (request.JobDefaultDurationDays < 1 || request.JobDefaultDurationDays > 365)
            {
                return BadRequest("Thời hạn tin mặc định phải từ 1 đến 365 ngày.");
            }

            _currentSettings = request;
            SaveSettingsToFile(_currentSettings);

            return Ok(new { message = "Lưu cài đặt hệ thống thành công!", settings = _currentSettings });
        }
    }
}
