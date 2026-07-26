using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RecruitmentBackend.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Candidate")]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _profileService;

        public ProfileController(IProfileService profileService)
        {
            _profileService = profileService;
        }

        public class UpdateProfileRequest
        {
            public string FullName { get; set; }
            public string Phone { get; set; }
            public DateTime? DOB { get; set; }
            public string Gender { get; set; }
            public string Address { get; set; }
        }

        public class UpdateSkillsRequest
        {
            public List<string> Skills { get; set; }
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var profile = await _profileService.GetProfileAsync(User);
            if (profile == null) return Unauthorized("Không xác định được tài khoản ứng viên.");
            return Ok(profile);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var result = await _profileService.UpdateProfileAsync(User, request.FullName, request.Phone, request.DOB, request.Gender, request.Address);
            if (!result.Success) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("Vui lòng tải lên file ảnh.");
            var result = await _profileService.UploadAvatarAsync(User, file);
            if (!result.Success) return BadRequest(new { message = result.Message });
            return Ok(new { avatarUrl = result.AvatarUrl, message = result.Message });
        }

        [HttpPost("cv")]
        public async Task<IActionResult> UploadDefaultCv(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("Vui lòng tải lên file CV.");
            var result = await _profileService.UploadDefaultCvAsync(User, file);
            if (!result.Success) return BadRequest(new { message = result.Message });
            return Ok(result.Data);
        }

        [HttpPost("sync-cv-info")]
        public async Task<IActionResult> SyncCvInfo()
        {
            var result = await _profileService.SyncCvInfoAsync(User);
            if (!result.Success) return BadRequest(new { message = result.Message });
            return Ok(result.Data);
        }

        [HttpPut("skills")]
        public async Task<IActionResult> UpdateSkills([FromBody] UpdateSkillsRequest request)
        {
            if (request == null || request.Skills == null) return BadRequest("Danh sách kỹ năng không hợp lệ.");
            var result = await _profileService.UpdateSkillsAsync(User, request.Skills);
            if (!result.Success) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }
    }
}
