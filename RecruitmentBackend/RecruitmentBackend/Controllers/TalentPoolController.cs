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

        [HttpGet("search")]
        public async Task<IActionResult> SearchDiscoverableCandidates([FromQuery] CandidateDiscoverySearchRequest request)
        {
            var result = await _talentPoolService.SearchDiscoverableCandidatesAsync(request, User);
            if (result.IsSuccess == false)
            {
                return BadRequest(new { message = result.Message });
            }
            return Ok(result.Data);
        }

        [HttpPost("discoverable/{candidateId}/save")]
        public async Task<IActionResult> SaveDiscoverableCandidate(
            string candidateId,
            [FromBody] UpdateTalentPoolProfileRequest request)
        {
            var result = await _talentPoolService.SaveDiscoverableCandidateAsync(candidateId, request, User);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message, data = result.Data });
        }

        [HttpGet("discoverable/{candidateId}")]
        public async Task<IActionResult> GetDiscoverableCandidateDetail(string candidateId)
        {
            var result = await _talentPoolService.GetDiscoverableCandidateDetailAsync(candidateId, User);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
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

        [HttpDelete("{talentPoolCandidateId}")]
        public async Task<IActionResult> RemoveTalentPoolCandidate(string talentPoolCandidateId)
        {
            var result = await _talentPoolService.RemoveTalentPoolCandidateAsync(
                talentPoolCandidateId,
                User
            );

            if (result.IsSuccess == false)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new { message = result.Message });
        }

        [HttpPut("{talentPoolCandidateId}/profile")]
        public async Task<IActionResult> UpdateTalentPoolProfile(
            string talentPoolCandidateId,
            [FromBody] UpdateTalentPoolProfileRequest request)
        {
            var result = await _talentPoolService.UpdateTalentPoolProfileAsync(talentPoolCandidateId, request, User);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message, data = result.Data });
        }
    }
}
