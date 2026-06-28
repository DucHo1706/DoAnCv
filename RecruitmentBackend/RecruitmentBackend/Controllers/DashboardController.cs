using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecruitmentBackend.Interfaces;
using System.Security.Claims;
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

        [HttpGet("admin-stats")]
        public async Task<IActionResult> GetAdminDashboardStats(
            [FromQuery] string? categoryId,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            var result = await _dashboardService.GetAdminDashboardStatsAsync(categoryId, fromDate, toDate);
            return Ok(result);
        }

        [HttpGet("hr-stats")]
        [Authorize]
        public async Task<IActionResult> GetHrDashboardStats([FromQuery] string? jobId, [FromQuery] string? timeRange)
        {
            var accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrWhiteSpace(accountId) == true)
            {
                return Unauthorized(new
                {
                    isSuccess = false,
                    message = "Không xác định được tài khoản HR đang đăng nhập."
                });
            }

            var result = await _dashboardService.GetHrDashboardStatsAsync(accountId, jobId, timeRange);
            return Ok(result);
        }
    }
}