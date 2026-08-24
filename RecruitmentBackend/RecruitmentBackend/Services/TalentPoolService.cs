using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Constants;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
using System.Security.Claims;
using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

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
            string currentStep = "khởi tạo";
            try
            {
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrWhiteSpace(accountId) == true)
                {
                    return (false, "Không xác định được tài khoản đang đăng nhập.", null);
                }

                currentStep = "kiểm tra recruiter";
                var recruiter = await _context.Recruiters
                    .Where(recruiterItem => recruiterItem.AccountID == accountId)
                    .Select(recruiterItem => recruiterItem.RecruiterID)
                    .FirstOrDefaultAsync();

                if (recruiter == null)
                {
                    return (false, "Không tìm thấy thông tin Nhà tuyển dụng.", null);
                }

                currentStep = "đọc Talent Pool Candidates";
                var talentPoolCandidates = await _context.TalentPoolCandidates
                    .AsNoTracking()
                    .Where(poolItem => poolItem.IsActive == true && poolItem.RecruiterID == recruiter)
                    .OrderByDescending(poolItem => poolItem.LastUpdatedAt)
                    .Select(poolItem => new
                    {
                        poolItem.TalentPoolCandidateID,
                        poolItem.RecruiterID,
                        CandidateID = poolItem.CandidateID ?? string.Empty,
                        LatestCVID = poolItem.LatestCVID ?? string.Empty,
                        FullName = poolItem.FullName ?? string.Empty,
                        Email = poolItem.Email ?? string.Empty,
                        Phone = poolItem.Phone ?? string.Empty,
                        HighlightSkillsJson = poolItem.HighlightSkillsJson ?? string.Empty,
                        HighestAiScore = (int?)poolItem.HighestAiScore ?? 0,
                        HighestScoreJobTitle = poolItem.HighestScoreJobTitle ?? string.Empty,
                        CurrentAvailabilityStatus = poolItem.CurrentAvailabilityStatus ?? string.Empty,
                        poolItem.LastAppliedAt,
                        LastUpdatedAt = (DateTime?)poolItem.LastUpdatedAt ?? DateTime.UtcNow,
                        Source = poolItem.Source ?? string.Empty,
                        DomainJson = poolItem.DomainJson ?? "[]",
                        TargetPositionsJson = poolItem.TargetPositionsJson ?? "[]",
                        JobLevel = poolItem.JobLevel ?? string.Empty,
                        SourcingPriority = poolItem.SourcingPriority ?? "Normal",
                        SourcingStage = poolItem.SourcingStage ?? "Saved",
                        TagsJson = poolItem.TagsJson ?? "[]",
                        poolItem.ExpectedSalary,
                        poolItem.AvailableFrom
                    })
                    .ToListAsync();

                var candidateIds = talentPoolCandidates.Select(item => item.CandidateID).Distinct().ToList();
                var latestCvIds = talentPoolCandidates
                    .Where(item => string.IsNullOrWhiteSpace(item.LatestCVID) == false)
                    .Select(item => item.LatestCVID)
                    .Distinct()
                    .ToList();

                currentStep = "đọc CV mới nhất";
                var latestCvById = await _context.CandidateCVs
                    .AsNoTracking()
                    .Where(cv => latestCvIds.Contains(cv.CVID))
                    .Select(cv => new
                    {
                        cv.CVID,
                        FilePath = cv.FilePath ?? string.Empty,
                        CVExtractedSkills = cv.CVExtractedSkills ?? string.Empty
                    })
                    .ToDictionaryAsync(cv => cv.CVID);

                currentStep = "kiểm tra ứng viên đang có hồ sơ hoạt động";
                var candidatesWithActiveApplications = (await (
                    from application in _context.Applications.AsNoTracking()
                    join cv in _context.CandidateCVs.AsNoTracking() on application.CVID equals cv.CVID
                    join job in _context.JobPostings.AsNoTracking() on application.JobID equals job.JobID
                    where candidateIds.Contains(cv.CandidateID)
                          && ApplicationStatuses.ActiveStatuses.Contains(application.Status)
                          && job.Status == "Published"
                    select cv.CandidateID
                ).Distinct().ToListAsync()).ToHashSet();

                currentStep = "đọc kết quả đánh giá AI";
                var evaluationRows = await (
                    from evaluation in _context.AIEvaluations.AsNoTracking()
                    join application in _context.Applications.AsNoTracking() on evaluation.ApplicationID equals application.ApplicationID
                    join cv in _context.CandidateCVs.AsNoTracking() on application.CVID equals cv.CVID
                    where candidateIds.Contains(cv.CandidateID)
                    select new
                    {
                        CandidateID = cv.CandidateID ?? string.Empty,
                        evaluation.EvaluatedAt,
                        MatchedSkills = evaluation.MatchedSkills ?? string.Empty
                    }
                ).ToListAsync();

                var latestMatchedSkillsByCandidate = evaluationRows
                    .GroupBy(row => row.CandidateID)
                    .ToDictionary(group => group.Key, group => group.OrderByDescending(row => row.EvaluatedAt).First().MatchedSkills);

                var responseList = new List<TalentPoolCandidateResponse>();

                foreach (var poolCandidate in talentPoolCandidates)
                {
                    bool isInviteLocked = candidatesWithActiveApplications.Contains(poolCandidate.CandidateID);
                    string inviteLockReason = isInviteLocked
                        ? "Ứng viên đang tham gia quy trình tuyển dụng ở một vị trí khác."
                        : "";

                    var candidateSkills = ExtractSkillNames(poolCandidate.HighlightSkillsJson);
                    latestCvById.TryGetValue(poolCandidate.LatestCVID ?? "", out var latestCv);
                    if (latestCv != null)
                    {
                        AddSkills(candidateSkills, ExtractSkillNames(latestCv.CVExtractedSkills));
                    }
                    if (latestMatchedSkillsByCandidate.TryGetValue(poolCandidate.CandidateID, out var matchedSkills))
                    {
                        AddSkills(candidateSkills, ExtractSkillNames(matchedSkills));
                    }

                    var responseItem = new TalentPoolCandidateResponse();
                    responseItem.TalentPoolCandidateId = poolCandidate.TalentPoolCandidateID;
                    responseItem.CandidateId = poolCandidate.CandidateID;
                    responseItem.LatestCvId = poolCandidate.LatestCVID;

                    responseItem.LatestCvUrl = latestCv?.FilePath;
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
                responseItem.DomainJson = poolCandidate.DomainJson;
                responseItem.TargetPositionsJson = poolCandidate.TargetPositionsJson;
                responseItem.JobLevel = poolCandidate.JobLevel;
                responseItem.SourcingPriority = poolCandidate.SourcingPriority;
                responseItem.SourcingStage = poolCandidate.SourcingStage;
                responseItem.TagsJson = poolCandidate.TagsJson;
                responseItem.ExpectedSalary = poolCandidate.ExpectedSalary;
                responseItem.AvailableFrom = poolCandidate.AvailableFrom;
                    responseItem.IsInviteLocked = isInviteLocked;
                    responseItem.InviteLockReason = inviteLockReason;

                    responseList.Add(responseItem);
                }

                return (true, "Lấy danh sách Talent Pool thành công.", responseList);
            }
            catch (Exception ex)
            {
                return (false, $"Lỗi khi lấy danh sách Talent Pool tại bước {currentStep}: {ex.Message}", null);
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
                    .Where(recruiterItem => recruiterItem.AccountID == accountId)
                    .Select(recruiterItem => recruiterItem.RecruiterID)
                    .FirstOrDefaultAsync();

                if (recruiter == null)
                {
                    return (false, "Không tìm thấy thông tin Nhà tuyển dụng.", null);
                }

                var poolCandidate = await _context.TalentPoolCandidates
                    .FirstOrDefaultAsync(poolItem =>
                        poolItem.TalentPoolCandidateID == talentPoolCandidateId
                        && poolItem.RecruiterID == recruiter
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
                var inferredContext = await InferCandidateContextAsync(poolCandidate.CandidateID);

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
                candidateResponse.DomainJson = HasJsonItems(poolCandidate.DomainJson)
                    ? poolCandidate.DomainJson
                    : SerializeCleanList(inferredContext.Domains);
                candidateResponse.TargetPositionsJson = HasJsonItems(poolCandidate.TargetPositionsJson)
                    ? poolCandidate.TargetPositionsJson
                    : SerializeCleanList(inferredContext.Positions);
                candidateResponse.JobLevel = poolCandidate.JobLevel;
                candidateResponse.SourcingPriority = poolCandidate.SourcingPriority;
                candidateResponse.SourcingStage = poolCandidate.SourcingStage;
                candidateResponse.TagsJson = poolCandidate.TagsJson;
                candidateResponse.ExpectedSalary = poolCandidate.ExpectedSalary;
                candidateResponse.AvailableFrom = poolCandidate.AvailableFrom;
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
                    .Where(recruiterItem => recruiterItem.AccountID == accountId)
                    .Select(recruiterItem => recruiterItem.RecruiterID)
                    .FirstOrDefaultAsync();

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
                        && poolItem.RecruiterID == recruiter
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
                interaction.CreatedByRecruiterID = recruiter;
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
                    .Where(recruiterItem => recruiterItem.AccountID == accountId)
                    .Select(recruiterItem => recruiterItem.RecruiterID)
                    .FirstOrDefaultAsync();

                if (recruiter == null)
                {
                    return (false, "Không tìm thấy thông tin Nhà tuyển dụng.", null);
                }

                var poolCandidate = await _context.TalentPoolCandidates
                    .FirstOrDefaultAsync(poolItem =>
                        poolItem.TalentPoolCandidateID == talentPoolCandidateId
                        && poolItem.RecruiterID == recruiter
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
                var inferredContext = await InferCandidateContextAsync(poolCandidate.CandidateID);

                DateTime todayVietnam = JobLifecyclePolicy.TodayVietnam;
                var openJobs = await (
                    from job in _context.JobPostings
                    join position in _context.Positions
                        on job.PositionID equals position.PositionID
                    join branch in _context.Branches
                        on job.BranchID equals branch.BranchID
                    where job.Status == "Published"
                          && (!job.StartDate.HasValue || job.StartDate.Value.Date <= todayVietnam)
                          && job.Deadline.Date >= todayVietnam
                          && job.RecruiterID == recruiter
                    select new
                    {
                        job.JobID,
                        PositionName = position.PositionName ?? string.Empty,
                        BranchName = branch.BranchName ?? string.Empty,
                        JobDescription = job.JobDescription ?? string.Empty,
                        JobRequirement = job.JobRequirement ?? string.Empty,
                        JDExtractedSkills = job.JDExtractedSkills ?? string.Empty,
                        job.SalaryMin,
                        job.SalaryMax,
                        job.Deadline
                    }
                ).ToListAsync();

                // JDExtractedSkills của các tin cũ có thể đang là [] vì luồng tạo tin
                // chưa bóc tách kỹ năng. Dùng danh mục kỹ năng đã duyệt để khôi phục
                // khả năng đối sánh trực tiếp từ mô tả/yêu cầu công việc.
                var approvedSkillNames = await _context.Skills
                    .AsNoTracking()
                    .Where(skill => skill.IsApproved == true)
                    .Select(skill => skill.Name ?? string.Empty)
                    .ToListAsync();

                var suggestedJobs = new List<TalentPoolSuggestedJobResponse>();

                foreach (var job in openJobs)
                {
                    var jobSkills = ExtractSkillNames(job.JDExtractedSkills);

                    if (jobSkills.Count == 0)
                    {
                        string jobText = (job.JobRequirement ?? "") + " " + (job.JobDescription ?? "");

                        foreach (string knownSkill in approvedSkillNames)
                        {
                            if (ContainsSkill(jobText, knownSkill))
                            {
                                AddSkills(jobSkills, new List<string> { knownSkill });
                            }
                        }

                        // Kỹ năng mới lấy từ CV có thể chưa được admin duyệt vào danh mục.
                        foreach (string candidateSkill in candidateSkills)
                        {
                            if (ContainsSkill(jobText, candidateSkill))
                            {
                                AddSkills(jobSkills, new List<string> { candidateSkill });
                            }
                        }
                    }

                    var matchedSkills = new List<string>();

                    foreach (string candidateSkill in candidateSkills)
                    {
                        foreach (string jobSkill in jobSkills)
                        {
                            bool isSameSkill = AreSkillsEquivalent(candidateSkill, jobSkill);

                            if (isSameSkill == true && HasSkill(matchedSkills, candidateSkill) == false)
                            {
                                matchedSkills.Add(candidateSkill);
                            }
                        }
                    }

                    int matchScore = CalculateMatchScore(candidateSkills, jobSkills, matchedSkills);
                    var missingSkills = jobSkills
                        .Where(jobSkill => matchedSkills.Any(matched => AreSkillsEquivalent(matched, jobSkill)) == false)
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToList();

                    string reason = "Chưa tìm thấy kỹ năng khớp rõ ràng.";

                    if (matchedSkills.Count > 0)
                    {
                        reason = $"Có bằng chứng cho {matchedSkills.Count}/{jobSkills.Count} kỹ năng trong yêu cầu tin.";
                    }

                    var suggestedJob = new TalentPoolSuggestedJobResponse();
                    suggestedJob.JobId = job.JobID;
                    suggestedJob.JobTitle = job.PositionName;
                    suggestedJob.BranchName = job.BranchName;
                    suggestedJob.MatchScore = matchScore;
                    suggestedJob.MatchedSkills = matchedSkills;
                    suggestedJob.MissingSkills = missingSkills;
                    suggestedJob.JobSkillCount = jobSkills.Count;
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
                // Invite suggestions dùng cùng DTO với trang chi tiết. Không bỏ qua
                // context sourcing ở đây, nếu không frontend sẽ nhận bản candidate
                // thiếu Domain/Position/Stage và hiển thị "chưa có thông tin".
                candidateResponse.DomainJson = HasJsonItems(poolCandidate.DomainJson)
                    ? poolCandidate.DomainJson
                    : SerializeCleanList(inferredContext.Domains);
                candidateResponse.TargetPositionsJson = HasJsonItems(poolCandidate.TargetPositionsJson)
                    ? poolCandidate.TargetPositionsJson
                    : SerializeCleanList(inferredContext.Positions);
                candidateResponse.JobLevel = poolCandidate.JobLevel;
                candidateResponse.SourcingPriority = poolCandidate.SourcingPriority;
                candidateResponse.SourcingStage = poolCandidate.SourcingStage;
                candidateResponse.TagsJson = poolCandidate.TagsJson ?? "[]";
                candidateResponse.ExpectedSalary = poolCandidate.ExpectedSalary;
                candidateResponse.AvailableFrom = poolCandidate.AvailableFrom;
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

        public async Task<(bool IsSuccess, string Message, object Data)> UpdateTalentPoolProfileAsync(
            string talentPoolCandidateId,
            UpdateTalentPoolProfileRequest request,
            ClaimsPrincipal user)
        {
            try
            {
                if (request == null) return (false, "Dữ liệu cập nhật không hợp lệ.", null);
                var accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var recruiterId = await _context.Recruiters.AsNoTracking()
                    .Where(recruiter => recruiter.AccountID == accountId)
                    .Select(recruiter => recruiter.RecruiterID)
                    .FirstOrDefaultAsync();
                if (recruiterId == null) return (false, "Không tìm thấy thông tin nhà tuyển dụng.", null);
                var item = await _context.TalentPoolCandidates.FirstOrDefaultAsync(x =>
                    x.TalentPoolCandidateID == talentPoolCandidateId
                    && x.RecruiterID == recruiterId
                    && x.IsActive);
                if (item == null) return (false, "Không tìm thấy ứng viên trong Talent Pool.", null);

                var allowedStages = new[] { "Saved", "Reviewed", "ContactPlanned", "Contacted", "Responded", "Interested", "Screening", "Interview", "Archived", "NotSuitable" };
                var allowedPriorities = new[] { "Low", "Normal", "High" };
                if (!allowedStages.Contains(request.SourcingStage ?? "", StringComparer.OrdinalIgnoreCase)) return (false, "Trạng thái sourcing không hợp lệ.", null);
                if (!allowedPriorities.Contains(request.SourcingPriority ?? "", StringComparer.OrdinalIgnoreCase)) return (false, "Mức ưu tiên không hợp lệ.", null);
                if (request.ExpectedSalary < 0) return (false, "Mức lương kỳ vọng không hợp lệ.", null);

                item.DomainJson = SerializeCleanList(request.Domains);
                item.TargetPositionsJson = SerializeCleanList(request.TargetPositions);
                item.TagsJson = SerializeCleanList(request.Tags);
                item.JobLevel = request.JobLevel?.Trim();
                item.SourcingPriority = request.SourcingPriority;
                item.SourcingStage = request.SourcingStage;
                item.ExpectedSalary = request.ExpectedSalary;
                item.AvailableFrom = request.AvailableFrom;
                item.LastUpdatedAt = DateTime.Now;
                await _context.SaveChangesAsync();
                return (true, "Đã cập nhật thông tin sourcing của ứng viên.", new
                {
                    item.TalentPoolCandidateID,
                    item.DomainJson,
                    item.TargetPositionsJson,
                    item.JobLevel,
                    item.SourcingPriority,
                    item.SourcingStage,
                    item.TagsJson,
                    item.ExpectedSalary,
                    item.AvailableFrom
                });
            }
            catch (Exception ex)
            {
                return (false, "Không thể cập nhật thông tin sourcing: " + ex.Message, null);
            }
        }

        private static string SerializeCleanList(IEnumerable<string> values)
        {
            var clean = (values ?? Array.Empty<string>())
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(value => value.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(30)
                .ToList();
            return JsonSerializer.Serialize(clean);
        }

        public async Task<(bool IsSuccess, string Message)> RemoveTalentPoolCandidateAsync(
            string talentPoolCandidateId,
            ClaimsPrincipal user)
        {
            string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrWhiteSpace(accountId))
            {
                return (false, "Không xác định được tài khoản đang đăng nhập.");
            }

            string? recruiterId = await _context.Recruiters
                .Where(recruiter => recruiter.AccountID == accountId)
                .Select(recruiter => recruiter.RecruiterID)
                .FirstOrDefaultAsync();

            if (recruiterId == null)
            {
                return (false, "Không tìm thấy thông tin nhà tuyển dụng.");
            }

            var poolCandidate = await _context.TalentPoolCandidates
                .FirstOrDefaultAsync(item =>
                    item.TalentPoolCandidateID == talentPoolCandidateId
                    && item.RecruiterID == recruiterId
                    && item.IsActive);

            if (poolCandidate == null)
            {
                return (false, "Không tìm thấy ứng viên trong kho tiềm năng.");
            }

            // Soft delete: keep the candidate account, CV, applications and audit timeline intact.
            poolCandidate.IsActive = false;
            poolCandidate.LastUpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return (true, "Đã loại ứng viên khỏi kho tiềm năng.");
        }

        public async Task<(bool IsSuccess, string Message, object Data)> SearchDiscoverableCandidatesAsync(
            CandidateDiscoverySearchRequest request,
            ClaimsPrincipal user)
        {
            if (request == null) return (false, "Bộ lọc tìm ứng viên không hợp lệ.", null);
            if (request.MinYearsOfExperience is < 0 or > 80) return (false, "Số năm kinh nghiệm phải từ 0 đến 80.", null);
            if (request.MinAiScore is < 0 or > 100) return (false, "Điểm AI phải từ 0 đến 100.", null);

            var accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var recruiter = await _context.Recruiters.AsNoTracking()
                .Where(item => item.AccountID == accountId)
                .Select(item => item.RecruiterID)
                .FirstOrDefaultAsync();
            if (recruiter == null) return (false, "Không tìm thấy thông tin nhà tuyển dụng.", null);

            if (string.IsNullOrWhiteSpace(request.JobId) == false)
            {
                var ownsJob = await _context.JobPostings.AnyAsync(job =>
                    job.JobID == request.JobId && job.RecruiterID == recruiter);
                if (!ownsJob) return (false, "Tin tuyển dụng không thuộc quyền quản lý của bạn.", null);
            }

            var now = DateTime.UtcNow;
            var candidates = await _context.Candidates.AsNoTracking()
                .Where(candidate => candidate.RecruiterDiscoveryEnabled &&
                    (!candidate.RecruiterDiscoveryExpiresAt.HasValue || candidate.RecruiterDiscoveryExpiresAt > now))
                .Select(candidate => new
                {
                    candidate.CandidateID,
                    FullName = candidate.FullName ?? string.Empty,
                    Address = candidate.Address ?? string.Empty,
                    ContactAllowed = candidate.RecruiterContactAllowed,
                    CvAllowed = candidate.RecruiterCvAllowed
                })
                .ToListAsync();
            if (candidates.Count == 0) return (true, "Không có ứng viên nào đang cho phép tìm kiếm.", Array.Empty<CandidateDiscoverySearchResponse>());

            var candidateIds = candidates.Select(item => item.CandidateID).ToList();
            var cvs = await _context.CandidateCVs.AsNoTracking()
                .Where(cv => candidateIds.Contains(cv.CandidateID))
                .OrderByDescending(cv => cv.CreatedAt)
                .Select(cv => new
                {
                    cv.CVID,
                    CandidateID = cv.CandidateID ?? string.Empty,
                    FilePath = cv.FilePath ?? string.Empty,
                    CVExtractedSkills = cv.CVExtractedSkills ?? string.Empty,
                    cv.Major,
                    cv.Degree,
                    cv.YearsOfExperience
                })
                .ToListAsync();
            var latestCvByCandidate = cvs
                .GroupBy(cv => cv.CandidateID)
                .ToDictionary(group => group.Key, group => group.First());

            var evaluations = await (
                from evaluation in _context.AIEvaluations.AsNoTracking()
                join application in _context.Applications.AsNoTracking() on evaluation.ApplicationID equals application.ApplicationID
                join cv in _context.CandidateCVs.AsNoTracking() on application.CVID equals cv.CVID
                where candidateIds.Contains(cv.CandidateID)
                select new { CandidateID = cv.CandidateID ?? string.Empty, evaluation.FitScore }
            ).ToListAsync();
            var scores = evaluations
                .GroupBy(item => item.CandidateID)
                .ToDictionary(group => group.Key, group => group.Max(item => item.FitScore));

            var activePoolIds = (await _context.TalentPoolCandidates.AsNoTracking()
                .Where(item => candidateIds.Contains(item.CandidateID)
                    && item.RecruiterID == recruiter
                    && item.IsActive)
                .Select(item => item.CandidateID)
                .ToListAsync()).ToHashSet();

            var keyword = request.Keyword?.Trim() ?? string.Empty;
            var skill = request.Skill?.Trim() ?? string.Empty;
            var rows = new List<CandidateDiscoverySearchResponse>();
            foreach (var candidate in candidates)
            {
                latestCvByCandidate.TryGetValue(candidate.CandidateID, out var cv);
                var skills = cv == null ? new List<string>() : ExtractSkillNames(cv.CVExtractedSkills);
                var score = scores.TryGetValue(candidate.CandidateID, out var foundScore) ? foundScore : (decimal?)null;
                var searchable = string.Join(" ", candidate.FullName, candidate.Address, cv?.Major, cv?.Degree, string.Join(" ", skills));
                if (keyword.Length > 0 && searchable.Contains(keyword, StringComparison.OrdinalIgnoreCase) == false) continue;
                if (skill.Length > 0 && skills.Any(item => item.Contains(skill, StringComparison.OrdinalIgnoreCase)) == false) continue;
                if (request.MinYearsOfExperience.HasValue && (cv?.YearsOfExperience ?? 0) < request.MinYearsOfExperience.Value) continue;
                if (request.MinAiScore.HasValue && (!score.HasValue || score.Value < request.MinAiScore.Value)) continue;

                rows.Add(new CandidateDiscoverySearchResponse
                {
                    CandidateId = candidate.CandidateID,
                    DisplayName = candidate.ContactAllowed
                        ? candidate.FullName
                        : $"Ứng viên #{candidate.CandidateID[^6..]}",
                    Major = cv?.Major,
                    Address = candidate.ContactAllowed ? candidate.Address : GetPublicLocation(candidate.Address),
                    YearsOfExperience = cv?.YearsOfExperience,
                    HighestAiScore = score,
                    SkillsJson = SerializeSkills(skills),
                    ContactAllowed = candidate.ContactAllowed,
                    CvAllowed = candidate.CvAllowed,
                    LatestCvUrl = candidate.CvAllowed ? cv?.FilePath : null,
                    AlreadyInTalentPool = activePoolIds.Contains(candidate.CandidateID)
                });
            }

            var ordered = rows
                .OrderByDescending(item => item.HighestAiScore ?? -1)
                .ThenByDescending(item => item.YearsOfExperience ?? -1)
                .ThenBy(item => item.DisplayName)
                .ToList();
            var page = Math.Max(1, request.Page);
            var pageSize = Math.Clamp(request.PageSize, 1, 100);
            return (true, "Tìm ứng viên có bật quyền hiển thị thành công.", new
            {
                total = ordered.Count,
                page,
                pageSize,
                items = ordered.Skip((page - 1) * pageSize).Take(pageSize).ToList()
            });
        }

        public async Task<(bool IsSuccess, string Message, object? Data)> SaveDiscoverableCandidateAsync(
            string candidateId,
            UpdateTalentPoolProfileRequest request,
            ClaimsPrincipal user)
        {
            if (string.IsNullOrWhiteSpace(candidateId))
                return (false, "Mã ứng viên không hợp lệ.", null);

            if (request == null)
                return (false, "Thông tin sourcing không hợp lệ.", null);

            var domains = NormalizeSourcingValues(request.Domains);
            var targetPositions = NormalizeSourcingValues(request.TargetPositions);
            var tags = NormalizeSourcingValues(request.Tags);
            if (domains.Count == 0 && targetPositions.Count == 0)
                return (false, "Vui lòng chọn ít nhất một lĩnh vực hoặc vị trí mục tiêu khi lưu ứng viên.", null);

            var allowedStages = new[] { "Saved", "Reviewed", "ContactPlanned", "Contacted", "Responded", "Interested", "Screening", "Interview", "Archived", "NotSuitable" };
            var allowedPriorities = new[] { "Low", "Normal", "High" };
            var stage = string.IsNullOrWhiteSpace(request.SourcingStage) ? "Saved" : request.SourcingStage.Trim();
            var priority = string.IsNullOrWhiteSpace(request.SourcingPriority) ? "Normal" : request.SourcingPriority.Trim();
            if (!allowedStages.Contains(stage, StringComparer.OrdinalIgnoreCase))
                return (false, "Giai đoạn sourcing không hợp lệ.", null);
            if (!allowedPriorities.Contains(priority, StringComparer.OrdinalIgnoreCase))
                return (false, "Mức ưu tiên sourcing không hợp lệ.", null);

            var accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var recruiterId = await _context.Recruiters.AsNoTracking()
                .Where(item => item.AccountID == accountId)
                .Select(item => item.RecruiterID)
                .FirstOrDefaultAsync();
            if (recruiterId == null)
                return (false, "Không tìm thấy thông tin nhà tuyển dụng.", null);

            var candidate = await _context.Candidates.AsNoTracking()
                .Where(item => item.CandidateID == candidateId && item.RecruiterDiscoveryEnabled &&
                    (!item.RecruiterDiscoveryExpiresAt.HasValue || item.RecruiterDiscoveryExpiresAt > DateTime.UtcNow))
                .Select(item => new
                {
                    item.CandidateID,
                    item.AccountID,
                    FullName = item.FullName ?? string.Empty,
                    Phone = item.Phone ?? string.Empty,
                    item.RecruiterContactAllowed
                })
                .FirstOrDefaultAsync();
            if (candidate == null)
                return (false, "Hồ sơ không tồn tại hoặc ứng viên đã tắt quyền hiển thị.", null);

            var latestCv = await _context.CandidateCVs.AsNoTracking()
                .Where(item => item.CandidateID == candidateId)
                .OrderByDescending(item => item.CreatedAt)
                .Select(item => new
                {
                    item.CVID,
                    CVExtractedSkills = item.CVExtractedSkills ?? string.Empty
                })
                .FirstOrDefaultAsync();

            var talentPoolCandidate = await _context.TalentPoolCandidates
                .FirstOrDefaultAsync(item =>
                    item.CandidateID == candidateId
                    && item.RecruiterID == recruiterId);
            if (talentPoolCandidate == null)
            {
                talentPoolCandidate = new TalentPoolCandidate
                {
                    CandidateID = candidateId,
                    RecruiterID = recruiterId,
                    HighestAiScore = 0
                };
                await _context.TalentPoolCandidates.AddAsync(talentPoolCandidate);
            }

            var candidateEmail = candidate.RecruiterContactAllowed
                ? await _context.Accounts.AsNoTracking()
                    .Where(item => item.AccountID == candidate.AccountID)
                    .Select(item => item.Email)
                    .FirstOrDefaultAsync()
                : string.Empty;

            var skills = latestCv == null
                ? new List<string>()
                : ExtractSkillNames(latestCv.CVExtractedSkills);
            talentPoolCandidate.LatestCVID = latestCv?.CVID ?? string.Empty;
            talentPoolCandidate.FullName = candidate.RecruiterContactAllowed ? candidate.FullName : "";
            talentPoolCandidate.Email = candidateEmail ?? string.Empty;
            talentPoolCandidate.Phone = candidate.RecruiterContactAllowed ? candidate.Phone : "";
            talentPoolCandidate.HighlightSkillsJson = SerializeSkills(skills);
            talentPoolCandidate.CurrentAvailabilityStatus = "Sourcing";
            talentPoolCandidate.LastUpdatedAt = DateTime.Now;
            talentPoolCandidate.Source = "RecruiterSaved";
            talentPoolCandidate.IsActive = true;
            talentPoolCandidate.DomainJson = JsonSerializer.Serialize(domains);
            talentPoolCandidate.TargetPositionsJson = JsonSerializer.Serialize(targetPositions);
            talentPoolCandidate.JobLevel = string.IsNullOrWhiteSpace(request.JobLevel) ? null : request.JobLevel.Trim();
            talentPoolCandidate.SourcingPriority = priority;
            talentPoolCandidate.SourcingStage = stage;
            talentPoolCandidate.TagsJson = JsonSerializer.Serialize(tags);
            talentPoolCandidate.ExpectedSalary = request.ExpectedSalary;
            talentPoolCandidate.AvailableFrom = request.AvailableFrom;

            await _context.TalentPoolInteractions.AddAsync(new TalentPoolInteraction
            {
                TalentPoolCandidateID = talentPoolCandidate.TalentPoolCandidateID,
                Type = "Sourced",
                Title = "HR lưu ứng viên từ tìm kiếm",
                Content = "Ứng viên được HR lưu từ nguồn tìm kiếm chủ động.",
                StatusSnapshot = stage,
                CreatedByRecruiterID = recruiterId,
                CreatedAt = DateTime.Now
            });
            await _context.SaveChangesAsync();

            return (true, "Đã lưu ứng viên vào Talent Pool và ghi nhận nguồn RecruiterSaved.", new
            {
                talentPoolCandidateId = talentPoolCandidate.TalentPoolCandidateID,
                queuedForMining = true,
                source = talentPoolCandidate.Source
            });
        }

        public async Task<(bool IsSuccess, string Message, object? Data)> GetDiscoverableCandidateDetailAsync(
            string candidateId,
            ClaimsPrincipal user)
        {
            if (string.IsNullOrWhiteSpace(candidateId)) return (false, "Mã ứng viên không hợp lệ.", null);

            var accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var recruiter = await _context.Recruiters.AsNoTracking()
                .FirstOrDefaultAsync(item => item.AccountID == accountId);
            if (recruiter == null) return (false, "Không tìm thấy thông tin nhà tuyển dụng.", null);

            var now = DateTime.UtcNow;
            var candidate = await _context.Candidates.AsNoTracking()
                .FirstOrDefaultAsync(item => item.CandidateID == candidateId
                    && item.RecruiterDiscoveryEnabled
                    && (!item.RecruiterDiscoveryExpiresAt.HasValue || item.RecruiterDiscoveryExpiresAt > now));
            if (candidate == null) return (false, "Hồ sơ không tồn tại hoặc ứng viên đã tắt quyền hiển thị.", null);

            var cv = await _context.CandidateCVs.AsNoTracking()
                .Where(item => item.CandidateID == candidateId)
                .OrderByDescending(item => item.CreatedAt)
                .FirstOrDefaultAsync();
            var candidateCvs = await _context.CandidateCVs.AsNoTracking()
                .Where(item => item.CandidateID == candidateId)
                .OrderByDescending(item => item.CreatedAt)
                .ToListAsync();
            var applicationCvIds = (await _context.Applications.AsNoTracking()
                .Where(item => candidateCvs.Select(cvItem => cvItem.CVID).Contains(item.CVID))
                .Select(item => item.CVID)
                .Distinct()
                .ToListAsync()).ToHashSet();
            var score = await (
                from evaluation in _context.AIEvaluations.AsNoTracking()
                join application in _context.Applications.AsNoTracking() on evaluation.ApplicationID equals application.ApplicationID
                join candidateCv in _context.CandidateCVs.AsNoTracking() on application.CVID equals candidateCv.CVID
                where candidateCv.CandidateID == candidateId
                select (decimal?)evaluation.FitScore
            ).MaxAsync() ?? null;

            var skills = cv == null ? new List<string>() : ExtractSkillNames(cv.CVExtractedSkills);
            var profileCvIds = candidateCvs.Select(item => item.CVID).ToList();
            var profileDomains = await _context.CandidateCvDomains.AsNoTracking()
                .Where(item => profileCvIds.Contains(item.CVID))
                .Select(item => item.Domain)
                .Where(item => item != null && item != "")
                .Distinct()
                .ToListAsync();
            if (profileDomains.Count == 0 && string.IsNullOrWhiteSpace(cv?.Major) == false)
            {
                profileDomains.Add(cv!.Major!.Trim());
            }
            var profilePositions = await (
                from application in _context.Applications.AsNoTracking()
                join job in _context.JobPostings.AsNoTracking() on application.JobID equals job.JobID
                join position in _context.Positions.AsNoTracking() on job.PositionID equals position.PositionID
                where profileCvIds.Contains(application.CVID)
                select position.PositionName
            ).Where(item => item != null && item != "").Distinct().ToListAsync();
            var publicCvs = candidateCvs.Select(item => new CandidatePublicCvResponse
            {
                CvId = item.CVID,
                DisplayName = string.IsNullOrWhiteSpace(item.FilePath) ? "CV không có tệp" : Path.GetFileName(item.FilePath),
                SourceLabel = item.SourceType switch
                {
                    "CvBuilder" => "CV tạo trực tuyến",
                    "Uploaded" => "CV tải lên",
                    "Stored" => "CV đã lưu",
                    _ => "CV trong hồ sơ"
                },
                CreatedAt = item.CreatedAt,
                IsApplicationSnapshot = applicationCvIds.Contains(item.CVID),
                FileUrl = candidate.RecruiterCvAllowed ? item.FilePath : null
            }).ToList();
            if (candidate.RecruiterCvAllowed)
            {
                var builderDocuments = await _context.CvBuilderDocuments.AsNoTracking()
                    .Where(item => item.CandidateID == candidateId)
                    .OrderByDescending(item => item.UpdatedAt)
                    .ToListAsync();
                publicCvs.AddRange(builderDocuments.Select(document => new CandidatePublicCvResponse
                {
                    CvId = $"builder:{document.Id}",
                    DisplayName = document.Name,
                    SourceLabel = "CV tạo trực tuyến",
                    CreatedAt = document.UpdatedAt,
                    IsApplicationSnapshot = false,
                    BuilderContentJson = document.ContentJson,
                    BuilderSettingsJson = document.SettingsJson
                }));
            }
            return (true, "Lấy hồ sơ ứng viên thành công.", new CandidateDiscoverySearchResponse
            {
                CandidateId = candidate.CandidateID,
                DisplayName = candidate.RecruiterContactAllowed ? candidate.FullName : $"Ứng viên #{candidate.CandidateID[^6..]}",
                Major = cv?.Major,
                Address = candidate.RecruiterContactAllowed ? candidate.Address : GetPublicLocation(candidate.Address),
                YearsOfExperience = cv?.YearsOfExperience,
                HighestAiScore = score,
                SkillsJson = SerializeSkills(skills),
                ContactAllowed = candidate.RecruiterContactAllowed,
                CvAllowed = candidate.RecruiterCvAllowed,
                LatestCvUrl = candidate.RecruiterCvAllowed ? cv?.FilePath : null,
                ProfileDomains = profileDomains,
                ProfilePositions = profilePositions,
                PublicCvs = publicCvs,
                AlreadyInTalentPool = await _context.TalentPoolCandidates.AnyAsync(item =>
                    item.CandidateID == candidateId
                    && item.RecruiterID == recruiter.RecruiterID
                    && item.IsActive)
            });
        }

        private static List<string> NormalizeSourcingValues(IEnumerable<string>? values)
        {
            return (values ?? Array.Empty<string>())
                .Where(value => string.IsNullOrWhiteSpace(value) == false)
                .Select(value => value.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(30)
                .ToList();
        }

        private async Task<(List<string> Domains, List<string> Positions)> InferCandidateContextAsync(string candidateId)
        {
            var cvRows = await _context.CandidateCVs.AsNoTracking()
                .Where(item => item.CandidateID == candidateId)
                .OrderByDescending(item => item.CreatedAt)
                .Select(item => new { item.CVID, item.Major })
                .ToListAsync();
            var cvIds = cvRows.Select(item => item.CVID).ToList();
            var domains = await _context.CandidateCvDomains.AsNoTracking()
                .Where(item => cvIds.Contains(item.CVID))
                .Select(item => item.Domain)
                .Where(item => item != null && item != "")
                .Distinct()
                .ToListAsync();
            var latestMajor = cvRows.Select(item => item.Major).FirstOrDefault(item => string.IsNullOrWhiteSpace(item) == false);
            if (domains.Count == 0 && string.IsNullOrWhiteSpace(latestMajor) == false)
            {
                domains.Add(latestMajor!.Trim());
            }
            var positions = await (
                from application in _context.Applications.AsNoTracking()
                join job in _context.JobPostings.AsNoTracking() on application.JobID equals job.JobID
                join position in _context.Positions.AsNoTracking() on job.PositionID equals position.PositionID
                where cvIds.Contains(application.CVID)
                select position.PositionName
            ).Where(item => item != null && item != "").Distinct().ToListAsync();
            return (domains, positions);
        }

        private static bool HasJsonItems(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return false;
            try
            {
                var values = JsonSerializer.Deserialize<List<string>>(json);
                return values?.Any(value => string.IsNullOrWhiteSpace(value) == false) == true;
            }
            catch
            {
                return false;
            }
        }

        private static string? GetPublicLocation(string? address)
        {
            if (string.IsNullOrWhiteSpace(address)) return null;
            // Chỉ hiển thị cấp thành phố/tỉnh khi ứng viên chưa cho phép liên hệ,
            // tránh lộ địa chỉ cá nhân chi tiết trong kết quả tìm kiếm.
            var parts = address.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            return parts.Length == 0 ? null : parts[^1];
        }

        private async Task<List<string>> BuildCandidateSkillsAsync(TalentPoolCandidate poolCandidate)
        {
            var candidateSkills = ExtractSkillNames(poolCandidate.HighlightSkillsJson);

            if (string.IsNullOrWhiteSpace(poolCandidate.LatestCVID) == false)
            {
                var latestCv = await _context.CandidateCVs
                    .AsNoTracking()
                    .Where(item => item.CVID == poolCandidate.LatestCVID)
                    .Select(item => new { CVExtractedSkills = item.CVExtractedSkills ?? string.Empty })
                    .FirstOrDefaultAsync();

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
                select new { MatchedSkills = evaluation.MatchedSkills ?? string.Empty }
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

            string normalized = skill.Trim().ToLowerInvariant()
                .Replace("c#", "csharp")
                .Replace(".net", "dotnet")
                .Replace("node.js", "nodejs")
                .Replace("react.js", "reactjs")
                .Normalize(NormalizationForm.FormD);

            var builder = new StringBuilder(normalized.Length);
            foreach (char character in normalized)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
                {
                    builder.Append(char.IsLetterOrDigit(character) ? character : ' ');
                }
            }

            return Regex.Replace(builder.ToString(), @"\s+", " ").Trim();
        }

        private bool AreSkillsEquivalent(string firstSkill, string secondSkill)
        {
            string first = NormalizeSkill(firstSkill);
            string second = NormalizeSkill(secondSkill);

            if (first.Length == 0 || second.Length == 0)
            {
                return false;
            }

            if (first == second)
            {
                return true;
            }

            // Cho phép ASP.NET khớp ASP.NET Core, nhưng không dùng contains cho
            // kỹ năng một ký tự như C/R để tránh kết quả dương tính giả.
            return first.Length >= 3 && second.Length >= 3
                && (ContainsNormalizedPhrase(first, second) || ContainsNormalizedPhrase(second, first));
        }

        private bool ContainsSkill(string sourceText, string skill)
        {
            string normalizedSource = NormalizeSkill(sourceText);
            string normalizedSkill = NormalizeSkill(skill);

            return normalizedSkill.Length > 0
                && ContainsNormalizedPhrase(normalizedSource, normalizedSkill);
        }

        private bool ContainsNormalizedPhrase(string source, string phrase)
        {
            return (" " + source + " ").Contains(" " + phrase + " ", StringComparison.Ordinal);
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

            decimal finalScore = (decimal)matchedSkills.Count / jobSkills.Count * 100;

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
