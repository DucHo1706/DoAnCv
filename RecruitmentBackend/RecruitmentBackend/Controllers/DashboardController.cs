using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecruitmentBackend.Interfaces;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("stats")]
        // [Authorize(Roles = "Admin")] // Mở comment này khi đã test xong
        public async Task<IActionResult> GetDashboardStats([FromQuery] string? jobId, [FromQuery] string? timeRange)
        {
            var result = await _dashboardService.GetAdminDashboardStatsAsync(jobId, timeRange);
            return Ok(result);
        }
        [HttpGet("hr-stats")]
        [Authorize] // Bắt buộc HR phải đăng nhập
        public async Task<IActionResult> GetHrDashboardStats([FromQuery] string? jobId, [FromQuery] string? timeRange)
        {
            var accountId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var result = await _dashboardService.GetHrDashboardStatsAsync(accountId, jobId, timeRange);
            return Ok(result);
        }

    }
}
