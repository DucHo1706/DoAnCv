using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using System.Security.Claims;
using System.Threading.Tasks;

namespace RecruitmentBackend.Hubs
{
    [Authorize]
    public class AIEvaluationHub : Hub
    {
        private readonly AppDbContext _context;

        public AIEvaluationHub(AppDbContext context)
        {
            _context = context;
        }

        public async Task JoinApplicationGroup(string applicationId)
        {
            string? accountId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            bool canAccess = !string.IsNullOrWhiteSpace(accountId) && await (
                from application in _context.Applications.AsNoTracking()
                join cv in _context.CandidateCVs.AsNoTracking() on application.CVID equals cv.CVID
                join candidate in _context.Candidates.AsNoTracking() on cv.CandidateID equals candidate.CandidateID
                join job in _context.JobPostings.AsNoTracking() on application.JobID equals job.JobID
                join recruiter in _context.Recruiters.AsNoTracking() on job.RecruiterID equals recruiter.RecruiterID into recruiterGroup
                from recruiter in recruiterGroup.DefaultIfEmpty()
                where application.ApplicationID == applicationId &&
                      (candidate.AccountID == accountId ||
                       (recruiter != null && (recruiter.AccountID == accountId ||
                        _context.RecruiterBranches.Any(branch => branch.RecruiterID == recruiter.RecruiterID && branch.BranchID == job.BranchID))))
                select application.ApplicationID
            ).AnyAsync();

            if (!canAccess)
            {
                throw new HubException("Không có quyền theo dõi hồ sơ ứng tuyển này.");
            }
            await Groups.AddToGroupAsync(Context.ConnectionId, applicationId);
        }
    }
}
