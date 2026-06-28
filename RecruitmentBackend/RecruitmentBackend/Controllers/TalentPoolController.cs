using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.DTOs.Requests;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Recruiter")]
    public class TalentPoolController : ControllerBase
    {
        private readonly ITalentPoolService _talentPoolService;

        public TalentPoolController(ITalentPoolService talentPoolService)
        {
            _talentPoolService = talentPoolService;
        }

        [HttpGet]
        public async Task<IActionResult> GetTalentPoolCandidates()
        {
            var result = await _talentPoolService.GetTalentPoolCandidatesAsync(User);

            if (result.IsSuccess == false)
            {
                return BadRequest(new
                {
                    message = result.Message
                });
            }

            return Ok(result.Data);
        }
        [HttpGet("{talentPoolCandidateId}")]
        public async Task<IActionResult> GetTalentPoolDetail(string talentPoolCandidateId)
        {
            var result = await _talentPoolService.GetTalentPoolDetailAsync(
                talentPoolCandidateId,
                User
            );

            if (result.IsSuccess == false)
            {
                return BadRequest(new
                {
                    message = result.Message
                });
            }

            return Ok(result.Data);
        }
        [HttpGet("{talentPoolCandidateId}/invite-suggestions")]
        public async Task<IActionResult> GetInviteSuggestions(string talentPoolCandidateId)
        {
            var result = await _talentPoolService.GetInviteSuggestionsAsync(
                talentPoolCandidateId,
                User
            );

            if (result.IsSuccess == false)
            {
                return BadRequest(new
                {
                    message = result.Message
                });
            }

            return Ok(result.Data);
        }
        [HttpPost("{talentPoolCandidateId}/notes")]
        public async Task<IActionResult> AddTalentPoolNote(
            string talentPoolCandidateId,
            [FromBody] AddTalentPoolNoteRequest request
        )
        {
            var result = await _talentPoolService.AddTalentPoolNoteAsync(
                talentPoolCandidateId,
                request,
                User
            );

            if (result.IsSuccess == false)
            {
                return BadRequest(new
                {
                    message = result.Message
                });
            }

            return Ok(new
            {
                message = result.Message,
                data = result.Data
            });
        }
    }
}