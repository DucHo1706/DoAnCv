using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Constants;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
using System.Security.Claims;
using System.Text.Json;

namespace RecruitmentBackend.Services
{
    public class TalentPoolService : ITalentPoolService
    {
        private readonly AppDbContext _context;

        public TalentPoolService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<(bool IsSuccess, string Message, object Data)> GetTalentPoolCandidatesAsync(ClaimsPrincipal user)
        {
            try
            {
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrWhiteSpace(accountId) == true)
                {
                    return (false, "Không xác định được tài khoản đang đăng nhập.", null);
                }

                var recruiter = await _context.Recruiters
                    .FirstOrDefaultAsync(recruiterItem => recruiterItem.AccountID == accountId);

                if (recruiter == null)
                {
                    return (false, "Không tìm thấy thông tin Nhà tuyển dụng.", null);
                }

                var talentPoolCandidates = await _context.TalentPoolCandidates
                    .Where(poolItem => poolItem.IsActive == true)
                    .OrderByDescending(poolItem => poolItem.LastUpdatedAt)
                    .ToListAsync();

                var responseList = new List<TalentPoolCandidateResponse>();

                foreach (var poolCandidate in talentPoolCandidates)
                {
                    bool isInviteLocked = false;
                    string inviteLockReason = "";

                    /*
                        Status Isolation:
                        Nếu ứng viên đang có hồ sơ active ở bất kỳ job đang mở nào,
                        thì khóa nút Mời ứng tuyển trong Talent Pool.
                    */
                    var activeApplication = await (
                        from application in _context.Applications
                        join cv in _context.CandidateCVs
                            on application.CVID equals cv.CVID
                        join job in _context.JobPostings
                            on application.JobID equals job.JobID
                        where cv.CandidateID == poolCandidate.CandidateID
                              && ApplicationStatuses.ActiveStatuses.Contains(application.Status)
                              && job.Status == "Published"
                        select new
                        {
                            application.ApplicationID,
                            application.Status,
                            job.JobID
                        }
                    ).FirstOrDefaultAsync();

                    if (activeApplication != null)
                    {
                        isInviteLocked = true;
                        inviteLockReason = "Ứng viên đang tham gia quy trình tuyển dụng ở một vị trí khác.";
                    }

                    var candidateSkills = await BuildCandidateSkillsAsync(poolCandidate);

                    var responseItem = new TalentPoolCandidateResponse();
                    responseItem.TalentPoolCandidateId = poolCandidate.TalentPoolCandidateID;
                    responseItem.CandidateId = poolCandidate.CandidateID;
                    responseItem.LatestCvId = poolCandidate.LatestCVID;

                    // Lookup CV file path
                    if (!string.IsNullOrEmpty(poolCandidate.LatestCVID))
                    {
                        var cv = await _context.CandidateCVs
                            .Where(c => c.CVID == poolCandidate.LatestCVID)
                            .Select(c => c.FilePath)
                            .FirstOrDefaultAsync();
                        responseItem.LatestCvUrl = cv;
                    }
                    responseItem.FullName = poolCandidate.FullName;
                    responseItem.Email = poolCandidate.Email;
                    responseItem.Phone = poolCandidate.Phone;
                    responseItem.HighlightSkillsJson = SerializeSkills(candidateSkills);
                    responseItem.HighestAiScore = poolCandidate.HighestAiScore;
                    responseItem.HighestScoreJobTitle = poolCandidate.HighestScoreJobTitle;
                    responseItem.CurrentAvailabilityStatus = poolCandidate.CurrentAvailabilityStatus;
                    responseItem.LastAppliedAt = poolCandidate.LastAppliedAt;
                    responseItem.LastUpdatedAt = poolCandidate.LastUpdatedAt;
                    responseItem.Source = poolCandidate.Source;
                    responseItem.IsInviteLocked = isInviteLocked;
                    responseItem.InviteLockReason = inviteLockReason;

                    responseList.Add(responseItem);
                }

                return (true, "Lấy danh sách Talent Pool thành công.", responseList);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi lấy danh sách Talent Pool: " + ex.Message, null);
            }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> GetTalentPoolDetailAsync(string talentPoolCandidateId, ClaimsPrincipal user)
        {
            try
            {
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrWhiteSpace(accountId) == true)
                {
                    return (false, "Không xác định được tài khoản đang đăng nhập.", null);
                }

                var recruiter = await _context.Recruiters
                    .FirstOrDefaultAsync(recruiterItem => recruiterItem.AccountID == accountId);

                if (recruiter == null)
                {
                    return (false, "Không tìm thấy thông tin Nhà tuyển dụng.", null);
                }

                var poolCandidate = await _context.TalentPoolCandidates
                    .FirstOrDefaultAsync(poolItem =>
                        poolItem.TalentPoolCandidateID == talentPoolCandidateId
                        && poolItem.IsActive == true
                    );

                if (poolCandidate == null)
                {
                    return (false, "Không tìm thấy ứng viên trong Talent Pool.", null);
                }

                bool isInviteLocked = false;
                string inviteLockReason = "";

                var activeApplication = await (
                    from application in _context.Applications
                    join cv in _context.CandidateCVs
                        on application.CVID equals cv.CVID
                    join job in _context.JobPostings
                        on application.JobID equals job.JobID
                    where cv.CandidateID == poolCandidate.CandidateID
                          && ApplicationStatuses.ActiveStatuses.Contains(application.Status)
                          && job.Status == "Published"
                    select new
                    {
                        application.ApplicationID,
                        application.Status,
                        job.JobID
                    }
                ).FirstOrDefaultAsync();

                if (activeApplication != null)
                {
                    isInviteLocked = true;
                    inviteLockReason = "Ứng viên đang tham gia quy trình tuyển dụng ở một vị trí khác.";
                }

                var candidateSkills = await BuildCandidateSkillsAsync(poolCandidate);
                await SyncTalentPoolSkillsIfNeededAsync(poolCandidate, candidateSkills);

                var candidateResponse = new TalentPoolCandidateResponse();
                candidateResponse.TalentPoolCandidateId = poolCandidate.TalentPoolCandidateID;
                candidateResponse.CandidateId = poolCandidate.CandidateID;
                candidateResponse.LatestCvId = poolCandidate.LatestCVID;

                // Lookup CV file path
                if (!string.IsNullOrEmpty(poolCandidate.LatestCVID))
                {
                    var cv = await _context.CandidateCVs
                        .Where(c => c.CVID == poolCandidate.LatestCVID)
                        .Select(c => c.FilePath)
                        .FirstOrDefaultAsync();
                    candidateResponse.LatestCvUrl = cv;
                }
                candidateResponse.FullName = poolCandidate.FullName;
                candidateResponse.Email = poolCandidate.Email;
                candidateResponse.Phone = poolCandidate.Phone;
                candidateResponse.HighlightSkillsJson = SerializeSkills(candidateSkills);
                candidateResponse.HighestAiScore = poolCandidate.HighestAiScore;
                candidateResponse.HighestScoreJobTitle = poolCandidate.HighestScoreJobTitle;
                candidateResponse.CurrentAvailabilityStatus = poolCandidate.CurrentAvailabilityStatus;
                candidateResponse.LastAppliedAt = poolCandidate.LastAppliedAt;
                candidateResponse.LastUpdatedAt = poolCandidate.LastUpdatedAt;
                candidateResponse.Source = poolCandidate.Source;
                candidateResponse.IsInviteLocked = isInviteLocked;
                candidateResponse.InviteLockReason = inviteLockReason;

                var interactions = await _context.TalentPoolInteractions
                    .Where(interactionItem =>
                        interactionItem.TalentPoolCandidateID == poolCandidate.TalentPoolCandidateID
                    )
                    .OrderByDescending(interactionItem => interactionItem.CreatedAt)
                    .ToListAsync();

                var timeline = new List<TalentPoolInteractionResponse>();

                foreach (var interaction in interactions)
                {
                    var timelineItem = new TalentPoolInteractionResponse();
                    timelineItem.InteractionId = interaction.InteractionID;
                    timelineItem.TalentPoolCandidateId = interaction.TalentPoolCandidateID;
                    timelineItem.ApplicationId = interaction.ApplicationID;
                    timelineItem.JobId = interaction.JobID;
                    timelineItem.Type = interaction.Type;
                    timelineItem.Title = interaction.Title;
                    timelineItem.Content = interaction.Content;
                    timelineItem.AiScore = interaction.AiScore;
                    timelineItem.StatusSnapshot = interaction.StatusSnapshot;
                    timelineItem.CreatedByRecruiterId = interaction.CreatedByRecruiterID;
                    timelineItem.CreatedAt = interaction.CreatedAt;

                    timeline.Add(timelineItem);
                }

                var response = new TalentPoolDetailResponse();
                response.Candidate = candidateResponse;
                response.Timeline = timeline;

                return (true, "Lấy chi tiết Talent Pool thành công.", response);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi lấy chi tiết Talent Pool: " + ex.Message, null);
            }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> AddTalentPoolNoteAsync(string talentPoolCandidateId, AddTalentPoolNoteRequest request, ClaimsPrincipal user)
        {
            try
            {
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrWhiteSpace(accountId) == true)
                {
                    return (false, "Không xác định được tài khoản đang đăng nhập.", null);
                }

                var recruiter = await _context.Recruiters
                    .FirstOrDefaultAsync(recruiterItem => recruiterItem.AccountID == accountId);

                if (recruiter == null)
                {
                    return (false, "Không tìm thấy thông tin Nhà tuyển dụng.", null);
                }

                if (request == null || string.IsNullOrWhiteSpace(request.Note) == true)
                {
                    return (false, "Vui lòng nhập nội dung ghi chú.", null);
                }

                var poolCandidate = await _context.TalentPoolCandidates
                    .FirstOrDefaultAsync(poolItem =>
                        poolItem.TalentPoolCandidateID == talentPoolCandidateId
                        && poolItem.IsActive == true
                    );

                if (poolCandidate == null)
                {
                    return (false, "Không tìm thấy ứng viên trong Talent Pool.", null);
                }

                string noteContent = request.Note.Trim();

                var interaction = new TalentPoolInteraction();
                interaction.TalentPoolCandidateID = poolCandidate.TalentPoolCandidateID;
                interaction.ApplicationID = null;
                interaction.JobID = null;
                interaction.Type = "HrNote";
                interaction.Title = "HR thêm ghi chú";
                interaction.Content = noteContent;
                interaction.AiScore = null;
                interaction.StatusSnapshot = poolCandidate.CurrentAvailabilityStatus;
                interaction.CreatedByRecruiterID = recruiter.RecruiterID;
                interaction.CreatedAt = DateTime.Now;

                await _context.TalentPoolInteractions.AddAsync(interaction);

                poolCandidate.LastUpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                var response = new TalentPoolInteractionResponse();
                response.InteractionId = interaction.InteractionID;
                response.TalentPoolCandidateId = interaction.TalentPoolCandidateID;
                response.ApplicationId = interaction.ApplicationID;
                response.JobId = interaction.JobID;
                response.Type = interaction.Type;
                response.Title = interaction.Title;
                response.Content = interaction.Content;
                response.AiScore = interaction.AiScore;
                response.StatusSnapshot = interaction.StatusSnapshot;
                response.CreatedByRecruiterId = interaction.CreatedByRecruiterID;
                response.CreatedAt = interaction.CreatedAt;

                return (true, "Đã thêm ghi chú vào Talent Pool.", response);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi thêm ghi chú Talent Pool: " + ex.Message, null);
            }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> GetInviteSuggestionsAsync(string talentPoolCandidateId, ClaimsPrincipal user)
        {
            try
            {
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrWhiteSpace(accountId) == true)
                {
                    return (false, "Không xác định được tài khoản đang đăng nhập.", null);
                }

                var recruiter = await _context.Recruiters
                    .FirstOrDefaultAsync(recruiterItem => recruiterItem.AccountID == accountId);

                if (recruiter == null)
                {
                    return (false, "Không tìm thấy thông tin Nhà tuyển dụng.", null);
                }

                var poolCandidate = await _context.TalentPoolCandidates
                    .FirstOrDefaultAsync(poolItem =>
                        poolItem.TalentPoolCandidateID == talentPoolCandidateId
                        && poolItem.IsActive == true
                    );

                if (poolCandidate == null)
                {
                    return (false, "Không tìm thấy ứng viên trong Talent Pool.", null);
                }

                bool isLocked = false;
                string lockReason = "";

                var activeApplication = await (
                    from application in _context.Applications
                    join cv in _context.CandidateCVs
                        on application.CVID equals cv.CVID
                    join job in _context.JobPostings
                        on application.JobID equals job.JobID
                    where cv.CandidateID == poolCandidate.CandidateID
                          && ApplicationStatuses.ActiveStatuses.Contains(application.Status)
                          && job.Status == "Published"
                    select new
                    {
                        application.ApplicationID,
                        application.Status,
                        job.JobID
                    }
                ).FirstOrDefaultAsync();

                if (activeApplication != null)
                {
                    isLocked = true;
                    lockReason = "Ứng viên đang tham gia quy trình tuyển dụng ở một vị trí khác.";
                }

                var candidateSkills = await BuildCandidateSkillsAsync(poolCandidate);
                await SyncTalentPoolSkillsIfNeededAsync(poolCandidate, candidateSkills);

                var openJobs = await (
                    from job in _context.JobPostings
                    join position in _context.Positions
                        on job.PositionID equals position.PositionID
                    join branch in _context.Branches
                        on job.BranchID equals branch.BranchID
                    where job.Status == "Published"
                          && job.Deadline >= DateTime.Now
                    select new
                    {
                        job.JobID,
                        position.PositionName,
                        branch.BranchName,
                        job.JobDescription,
                        job.JobRequirement,
                        job.JDExtractedSkills,
                        job.SalaryMin,
                        job.SalaryMax,
                        job.Deadline
                    }
                ).ToListAsync();

                var suggestedJobs = new List<TalentPoolSuggestedJobResponse>();

                foreach (var job in openJobs)
                {
                    var jobSkills = ExtractSkillNames(job.JDExtractedSkills);

                    if (jobSkills.Count == 0)
                    {
                        jobSkills = ExtractSkillNames(job.JobRequirement + " " + job.JobDescription);
                    }

                    var matchedSkills = new List<string>();

                    foreach (string candidateSkill in candidateSkills)
                    {
                        foreach (string jobSkill in jobSkills)
                        {
                            bool isSameSkill = NormalizeSkill(candidateSkill) == NormalizeSkill(jobSkill);

                            if (isSameSkill == true && HasSkill(matchedSkills, candidateSkill) == false)
                            {
                                matchedSkills.Add(candidateSkill);
                            }
                        }
                    }

                    int matchScore = CalculateMatchScore(candidateSkills, jobSkills, matchedSkills);

                    string reason = "Chưa tìm thấy kỹ năng khớp rõ ràng.";

                    if (matchedSkills.Count > 0)
                    {
                        reason = "Khớp " + string.Join(", ", matchedSkills.Take(5));
                    }

                    var suggestedJob = new TalentPoolSuggestedJobResponse();
                    suggestedJob.JobId = job.JobID;
                    suggestedJob.JobTitle = job.PositionName;
                    suggestedJob.BranchName = job.BranchName;
                    suggestedJob.MatchScore = matchScore;
                    suggestedJob.Reason = reason;
                    suggestedJob.SalaryRange = (job.SalaryMin == 0 && job.SalaryMax == 0) ? "Thỏa thuận" : (job.SalaryMax == 0 ? job.SalaryMin + " triệu" : job.SalaryMin + " - " + job.SalaryMax + " triệu");
                    suggestedJob.Deadline = job.Deadline.ToString("yyyy-MM-dd");

                    suggestedJobs.Add(suggestedJob);
                }

                suggestedJobs = suggestedJobs
                    .OrderByDescending(jobItem => jobItem.MatchScore)
                    .ThenBy(jobItem => jobItem.JobTitle)
                    .ToList();

                var candidateResponse = new TalentPoolCandidateResponse();
                candidateResponse.TalentPoolCandidateId = poolCandidate.TalentPoolCandidateID;
                candidateResponse.CandidateId = poolCandidate.CandidateID;
                candidateResponse.LatestCvId = poolCandidate.LatestCVID;

                // Lookup CV file path
                if (!string.IsNullOrEmpty(poolCandidate.LatestCVID))
                {
                    var cv = await _context.CandidateCVs
                        .Where(c => c.CVID == poolCandidate.LatestCVID)
                        .Select(c => c.FilePath)
                        .FirstOrDefaultAsync();
                    candidateResponse.LatestCvUrl = cv;
                }
                candidateResponse.FullName = poolCandidate.FullName;
                candidateResponse.Email = poolCandidate.Email;
                candidateResponse.Phone = poolCandidate.Phone;
                candidateResponse.HighlightSkillsJson = SerializeSkills(candidateSkills);
                candidateResponse.HighestAiScore = poolCandidate.HighestAiScore;
                candidateResponse.HighestScoreJobTitle = poolCandidate.HighestScoreJobTitle;
                candidateResponse.CurrentAvailabilityStatus = poolCandidate.CurrentAvailabilityStatus;
                candidateResponse.LastAppliedAt = poolCandidate.LastAppliedAt;
                candidateResponse.LastUpdatedAt = poolCandidate.LastUpdatedAt;
                candidateResponse.Source = poolCandidate.Source;
                candidateResponse.IsInviteLocked = isLocked;
                candidateResponse.InviteLockReason = lockReason;

                var response = new TalentPoolInviteSuggestionResponse();
                response.IsLocked = isLocked;
                response.LockReason = lockReason;
                response.Candidate = candidateResponse;
                response.SuggestedJobs = suggestedJobs;

                return (true, "Lấy danh sách job gợi ý thành công.", response);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi lấy danh sách job gợi ý: " + ex.Message, null);
            }
        }

        private async Task<List<string>> BuildCandidateSkillsAsync(TalentPoolCandidate poolCandidate)
        {
            var candidateSkills = ExtractSkillNames(poolCandidate.HighlightSkillsJson);

            if (string.IsNullOrWhiteSpace(poolCandidate.LatestCVID) == false)
            {
                var latestCv = await _context.CandidateCVs.FindAsync(poolCandidate.LatestCVID);

                if (latestCv != null)
                {
                    AddSkills(candidateSkills, ExtractSkillNames(latestCv.CVExtractedSkills));
                }
            }

            var latestAiEvaluation = await (
                from evaluation in _context.AIEvaluations
                join application in _context.Applications
                    on evaluation.ApplicationID equals application.ApplicationID
                join cv in _context.CandidateCVs
                    on application.CVID equals cv.CVID
                where cv.CandidateID == poolCandidate.CandidateID
                orderby evaluation.EvaluatedAt descending
                select evaluation
            ).FirstOrDefaultAsync();

            if (latestAiEvaluation != null)
            {
                AddSkills(candidateSkills, ExtractSkillNames(latestAiEvaluation.MatchedSkills));
            }

            return candidateSkills;
        }

        private async Task SyncTalentPoolSkillsIfNeededAsync(TalentPoolCandidate poolCandidate, List<string> candidateSkills)
        {
            string serializedSkills = SerializeSkills(candidateSkills);
            string currentSerializedSkills = SerializeSkills(ExtractSkillNames(poolCandidate.HighlightSkillsJson));

            if (serializedSkills != currentSerializedSkills)
            {
                poolCandidate.HighlightSkillsJson = serializedSkills;
                poolCandidate.LastUpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();
            }
        }

        private void AddSkills(List<string> targetSkills, List<string> newSkills)
        {
            foreach (string skill in newSkills)
            {
                if (string.IsNullOrWhiteSpace(skill) == true)
                {
                    continue;
                }

                string cleanedSkill = skill.Trim();

                if (HasSkill(targetSkills, cleanedSkill) == false)
                {
                    targetSkills.Add(cleanedSkill);
                }
            }
        }

        private bool HasSkill(List<string> skills, string skill)
        {
            string normalizedSkill = NormalizeSkill(skill);

            foreach (string existingSkill in skills)
            {
                if (NormalizeSkill(existingSkill) == normalizedSkill)
                {
                    return true;
                }
            }

            return false;
        }

        private string SerializeSkills(List<string> skills)
        {
            var cleanSkills = new List<string>();

            foreach (string skill in skills)
            {
                if (string.IsNullOrWhiteSpace(skill) == true)
                {
                    continue;
                }

                string cleanedSkill = skill.Trim();

                if (HasSkill(cleanSkills, cleanedSkill) == false)
                {
                    cleanSkills.Add(cleanedSkill);
                }
            }

            return JsonSerializer.Serialize(cleanSkills);
        }

        private List<string> ExtractSkillNames(string sourceText)
        {
            var skills = new List<string>();

            if (string.IsNullOrWhiteSpace(sourceText) == true)
            {
                return skills;
            }

            try
            {
                var jsonDocument = JsonDocument.Parse(sourceText);

                if (jsonDocument.RootElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in jsonDocument.RootElement.EnumerateArray())
                    {
                        string skillName = "";

                        if (item.ValueKind == JsonValueKind.String)
                        {
                            skillName = item.GetString();
                        }

                        if (item.ValueKind == JsonValueKind.Object)
                        {
                            if (item.TryGetProperty("name", out var nameProperty) == true)
                            {
                                skillName = nameProperty.GetString();
                            }

                            if (string.IsNullOrWhiteSpace(skillName) == true
                                && item.TryGetProperty("skillName", out var skillNameProperty) == true)
                            {
                                skillName = skillNameProperty.GetString();
                            }

                            if (string.IsNullOrWhiteSpace(skillName) == true
                                && item.TryGetProperty("skill", out var skillProperty) == true)
                            {
                                skillName = skillProperty.GetString();
                            }
                        }

                        if (string.IsNullOrWhiteSpace(skillName) == false)
                        {
                            string cleanedSkill = skillName.Trim();

                            if (HasSkill(skills, cleanedSkill) == false)
                            {
                                skills.Add(cleanedSkill);
                            }
                        }
                    }

                    return skills;
                }
            }
            catch
            {
            }

            var separators = new char[] { ',', ';', '\n', '\r', '|', '/', '\\' };
            var rawItems = sourceText.Split(separators, StringSplitOptions.RemoveEmptyEntries);

            foreach (string rawItem in rawItems)
            {
                string skillName = rawItem.Trim();

                if (skillName.Length > 0 && HasSkill(skills, skillName) == false)
                {
                    skills.Add(skillName);
                }
            }

            return skills;
        }

        private string NormalizeSkill(string skill)
        {
            if (string.IsNullOrWhiteSpace(skill) == true)
            {
                return "";
            }

            return skill.Trim().ToLower();
        }

        private int CalculateMatchScore(
            List<string> candidateSkills,
            List<string> jobSkills,
            List<string> matchedSkills
        )
        {
            if (candidateSkills.Count == 0 || jobSkills.Count == 0)
            {
                return 0;
            }

            decimal jobCoverage = (decimal)matchedSkills.Count / jobSkills.Count;
            decimal candidateCoverage = (decimal)matchedSkills.Count / candidateSkills.Count;

            decimal finalScore = (jobCoverage * 70) + (candidateCoverage * 30);

            int roundedScore = Convert.ToInt32(Math.Round(finalScore, 0));

            if (roundedScore > 100)
            {
                roundedScore = 100;
            }

            if (roundedScore < 0)
            {
                roundedScore = 0;
            }

            return roundedScore;
        }
    }
}
