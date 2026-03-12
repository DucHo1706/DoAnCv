using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;

namespace RecruitmentBackend.Services
{
    public class JobService : IJobService
    {
        private readonly AppDbContext _context;
        private readonly IAiService _aiService;

        public JobService(AppDbContext context, IAiService aiService)
        {
            _context = context;
            _aiService = aiService;
        }

        public async Task<string> CreatePendingJobAsync(CreateJobRequest request)
        {
            var newJob = new Job
            {
                Id = Guid.NewGuid().ToString(), 
                Title = request.Title,
                Description = request.Description,
                Requirements = request.Requirements,
                Location = request.Location,
                SalaryRange = request.SalaryRange,
                CreatedAt = DateTime.UtcNow,
                StartDate = request.StartDate,
                Deadline = request.Deadline,
                MaxCandidates = request.MaxCandidates,
                IsActive = true, 
                IsApproved = false 
            };
            if (request.CategoryIds != null && request.CategoryIds.Count > 0)
            {
                var categories = await _context.Categories
                                               .Where(c => request.CategoryIds.Contains(c.Id))
                                               .ToListAsync();
                newJob.Categories = categories;
            }

            _context.Jobs.Add(newJob);
            await _context.SaveChangesAsync();

            return newJob.Id;
        }

        public async Task<JobReviewDto?> ReviewJobAsync(string jobId)
        {
            var job = await _context.Jobs.FindAsync(jobId);
            if (job == null) return null;

            var inputSkills = job.Requirements
                                 .Split(new[] { ',', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                                 .Select(s => s.Trim().ToLower())
                                 .ToList();

            var knownSkills = await _context.Skills.Select(s => s.Name.ToLower()).ToListAsync();
            var unknownSkills = inputSkills.Except(knownSkills).ToList();

            return new JobReviewDto
            {
                JobInfo = job,
                WordsToHighlight = unknownSkills
            };
        }

        public async Task<bool> ApproveJobAndSyncAiAsync(string jobId)
        {
            var job = await _context.Jobs.FindAsync(jobId);
            if (job == null || job.IsApproved) return false;

            job.IsApproved = true;

            var inputSkills = job.Requirements.Split(new[] { ',', '\n' }, StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim().ToLower()).ToList();
            var knownSkills = await _context.Skills.Select(s => s.Name.ToLower()).ToListAsync();
            var newSkills = inputSkills.Except(knownSkills).ToList();

            bool isAiNeedUpdate = false;

            foreach (var skill in newSkills)
            {
                _context.Skills.Add(new Skill { Name = skill, IsApproved = true });
                isAiNeedUpdate = true;
            }

            await _context.SaveChangesAsync();

            if (isAiNeedUpdate)
            {
                var allSkills = await _context.Skills.Select(s => s.Name).ToListAsync();
                await _aiService.SyncSkillsToAiAsync(allSkills);
            }

            return true;
        }
        public async Task<IEnumerable<Job>> GetAllJobsAsync()
        {
            return await _context.Jobs.Where(j => j.IsActive).ToListAsync();
        }

        public async Task<IEnumerable<Job>> GetPendingJobsAsync()
        {
            return await _context.Jobs
                                 .Where(j => !j.IsApproved && j.IsActive)
                                 .OrderByDescending(j => j.CreatedAt)
                                 .ToListAsync();
        }
    }
}