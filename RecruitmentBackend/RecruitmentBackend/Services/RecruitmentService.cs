using RecruitmentBackend.Controllers;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
using System.Security.Claims;
using System.Threading.Tasks;

namespace RecruitmentBackend.Services
{
    public class RecruitmentService : IRecruitmentService
    {
        private readonly IApplicationService _applicationService;
        private readonly IAiEvaluationService _aiEvaluationService;
        private readonly IInterviewService _interviewService;

        public RecruitmentService(
            IApplicationService applicationService,
            IAiEvaluationService aiEvaluationService,
            IInterviewService interviewService)
        {
            _applicationService = applicationService;
            _aiEvaluationService = aiEvaluationService;
            _interviewService = interviewService;
        }

        public Task<(bool IsSuccess, string Message, object Data)> ApplyJobAsync(ApplyJobRequest request, ClaimsPrincipal user)
        {
            return _applicationService.ApplyJobAsync(request, user);
        }

        public Task<(bool IsSuccess, string Message, object Data)> GetHrApplicationsAsync(
            ClaimsPrincipal user,
            bool includeAiDetails = true,
            string? applicationId = null)
        {
            return _applicationService.GetHrApplicationsAsync(user, includeAiDetails, applicationId);
        }

        public Task<(bool IsSuccess, string Message, object Data)> GetMyApplicationsAsync(ClaimsPrincipal user)
        {
            return _applicationService.GetMyApplicationsAsync(user);
        }

        public Task<(bool IsSuccess, string Message, object Data)> UpdateApplicationStatusAsync(
            string applicationId,
            UpdateApplicationStatusRequest request,
            ClaimsPrincipal user)
        {
            return _applicationService.UpdateApplicationStatusAsync(applicationId, request, user);
        }

        public Task RunAiEvaluationInBackgroundAsync(string applicationId, byte[] cvFileBytes, string fileName, string contentType)
        {
            return _aiEvaluationService.RunAiEvaluationInBackgroundAsync(applicationId, cvFileBytes, fileName, contentType);
        }

        public Task<(bool IsSuccess, string Message, object Data)> RejectApplicationAsync(
            string applicationId,
            RejectApplicationRequest request,
            ClaimsPrincipal user)
        {
            return _applicationService.RejectApplicationAsync(applicationId, request, user);
        }

        public Task<(bool IsSuccess, string Message, object Data)> ReEvaluateApplicationAsync(string applicationId, ClaimsPrincipal user)
        {
            return _aiEvaluationService.ReEvaluateApplicationAsync(applicationId, user);
        }

        public Task<(bool IsSuccess, string Message, object Data)> ScheduleInterviewAsync(
            string applicationId,
            ScheduleInterviewRequest request,
            ClaimsPrincipal user)
        {
            return _interviewService.ScheduleInterviewAsync(applicationId, request, user);
        }

        public Task<(bool IsSuccess, string Message, object Data)> GetInterviewScheduleAsync(
            string applicationId,
            ClaimsPrincipal user)
        {
            return _interviewService.GetInterviewScheduleAsync(applicationId, user);
        }

        public Task<(bool IsSuccess, string Message, object Data)> GetHrInterviewSchedulesAsync(
            ClaimsPrincipal user)
        {
            return _interviewService.GetHrInterviewSchedulesAsync(user);
        }

        public Task<(bool IsSuccess, string Message, object Data)> CancelInterviewScheduleAsync(
            string applicationId,
            ClaimsPrincipal user)
        {
            return _interviewService.CancelInterviewScheduleAsync(applicationId, user);
        }
    }
}
