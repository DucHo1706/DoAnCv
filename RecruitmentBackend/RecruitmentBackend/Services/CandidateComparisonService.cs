using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.DTOs.Responses;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;

namespace RecruitmentBackend.Services
{
    public class CandidateComparisonService : ICandidateComparisonService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<CandidateComparisonService> _logger;

        public CandidateComparisonService(
            AppDbContext context,
            ILogger<CandidateComparisonService> logger
        )
        {
            _context = context;
            _logger = logger;
        }

        public async Task<(bool IsSuccess, string Message, object Data)> GetCandidateRankingsAsync(
            string jobId,
            string? sortBy,
            string? criterionName,
            string? search,
            string? skill,
            decimal? minScore,
            double? minYearsOfExperience,
            ClaimsPrincipal user
        )
        {
            if (string.IsNullOrWhiteSpace(jobId) == true)
            {
                return (false, "JobId không được để trống.", null);
            }

            string normalizedJobId = jobId.Trim();

            var ownershipResult = await GetOwnedJobAsync(normalizedJobId, user);
            if (ownershipResult.IsSuccess == false)
            {
                return (false, ownershipResult.Message, null);
            }

            string normalizedSortBy = "overall";
            if (string.IsNullOrWhiteSpace(sortBy) == false)
            {
                normalizedSortBy = sortBy.Trim().ToLowerInvariant();
            }

            if (normalizedSortBy != "overall" && normalizedSortBy != "criterion")
            {
                return (false, "sortBy chỉ nhận giá trị overall hoặc criterion.", null);
            }

            if (normalizedSortBy == "criterion" && string.IsNullOrWhiteSpace(criterionName) == true)
            {
                return (false, "Vui lòng cung cấp criterionName khi xếp hạng theo tiêu chí.", null);
            }

            if (minScore is < 0 or > 100)
            {
                return (false, "Điểm AI tối thiểu phải từ 0 đến 100.", null);
            }

            if (minYearsOfExperience is < 0 or > 80)
            {
                return (false, "Số năm kinh nghiệm tối thiểu phải từ 0 đến 80.", null);
            }

            var job = ownershipResult.Job!;
            var rawCandidates = await GetRawCandidatesAsync(job.JobID, null);
            var response = await BuildResponseAsync(job, rawCandidates);

            string normalizedSearch = string.Empty;
            if (string.IsNullOrWhiteSpace(search) == false)
            {
                normalizedSearch = search.Trim();
                response.Candidates = response.Candidates
                    .Where(candidate =>
                        candidate.CandidateName.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ||
                        candidate.CandidateEmail.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ||
                        candidate.CandidatePhone.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ||
                        candidate.Degree.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ||
                        candidate.Major.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ||
                        candidate.University.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ||
                        candidate.MatchedSkills.Any(value => value.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase)))
                    .ToList();
            }

            if (string.IsNullOrWhiteSpace(skill) == false)
            {
                string normalizedSkill = skill.Trim();
                response.Candidates = response.Candidates
                    .Where(candidate => candidate.MatchedSkills.Any(value =>
                        value.Contains(normalizedSkill, StringComparison.OrdinalIgnoreCase)))
                    .ToList();
            }

            if (minScore.HasValue)
            {
                response.Candidates = response.Candidates
                    .Where(candidate => candidate.AiScore.HasValue && candidate.AiScore.Value >= minScore.Value)
                    .ToList();
            }

            if (minYearsOfExperience.HasValue)
            {
                response.Candidates = response.Candidates
                    .Where(candidate => candidate.YearsOfExperience.HasValue &&
                        candidate.YearsOfExperience.Value >= minYearsOfExperience.Value)
                    .ToList();
            }

            if (normalizedSortBy == "criterion")
            {
                string requestedCriterionName = criterionName!.Trim();
                bool criterionExists = response.AvailableCriteria.Any(criterion =>
                    string.Equals(
                        criterion.CriterionName,
                        requestedCriterionName,
                        StringComparison.OrdinalIgnoreCase
                    )
                );

                if (criterionExists == false)
                {
                    return (false, "Không tìm thấy tiêu chí xếp hạng trong công việc này.", null);
                }

                ApplyCriterionRanking(response.Candidates, requestedCriterionName);
            }
            else
            {
                ApplyOverallRanking(response.Candidates);
            }

            var rankingResponse = new CandidateRankingResponse
            {
                JobId = response.JobId,
                JobTitle = response.JobTitle,
                AvailableCriteria = response.AvailableCriteria,
                Candidates = response.Candidates,
                SortBy = normalizedSortBy,
                Search = normalizedSearch
            };

            if (normalizedSortBy == "criterion")
            {
                rankingResponse.CriterionName = criterionName!.Trim();
            }

            return (true, "Lấy danh sách xếp hạng ứng viên thành công.", rankingResponse);
        }

        public async Task<(bool IsSuccess, string Message, object Data)> CompareCandidatesAsync(
            CompareCandidatesRequest request,
            ClaimsPrincipal user
        )
        {
            if (request == null)
            {
                return (false, "Dữ liệu so sánh không hợp lệ.", null);
            }

            if (string.IsNullOrWhiteSpace(request.JobId) == true)
            {
                return (false, "JobId không được để trống.", null);
            }

            string normalizedJobId = request.JobId.Trim();

            if (request.ApplicationIds == null)
            {
                return (false, "Danh sách applicationIds không được để trống.", null);
            }

            var applicationIds = request.ApplicationIds
                .Where(applicationId => string.IsNullOrWhiteSpace(applicationId) == false)
                .Select(applicationId => applicationId.Trim())
                .ToList();

            if (applicationIds.Count < 2 || applicationIds.Count > 4)
            {
                return (false, "Số lượng applicationIds phải từ 2 đến 4.", null);
            }

            if (applicationIds.Count != request.ApplicationIds.Count)
            {
                return (false, "applicationIds không được chứa ID rỗng.", null);
            }

            int distinctApplicationCount = applicationIds
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Count();

            if (distinctApplicationCount != applicationIds.Count)
            {
                return (false, "applicationIds không được chứa ID trùng nhau.", null);
            }

            var ownershipResult = await GetOwnedJobAsync(normalizedJobId, user);
            if (ownershipResult.IsSuccess == false)
            {
                return (false, ownershipResult.Message, null);
            }

            var existingApplications = await _context.Applications
                .Where(application =>
                    application.JobID == ownershipResult.Job!.JobID &&
                    applicationIds.Contains(application.ApplicationID)
                )
                .Select(application => new
                {
                    application.ApplicationID
                })
                .ToListAsync();

            if (existingApplications.Count != applicationIds.Count)
            {
                return (false, "Không tìm thấy một hoặc nhiều hồ sơ trong công việc đã chọn.", null);
            }

            var rawCandidates = await GetRawCandidatesAsync(
                ownershipResult.Job!.JobID,
                applicationIds
            );

            if (rawCandidates.Count != applicationIds.Count)
            {
                return (false, "Không tìm thấy một hoặc nhiều hồ sơ trong công việc đã chọn.", null);
            }

            var response = await BuildResponseAsync(ownershipResult.Job, rawCandidates);
            ApplyOverallRanking(response.Candidates);

            response.Candidates = response.Candidates
                .OrderBy(candidate => applicationIds.IndexOf(candidate.ApplicationId))
                .ToList();

            return (true, "Lấy dữ liệu so sánh ứng viên thành công.", response);
        }

        private async Task<(bool IsSuccess, string Message, JobPosting? Job)> GetOwnedJobAsync(
            string jobId,
            ClaimsPrincipal user
        )
        {
            if (string.IsNullOrWhiteSpace(jobId) == true)
            {
                return (false, "JobId không được để trống.", null);
            }

            string? accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
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

            var job = await _context.JobPostings
                .Include(jobItem => jobItem.Criteria)
                .FirstOrDefaultAsync(jobItem =>
                    jobItem.JobID == jobId &&
                    jobItem.RecruiterID == recruiter.RecruiterID
                );

            if (job == null)
            {
                return (false, "Không tìm thấy công việc hoặc bạn không có quyền truy cập.", null);
            }

            return (true, string.Empty, job);
        }

        private async Task<List<RawCandidateData>> GetRawCandidatesAsync(
            string jobId,
            List<string>? applicationIds
        )
        {
            var query =
                from application in _context.Applications
                join candidateCv in _context.CandidateCVs
                    on application.CVID equals candidateCv.CVID
                join candidate in _context.Candidates
                    on candidateCv.CandidateID equals candidate.CandidateID
                join account in _context.Accounts
                    on candidate.AccountID equals account.AccountID
                join evaluation in _context.AIEvaluations
                    on application.ApplicationID equals evaluation.ApplicationID into evaluationGroup
                from evaluation in evaluationGroup.DefaultIfEmpty()
                where application.JobID == jobId
                select new RawCandidateData
                {
                    ApplicationId = application.ApplicationID,
                    CandidateId = candidate.CandidateID,
                    CandidateName = candidate.FullName,
                    AccountEmail = account.Email,
                    CandidatePhone = candidate.Phone,
                    ApplicationStatus = application.Status,
                    AppliedAt = application.AppliedAt,
                    CvUrl = candidateCv.FilePath,
                    CvEmail = candidateCv.ExtractedEmail,
                    CvPhone = candidateCv.ExtractedPhone,
                    Degree = candidateCv.Degree,
                    Major = candidateCv.Major,
                    University = candidateCv.University,
                    YearsOfExperience = candidateCv.YearsOfExperience,
                    CertificatesJson = candidateCv.Certificates,
                    Evaluation = evaluation
                };

            if (applicationIds != null)
            {
                query = query.Where(candidate => applicationIds.Contains(candidate.ApplicationId));
            }

            return await query.ToListAsync();
        }

        private async Task<CandidateComparisonResponse> BuildResponseAsync(
            JobPosting job,
            List<RawCandidateData> rawCandidates
        )
        {
            string jobTitle = "Chưa cập nhật";
            var position = await _context.Positions
                .FirstOrDefaultAsync(positionItem => positionItem.PositionID == job.PositionID);

            if (position != null && string.IsNullOrWhiteSpace(position.PositionName) == false)
            {
                jobTitle = position.PositionName;
            }

            var availableCriteria = new List<CandidateCriterionDefinitionDto>();
            foreach (var jobCriterion in job.Criteria)
            {
                AddCriterionDefinition(
                    availableCriteria,
                    jobCriterion.Name,
                    jobCriterion.Weight,
                    jobCriterion.Weight
                );
            }

            var parsedCandidates = new List<ParsedCandidateData>();
            foreach (var rawCandidate in rawCandidates)
            {
                var parsedCandidate = ParseCandidate(rawCandidate, job.JobID, jobTitle);
                parsedCandidates.Add(parsedCandidate);

                foreach (var criterionResult in parsedCandidate.ParsedCriteria)
                {
                    AddCriterionDefinition(
                        availableCriteria,
                        criterionResult.CriterionName,
                        criterionResult.Weight,
                        criterionResult.MaxScore
                    );
                }
            }

            var response = new CandidateComparisonResponse
            {
                JobId = job.JobID,
                JobTitle = jobTitle,
                AvailableCriteria = availableCriteria
            };

            foreach (var parsedCandidate in parsedCandidates)
            {
                foreach (var criterionDefinition in availableCriteria)
                {
                    var parsedCriterion = parsedCandidate.ParsedCriteria.FirstOrDefault(criterion =>
                        string.Equals(
                            criterion.CriterionName,
                            criterionDefinition.CriterionName,
                            StringComparison.OrdinalIgnoreCase
                        )
                    );

                    if (parsedCriterion == null)
                    {
                        parsedCandidate.Candidate.CriteriaResults.Add(new CandidateCriterionResultDto
                        {
                            CriterionName = criterionDefinition.CriterionName,
                            Weight = criterionDefinition.Weight,
                            MaxScore = criterionDefinition.MaxScore,
                            Score = null,
                            Comment = string.Empty,
                            HasData = false
                        });
                    }
                    else
                    {
                        parsedCriterion.CriterionName = criterionDefinition.CriterionName;
                        parsedCriterion.Weight = criterionDefinition.Weight;
                        parsedCandidate.Candidate.CriteriaResults.Add(parsedCriterion);
                    }
                }

                response.Candidates.Add(parsedCandidate.Candidate);
            }

            return response;
        }

        private ParsedCandidateData ParseCandidate(
            RawCandidateData rawCandidate,
            string jobId,
            string jobTitle
        )
        {
            string candidateEmail = rawCandidate.AccountEmail;
            if (string.IsNullOrWhiteSpace(rawCandidate.CvEmail) == false)
            {
                candidateEmail = rawCandidate.CvEmail.Trim();
            }

            string candidatePhone = rawCandidate.CandidatePhone;
            if (string.IsNullOrWhiteSpace(rawCandidate.CvPhone) == false)
            {
                candidatePhone = rawCandidate.CvPhone.Trim();
            }

            var candidate = new CandidateComparisonItemDto
            {
                ApplicationId = rawCandidate.ApplicationId,
                CandidateId = rawCandidate.CandidateId,
                CandidateName = rawCandidate.CandidateName ?? string.Empty,
                CandidateEmail = candidateEmail ?? string.Empty,
                CandidatePhone = candidatePhone ?? string.Empty,
                JobId = jobId,
                JobTitle = jobTitle,
                ApplicationStatus = rawCandidate.ApplicationStatus ?? string.Empty,
                AppliedAt = rawCandidate.AppliedAt,
                CvUrl = rawCandidate.CvUrl ?? string.Empty,
                Degree = rawCandidate.Degree ?? string.Empty,
                Major = rawCandidate.Major ?? string.Empty,
                University = rawCandidate.University ?? string.Empty,
                YearsOfExperience = rawCandidate.YearsOfExperience
            };

            var certificatesParseResult = ParseStringList(rawCandidate.CertificatesJson);
            candidate.Certificates = certificatesParseResult.Values;

            if (rawCandidate.Evaluation == null)
            {
                candidate.AiDataStatus = "missing";
                candidate.AiDataMessage = "Hồ sơ chưa có đánh giá AI.";
                candidate.Classification = "Chưa phân loại";
                candidate.Summary = "Chưa có đánh giá AI.";
                return new ParsedCandidateData(candidate, new List<CandidateCriterionResultDto>());
            }

            var evaluation = rawCandidate.Evaluation;
            candidate.AiScore = evaluation.FitScore;
            candidate.Classification = evaluation.Classification ?? "Chưa phân loại";

            var matchedSkillsParseResult = ParseStringList(evaluation.MatchedSkills);
            var missingSkillsParseResult = ParseStringList(evaluation.MissingSkills);
            var criteriaParseResult = ParseCriteriaResults(evaluation.CriteriaResultsJson);
            var analysisParseResult = ParseAnalysisReason(evaluation.Reason, candidate);

            candidate.MatchedSkills = matchedSkillsParseResult.Values;
            candidate.MissingSkills = missingSkillsParseResult.Values;

            LogParseIssues(
                evaluation,
                rawCandidate.ApplicationId,
                matchedSkillsParseResult,
                missingSkillsParseResult,
                criteriaParseResult,
                analysisParseResult,
                certificatesParseResult
            );

            bool isAiError = string.Equals(
                evaluation.Classification,
                "AI_ERROR",
                StringComparison.OrdinalIgnoreCase
            );

            if (isAiError == true)
            {
                candidate.AiDataStatus = "error";
                candidate.AiDataMessage = "AI chưa thể hoàn tất đánh giá hồ sơ này.";
                candidate.AiScore = null;
            }
            else
            {
                bool hasParseError =
                    matchedSkillsParseResult.HasParseError ||
                    missingSkillsParseResult.HasParseError ||
                    criteriaParseResult.HasParseError ||
                    analysisParseResult.HasParseError;

                bool hasUsableComparisonData =
                    candidate.AiScore.HasValue ||
                    matchedSkillsParseResult.HasRecognizedStructure ||
                    missingSkillsParseResult.HasRecognizedStructure ||
                    criteriaParseResult.HasRecognizedStructure ||
                    analysisParseResult.HasUsableStructuredData;

                bool allRequiredFieldsAreComplete =
                    matchedSkillsParseResult.IsComplete &&
                    missingSkillsParseResult.IsComplete &&
                    criteriaParseResult.IsComplete &&
                    analysisParseResult.IsComplete;

                if (hasParseError == true && hasUsableComparisonData == false)
                {
                    candidate.AiDataStatus = "invalid";
                    candidate.AiDataMessage = "Dữ liệu phân tích AI không hợp lệ và không thể chuẩn hóa an toàn.";
                }
                else if (allRequiredFieldsAreComplete == false)
                {
                    candidate.AiDataStatus = "partial";
                    candidate.AiDataMessage = "Hồ sơ có đánh giá AI nhưng thiếu hoặc không đọc được một phần dữ liệu phân tích chi tiết.";
                }
                else
                {
                    candidate.AiDataStatus = "ready";
                    candidate.AiDataMessage = "Dữ liệu đánh giá AI đã sẵn sàng.";
                }

                if (certificatesParseResult.HasParseError == true && candidate.AiDataStatus == "ready")
                {
                    candidate.AiDataStatus = "partial";
                    candidate.AiDataMessage = "Dữ liệu đánh giá AI đã sẵn sàng nhưng thông tin chứng chỉ bị thiếu hoặc không đúng định dạng.";
                }
            }

            return new ParsedCandidateData(candidate, criteriaParseResult.Values);
        }

        private AnalysisReasonParseResult ParseAnalysisReason(
            string? reason,
            CandidateComparisonItemDto candidate
        )
        {
            var parseResult = new AnalysisReasonParseResult();
            candidate.Summary = reason ?? string.Empty;

            if (string.IsNullOrWhiteSpace(reason) == true)
            {
                return parseResult;
            }

            parseResult.SourcePresent = true;
            string originalText = reason.Trim();
            string jsonText = originalText;
            int firstBraceIndex = jsonText.IndexOf('{');

            if (firstBraceIndex > 0)
            {
                jsonText = jsonText.Substring(firstBraceIndex);
            }

            if (jsonText.StartsWith("{") == false)
            {
                parseResult.IsPlainText = true;

                if (originalText.StartsWith("\"") == true)
                {
                    try
                    {
                        using var stringDocument = JsonDocument.Parse(originalText);
                        if (stringDocument.RootElement.ValueKind == JsonValueKind.String)
                        {
                            candidate.Summary = stringDocument.RootElement.GetString() ?? string.Empty;
                            parseResult.IsJsonString = true;
                        }
                    }
                    catch (JsonException)
                    {
                        // Plain text is a supported legacy value. It is not split into structured fields.
                    }
                }

                return parseResult;
            }

            try
            {
                using var document = JsonDocument.Parse(jsonText);
                if (document.RootElement.ValueKind != JsonValueKind.Object)
                {
                    parseResult.HasInvalidFields = true;
                    return parseResult;
                }

                JsonElement analysisElement = document.RootElement;
                bool hasNestedScoreAnalysis = TryGetPropertyIgnoreCase(
                    document.RootElement,
                    "score_analysis",
                    out var scoreAnalysisElement
                );

                if (hasNestedScoreAnalysis == true)
                {
                    if (scoreAnalysisElement.ValueKind != JsonValueKind.Object)
                    {
                        parseResult.HasInvalidFields = true;
                        return parseResult;
                    }

                    analysisElement = scoreAnalysisElement;
                }

                var strengthsResult = ReadStringArrayPropertyWithState(
                    analysisElement,
                    "strengths"
                );
                var weaknessesResult = ReadStringArrayPropertyWithState(
                    analysisElement,
                    "weaknesses"
                );

                candidate.Strengths = strengthsResult.Values;
                candidate.Weaknesses = weaknessesResult.Values;

                parseResult.StrengthsPresent = strengthsResult.PropertyPresent;
                parseResult.StrengthsValid = strengthsResult.IsValid;
                parseResult.WeaknessesPresent = weaknessesResult.PropertyPresent;
                parseResult.WeaknessesValid = weaknessesResult.IsValid;

                bool summaryPresent = TryGetPropertyIgnoreCase(
                    analysisElement,
                    "summary",
                    out var summaryElement
                );
                parseResult.SummaryPresent = summaryPresent;

                if (summaryPresent == true)
                {
                    if (summaryElement.ValueKind == JsonValueKind.String)
                    {
                        candidate.Summary = summaryElement.GetString() ?? string.Empty;
                        parseResult.SummaryValid = true;
                    }
                    else
                    {
                        parseResult.SummaryValid = false;
                    }
                }

                parseResult.JsonShapeRecognized =
                    hasNestedScoreAnalysis ||
                    strengthsResult.PropertyPresent ||
                    weaknessesResult.PropertyPresent ||
                    summaryPresent;

                if (parseResult.JsonShapeRecognized == false ||
                    (strengthsResult.PropertyPresent && strengthsResult.IsValid == false) ||
                    (weaknessesResult.PropertyPresent && weaknessesResult.IsValid == false) ||
                    (summaryPresent == true && parseResult.SummaryValid == false))
                {
                    parseResult.HasInvalidFields = true;
                }
            }
            catch (JsonException exception)
            {
                candidate.Strengths = new List<string>();
                candidate.Weaknesses = new List<string>();
                parseResult.HasMalformedJson = true;
                parseResult.ErrorLineNumber = exception.LineNumber;
                parseResult.ErrorBytePosition = exception.BytePositionInLine;
            }

            return parseResult;
        }

        private CriteriaParseResult ParseCriteriaResults(string? jsonText)
        {
            var parseResult = new CriteriaParseResult();

            if (string.IsNullOrWhiteSpace(jsonText) == true)
            {
                return parseResult;
            }

            parseResult.SourcePresent = true;

            try
            {
                using var document = JsonDocument.Parse(jsonText);
                if (document.RootElement.ValueKind != JsonValueKind.Array)
                {
                    parseResult.HasInvalidRoot = true;
                    return parseResult;
                }

                parseResult.JsonArrayRecognized = true;

                foreach (var item in document.RootElement.EnumerateArray())
                {
                    if (item.ValueKind != JsonValueKind.Object)
                    {
                        parseResult.HasInvalidItems = true;
                        continue;
                    }

                    string criterionName = ReadStringProperty(item, "criterionName", "criterion_name");
                    if (string.IsNullOrWhiteSpace(criterionName) == true)
                    {
                        parseResult.HasInvalidItems = true;
                        continue;
                    }

                    var weightResult = ReadNullableIntPropertyWithState(item, "weight");
                    var maxScoreResult = ReadNullableIntPropertyWithState(
                        item,
                        "maxScore",
                        "max_score"
                    );
                    var scoreResult = ReadNullableIntPropertyWithState(item, "score");

                    int weight = weightResult.Value ?? 0;
                    int maxScore = maxScoreResult.Value ?? 0;
                    int? score = scoreResult.Value;

                    if (weightResult.PropertyPresent == false ||
                        weightResult.IsValid == false ||
                        weightResult.Value.HasValue == false ||
                        maxScoreResult.PropertyPresent == false || maxScoreResult.IsValid == false ||
                        maxScore <= 0 ||
                        scoreResult.IsValid == false)
                    {
                        parseResult.HasInvalidItems = true;
                    }

                    string comment = string.Empty;
                    bool commentPresent = TryGetPropertyIgnoreCase(item, "comment", out var commentElement);
                    if (commentPresent == true)
                    {
                        if (commentElement.ValueKind == JsonValueKind.String)
                        {
                            comment = commentElement.GetString() ?? string.Empty;
                        }
                        else
                        {
                            parseResult.HasInvalidItems = true;
                        }
                    }

                    parseResult.Values.Add(new CandidateCriterionResultDto
                    {
                        CriterionName = criterionName.Trim(),
                        Weight = weight,
                        MaxScore = maxScore,
                        Score = score,
                        Comment = comment,
                        HasData = score.HasValue
                    });
                }
            }
            catch (JsonException exception)
            {
                parseResult.HasMalformedJson = true;
                parseResult.ErrorLineNumber = exception.LineNumber;
                parseResult.ErrorBytePosition = exception.BytePositionInLine;
            }

            return parseResult;
        }

        private StringListParseResult ParseStringList(string? sourceText)
        {
            var parseResult = new StringListParseResult();

            if (string.IsNullOrWhiteSpace(sourceText) == true)
            {
                return parseResult;
            }

            parseResult.SourcePresent = true;

            try
            {
                using var document = JsonDocument.Parse(sourceText);
                if (document.RootElement.ValueKind != JsonValueKind.Array)
                {
                    parseResult.HasInvalidRoot = true;
                    return parseResult;
                }

                parseResult.JsonArrayRecognized = true;

                foreach (var item in document.RootElement.EnumerateArray())
                {
                    string value = string.Empty;

                    if (item.ValueKind == JsonValueKind.String)
                    {
                        value = item.GetString() ?? string.Empty;
                    }
                    else if (item.ValueKind == JsonValueKind.Object)
                    {
                        value = ReadStringProperty(item, "name", "skillName", "skill");
                    }
                    else
                    {
                        parseResult.HasInvalidItems = true;
                    }

                    if (string.IsNullOrWhiteSpace(value) == true && item.ValueKind != JsonValueKind.String)
                    {
                        parseResult.HasInvalidItems = true;
                    }

                    AddUniqueString(parseResult.Values, value);
                }
            }
            catch (JsonException exception)
            {
                parseResult.HasMalformedJson = true;
                parseResult.ErrorLineNumber = exception.LineNumber;
                parseResult.ErrorBytePosition = exception.BytePositionInLine;
            }

            return parseResult;
        }

        private void LogParseIssues(
            AIEvaluation evaluation,
            string applicationId,
            StringListParseResult matchedSkillsResult,
            StringListParseResult missingSkillsResult,
            CriteriaParseResult criteriaResult,
            AnalysisReasonParseResult analysisResult,
            StringListParseResult certificatesResult
        )
        {
            LogParseIssue(
                evaluation,
                applicationId,
                "MatchedSkills",
                matchedSkillsResult.HasParseError,
                matchedSkillsResult.ErrorLineNumber,
                matchedSkillsResult.ErrorBytePosition
            );
            LogParseIssue(
                evaluation,
                applicationId,
                "MissingSkills",
                missingSkillsResult.HasParseError,
                missingSkillsResult.ErrorLineNumber,
                missingSkillsResult.ErrorBytePosition
            );
            LogParseIssue(
                evaluation,
                applicationId,
                "CriteriaResultsJson",
                criteriaResult.HasParseError,
                criteriaResult.ErrorLineNumber,
                criteriaResult.ErrorBytePosition
            );
            LogParseIssue(
                evaluation,
                applicationId,
                "Reason",
                analysisResult.HasParseError,
                analysisResult.ErrorLineNumber,
                analysisResult.ErrorBytePosition
            );
            LogParseIssue(
                evaluation,
                applicationId,
                "Certificates",
                certificatesResult.HasParseError,
                certificatesResult.ErrorLineNumber,
                certificatesResult.ErrorBytePosition
            );
        }

        private void LogParseIssue(
            AIEvaluation evaluation,
            string applicationId,
            string dataPart,
            bool hasParseError,
            long? lineNumber,
            long? bytePosition
        )
        {
            if (hasParseError == false)
            {
                return;
            }

            _logger.LogWarning(
                "Không thể chuẩn hóa đầy đủ {DataPart} của Evaluation {EvaluationId}, Application {ApplicationId}. Line {LineNumber}, Byte {BytePosition}.",
                dataPart,
                evaluation.EvaluationID,
                applicationId,
                lineNumber,
                bytePosition
            );
        }

        private void AddCriterionDefinition(
            List<CandidateCriterionDefinitionDto> criteria,
            string? criterionName,
            int weight,
            int maxScore
        )
        {
            if (string.IsNullOrWhiteSpace(criterionName) == true)
            {
                return;
            }

            bool alreadyExists = criteria.Any(criterion =>
                string.Equals(
                    criterion.CriterionName,
                    criterionName.Trim(),
                    StringComparison.OrdinalIgnoreCase
                )
            );

            if (alreadyExists == true)
            {
                return;
            }

            if (maxScore <= 0)
            {
                maxScore = weight;
            }

            criteria.Add(new CandidateCriterionDefinitionDto
            {
                CriterionName = criterionName.Trim(),
                Weight = weight,
                MaxScore = maxScore
            });
        }

        private void ApplyOverallRanking(List<CandidateComparisonItemDto> candidates)
        {
            foreach (var candidate in candidates)
            {
                candidate.OverallRank = null;
                candidate.SelectedCriterionRank = null;
            }

            var eligibleCandidates = candidates
                .Where(candidate => candidate.AiScore.HasValue)
                .OrderByDescending(candidate => candidate.AiScore)
                .ThenBy(candidate => candidate.CandidateName)
                .ToList();

            decimal? previousScore = null;
            int currentRank = 0;

            for (int index = 0; index < eligibleCandidates.Count; index++)
            {
                var candidate = eligibleCandidates[index];
                if (previousScore.HasValue == false || candidate.AiScore != previousScore)
                {
                    currentRank = index + 1;
                    previousScore = candidate.AiScore;
                }

                candidate.OverallRank = currentRank;
            }

            candidates.Sort((leftCandidate, rightCandidate) =>
            {
                int leftRank = leftCandidate.OverallRank ?? int.MaxValue;
                int rightRank = rightCandidate.OverallRank ?? int.MaxValue;
                int rankComparison = leftRank.CompareTo(rightRank);
                if (rankComparison != 0)
                {
                    return rankComparison;
                }

                return string.Compare(
                    leftCandidate.CandidateName,
                    rightCandidate.CandidateName,
                    StringComparison.OrdinalIgnoreCase
                );
            });
        }

        private void ApplyCriterionRanking(
            List<CandidateComparisonItemDto> candidates,
            string criterionName
        )
        {
            ApplyOverallRanking(candidates);

            var eligibleCandidates = candidates
                .Select(candidate => new
                {
                    Candidate = candidate,
                    Criterion = candidate.CriteriaResults.FirstOrDefault(criterion =>
                        string.Equals(
                            criterion.CriterionName,
                            criterionName,
                            StringComparison.OrdinalIgnoreCase
                        )
                    )
                })
                .Where(item =>
                    item.Criterion != null &&
                    item.Criterion.HasData &&
                    item.Criterion.Score.HasValue &&
                    item.Criterion.MaxScore > 0
                )
                .OrderByDescending(item => GetCriterionPercentage(item.Criterion!))
                .ThenBy(item => item.Candidate.CandidateName)
                .ToList();

            decimal? previousPercentage = null;
            int currentRank = 0;

            for (int index = 0; index < eligibleCandidates.Count; index++)
            {
                var item = eligibleCandidates[index];
                decimal percentage = GetCriterionPercentage(item.Criterion!);

                if (previousPercentage.HasValue == false || percentage != previousPercentage.Value)
                {
                    currentRank = index + 1;
                    previousPercentage = percentage;
                }

                item.Candidate.SelectedCriterionRank = currentRank;
            }

            candidates.Sort((leftCandidate, rightCandidate) =>
            {
                int leftRank = leftCandidate.SelectedCriterionRank ?? int.MaxValue;
                int rightRank = rightCandidate.SelectedCriterionRank ?? int.MaxValue;
                int rankComparison = leftRank.CompareTo(rightRank);
                if (rankComparison != 0)
                {
                    return rankComparison;
                }

                return string.Compare(
                    leftCandidate.CandidateName,
                    rightCandidate.CandidateName,
                    StringComparison.OrdinalIgnoreCase
                );
            });
        }

        private decimal GetCriterionPercentage(CandidateCriterionResultDto criterion)
        {
            if (criterion.Score.HasValue == false || criterion.MaxScore <= 0)
            {
                return 0;
            }

            return decimal.Divide(criterion.Score.Value, criterion.MaxScore);
        }

        private JsonArrayPropertyParseResult ReadStringArrayPropertyWithState(
            JsonElement element,
            string propertyName
        )
        {
            var parseResult = new JsonArrayPropertyParseResult();
            if (TryGetPropertyIgnoreCase(element, propertyName, out var arrayElement) == false)
            {
                return parseResult;
            }

            parseResult.PropertyPresent = true;
            if (arrayElement.ValueKind != JsonValueKind.Array)
            {
                return parseResult;
            }

            parseResult.IsValid = true;
            foreach (var item in arrayElement.EnumerateArray())
            {
                if (item.ValueKind == JsonValueKind.String)
                {
                    string value = item.GetString() ?? string.Empty;
                    if (string.IsNullOrWhiteSpace(value) == true)
                    {
                        parseResult.IsValid = false;
                        continue;
                    }

                    AddUniqueString(parseResult.Values, value);
                }
                else
                {
                    parseResult.IsValid = false;
                }
            }

            return parseResult;
        }

        private string ReadStringProperty(JsonElement element, params string[] propertyNames)
        {
            foreach (var propertyName in propertyNames)
            {
                if (TryGetPropertyIgnoreCase(element, propertyName, out var valueElement) == true &&
                    valueElement.ValueKind == JsonValueKind.String)
                {
                    return valueElement.GetString() ?? string.Empty;
                }
            }

            return string.Empty;
        }

        private NullableIntPropertyParseResult ReadNullableIntPropertyWithState(
            JsonElement element,
            params string[] propertyNames
        )
        {
            var parseResult = new NullableIntPropertyParseResult();

            foreach (var propertyName in propertyNames)
            {
                if (TryGetPropertyIgnoreCase(element, propertyName, out var valueElement) == false)
                {
                    continue;
                }

                parseResult.PropertyPresent = true;

                if (valueElement.ValueKind == JsonValueKind.Null)
                {
                    parseResult.IsValid = true;
                    return parseResult;
                }

                if (valueElement.ValueKind == JsonValueKind.Number && valueElement.TryGetInt32(out int numberValue))
                {
                    parseResult.IsValid = true;
                    parseResult.Value = numberValue;
                    return parseResult;
                }

                if (valueElement.ValueKind == JsonValueKind.String &&
                    int.TryParse(valueElement.GetString(), out int stringValue))
                {
                    parseResult.IsValid = true;
                    parseResult.Value = stringValue;
                    return parseResult;
                }

                return parseResult;
            }

            parseResult.IsValid = true;
            return parseResult;
        }

        private bool TryGetPropertyIgnoreCase(
            JsonElement element,
            string propertyName,
            out JsonElement value
        )
        {
            if (element.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in element.EnumerateObject())
                {
                    if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase) == true)
                    {
                        value = property.Value;
                        return true;
                    }
                }
            }

            value = default;
            return false;
        }

        private void AddUniqueString(List<string> values, string? rawValue)
        {
            if (string.IsNullOrWhiteSpace(rawValue) == true)
            {
                return;
            }

            string value = rawValue.Trim();
            bool alreadyExists = values.Any(existingValue =>
                string.Equals(existingValue, value, StringComparison.OrdinalIgnoreCase)
            );

            if (alreadyExists == false)
            {
                values.Add(value);
            }
        }

        private class StringListParseResult
        {
            public List<string> Values { get; set; } = new List<string>();
            public bool SourcePresent { get; set; }
            public bool JsonArrayRecognized { get; set; }
            public bool HasInvalidRoot { get; set; }
            public bool HasInvalidItems { get; set; }
            public bool HasMalformedJson { get; set; }
            public long? ErrorLineNumber { get; set; }
            public long? ErrorBytePosition { get; set; }

            public bool HasParseError =>
                HasInvalidRoot || HasInvalidItems || HasMalformedJson;

            public bool HasRecognizedStructure =>
                JsonArrayRecognized && (HasInvalidItems == false || Values.Count > 0);

            public bool IsComplete =>
                SourcePresent && JsonArrayRecognized && HasParseError == false;
        }

        private class CriteriaParseResult
        {
            public List<CandidateCriterionResultDto> Values { get; } = new List<CandidateCriterionResultDto>();
            public bool SourcePresent { get; set; }
            public bool JsonArrayRecognized { get; set; }
            public bool HasInvalidRoot { get; set; }
            public bool HasInvalidItems { get; set; }
            public bool HasMalformedJson { get; set; }
            public long? ErrorLineNumber { get; set; }
            public long? ErrorBytePosition { get; set; }

            public bool HasParseError =>
                HasInvalidRoot || HasInvalidItems || HasMalformedJson;

            public bool HasRecognizedStructure =>
                JsonArrayRecognized && (HasInvalidItems == false || Values.Count > 0);

            public bool IsComplete =>
                SourcePresent && JsonArrayRecognized && HasParseError == false;
        }

        private class AnalysisReasonParseResult
        {
            public bool SourcePresent { get; set; }
            public bool IsPlainText { get; set; }
            public bool IsJsonString { get; set; }
            public bool JsonShapeRecognized { get; set; }
            public bool StrengthsPresent { get; set; }
            public bool StrengthsValid { get; set; }
            public bool WeaknessesPresent { get; set; }
            public bool WeaknessesValid { get; set; }
            public bool SummaryPresent { get; set; }
            public bool SummaryValid { get; set; }
            public bool HasInvalidFields { get; set; }
            public bool HasMalformedJson { get; set; }
            public long? ErrorLineNumber { get; set; }
            public long? ErrorBytePosition { get; set; }

            public bool HasParseError => HasInvalidFields || HasMalformedJson;

            public bool HasUsableStructuredData =>
                (StrengthsPresent && StrengthsValid) ||
                (WeaknessesPresent && WeaknessesValid);

            public bool IsComplete =>
                SourcePresent &&
                JsonShapeRecognized &&
                StrengthsPresent &&
                StrengthsValid &&
                WeaknessesPresent &&
                WeaknessesValid &&
                SummaryPresent &&
                SummaryValid &&
                HasParseError == false;
        }

        private class JsonArrayPropertyParseResult
        {
            public List<string> Values { get; } = new List<string>();
            public bool PropertyPresent { get; set; }
            public bool IsValid { get; set; }
        }

        private class NullableIntPropertyParseResult
        {
            public bool PropertyPresent { get; set; }
            public bool IsValid { get; set; }
            public int? Value { get; set; }
        }

        private class RawCandidateData
        {
            public string ApplicationId { get; set; } = string.Empty;
            public string CandidateId { get; set; } = string.Empty;
            public string CandidateName { get; set; } = string.Empty;
            public string AccountEmail { get; set; } = string.Empty;
            public string CandidatePhone { get; set; } = string.Empty;
            public string ApplicationStatus { get; set; } = string.Empty;
            public DateTime AppliedAt { get; set; }
            public string CvUrl { get; set; } = string.Empty;
            public string? CvEmail { get; set; }
            public string? CvPhone { get; set; }
            public string? Degree { get; set; }
            public string? Major { get; set; }
            public string? University { get; set; }
            public double? YearsOfExperience { get; set; }
            public string? CertificatesJson { get; set; }
            public AIEvaluation? Evaluation { get; set; }
        }

        private class ParsedCandidateData
        {
            public CandidateComparisonItemDto Candidate { get; }
            public List<CandidateCriterionResultDto> ParsedCriteria { get; }

            public ParsedCandidateData(
                CandidateComparisonItemDto candidate,
                List<CandidateCriterionResultDto> parsedCriteria
            )
            {
                Candidate = candidate;
                ParsedCriteria = parsedCriteria;
            }
        }
    }
}
