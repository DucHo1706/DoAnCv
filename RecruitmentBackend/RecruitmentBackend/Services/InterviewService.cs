using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
using RecruitmentBackend.Constants;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace RecruitmentBackend.Services
{
    public class InterviewService : IInterviewService
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;

        public InterviewService(AppDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<(bool IsSuccess, string Message, object Data)> ScheduleInterviewAsync(
            string applicationId,
            ScheduleInterviewRequest request,
            ClaimsPrincipal user)
        {
            try
            {
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrWhiteSpace(accountId))
                {
                    return (false, "Không xác định được tài khoản đang đăng nhập.", null);
                }

                var recruiter = await _context.Recruiters
                    .FirstOrDefaultAsync(r => r.AccountID == accountId);

                if (recruiter == null)
                {
                    return (false, "Không tìm thấy thông tin Nhà tuyển dụng.", null);
                }

                var application = await _context.Applications
                    .Include(a => a.CandidateCV)
                    .Include(a => a.AIEvaluation)
                    .FirstOrDefaultAsync(a => a.ApplicationID == applicationId);

                if (application == null)
                {
                    return (false, "Không tìm thấy hồ sơ ứng tuyển.", null);
                }

                var job = await _context.JobPostings
                    .FirstOrDefaultAsync(j => j.JobID == application.JobID);

                if (job == null)
                {
                    return (false, "Không tìm thấy tin tuyển dụng của hồ sơ này.", null);
                }

                if (job.RecruiterID != recruiter.RecruiterID)
                {
                    return (false, "Bạn không có quyền cập nhật hồ sơ ứng tuyển này.", null);
                }

                // Cập nhật trạng thái sang "Interview"
                application.Status = ApplicationStatuses.Interview;

                // Tạo hoặc cập nhật lịch phỏng vấn
                var schedule = await _context.InterviewSchedules
                    .FirstOrDefaultAsync(s => s.ApplicationID == applicationId);

                if (schedule == null)
                {
                    schedule = new InterviewSchedule
                    {
                        ApplicationID = applicationId,
                        InterviewDate = request.InterviewDate,
                        Format = request.Format,
                        LocationOrLink = request.LocationOrLink,
                        MeetingID = request.MeetingID,
                        Passcode = request.Passcode,
                        Notes = request.Notes
                    };
                    _context.InterviewSchedules.Add(schedule);
                }
                else
                {
                    schedule.InterviewDate = request.InterviewDate;
                    schedule.Format = request.Format;
                    schedule.LocationOrLink = request.LocationOrLink;
                    schedule.MeetingID = request.MeetingID;
                    schedule.Passcode = request.Passcode;
                    schedule.Notes = request.Notes;
                }

                await _context.SaveChangesAsync();

                // Trigger notification to candidate
                try
                {
                    var candidate = await _context.Candidates.FindAsync(application.CandidateCV.CandidateID);
                    if (candidate != null)
                    {
                        string positionName = "Chưa cập nhật";
                        if (job != null)
                        {
                            var position = await _context.Positions.FindAsync(job.PositionID);
                            if (position != null) positionName = position.PositionName;
                        }

                        await _notificationService.CreateNotificationAsync(
                            candidate.AccountID,
                            "Lịch hẹn phỏng vấn mới",
                            $"Nhà tuyển dụng đã lên lịch phỏng vấn cho vị trí {positionName} lúc {request.InterviewDate.ToString("dd/MM/yyyy HH:mm")}",
                            "/candidate/application-status"
                        );
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Lỗi gửi thông báo lịch phỏng vấn: " + ex.Message);
                }

                var dataToReturn = new
                {
                    applicationId = application.ApplicationID,
                    status = application.Status,
                    schedule = new
                    {
                        scheduleId = schedule.ScheduleID,
                        interviewDate = schedule.InterviewDate,
                        format = schedule.Format,
                        locationOrLink = schedule.LocationOrLink,
                        notes = schedule.Notes
                    }
                };

                return (true, "Lập lịch phỏng vấn và gửi email thành công.", dataToReturn);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi lập lịch phỏng vấn: " + ex.Message, null);
            }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> GetInterviewScheduleAsync(
            string applicationId,
            ClaimsPrincipal user)
        {
            try
            {
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrWhiteSpace(accountId))
                {
                    return (false, "Không xác định được tài khoản đang đăng nhập.", null);
                }

                var schedule = await _context.InterviewSchedules
                    .FirstOrDefaultAsync(s => s.ApplicationID == applicationId);

                if (schedule == null)
                {
                    return (false, "Hồ sơ này chưa được lập lịch phỏng vấn.", null);
                }

                var dataToReturn = new
                {
                    scheduleId = schedule.ScheduleID,
                    applicationId = schedule.ApplicationID,
                    interviewDate = schedule.InterviewDate,
                    format = schedule.Format,
                    locationOrLink = schedule.LocationOrLink,
                    meetingId = schedule.MeetingID,
                    passcode = schedule.Passcode,
                    notes = schedule.Notes,
                    createdAt = schedule.CreatedAt
                };

                return (true, "Lấy lịch phỏng vấn thành công.", dataToReturn);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi lấy lịch phỏng vấn: " + ex.Message, null);
            }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> GetHrInterviewSchedulesAsync(ClaimsPrincipal user)
        {
            try
            {
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrWhiteSpace(accountId))
                {
                    return (false, "Không xác định được tài khoản đang đăng nhập.", null);
                }

                var recruiter = await _context.Recruiters
                    .FirstOrDefaultAsync(r => r.AccountID == accountId);

                if (recruiter == null)
                {
                    return (false, "Không tìm thấy thông tin Nhà tuyển dụng.", null);
                }

                var schedules = await _context.InterviewSchedules
                    .Include(s => s.Application)
                        .ThenInclude(a => a.CandidateCV)
                    .Include(s => s.Application)
                        .ThenInclude(a => a.JobPosting)
                    .Where(s => s.Application.JobPosting.RecruiterID == recruiter.RecruiterID)
                    .OrderBy(s => s.InterviewDate)
                    .ToListAsync();

                var listToReturn = new List<object>();
                foreach (var s in schedules)
                {
                    var candidate = await _context.Candidates
                        .FirstOrDefaultAsync(c => c.CandidateID == s.Application.CandidateCV.CandidateID);

                    var position = await _context.Positions
                        .FirstOrDefaultAsync(p => p.PositionID == s.Application.JobPosting.PositionID);

                    listToReturn.Add(new
                    {
                        scheduleId = s.ScheduleID,
                        applicationId = s.ApplicationID,
                        interviewDate = s.InterviewDate,
                        format = s.Format,
                        locationOrLink = s.LocationOrLink,
                        meetingId = s.MeetingID,
                        passcode = s.Passcode,
                        notes = s.Notes,
                        candidateName = candidate?.FullName ?? "Chưa rõ",
                        jobTitle = position?.PositionName ?? "Chưa rõ",
                        appliedAt = s.Application.AppliedAt,
                        aiScore = s.Application.AIEvaluation?.FitScore ?? 0,
                        classification = s.Application.AIEvaluation?.Classification ?? "Đạt yêu cầu",
                        recipientEmail = candidate?.Account?.Email ?? ""
                    });
                }

                return (true, "Lấy danh sách lịch phỏng vấn thành công.", listToReturn);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi lấy danh sách lịch phỏng vấn: " + ex.Message, null);
            }
        }

        public async Task<(bool IsSuccess, string Message, object Data)> CancelInterviewScheduleAsync(string applicationId, ClaimsPrincipal user)
        {
            try
            {
                string accountId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrWhiteSpace(accountId))
                {
                    return (false, "Không xác định được tài khoản đang đăng nhập.", null);
                }

                var recruiter = await _context.Recruiters
                    .FirstOrDefaultAsync(r => r.AccountID == accountId);

                if (recruiter == null)
                {
                    return (false, "Không tìm thấy thông tin Nhà tuyển dụng.", null);
                }

                var application = await _context.Applications
                    .Include(a => a.JobPosting)
                    .FirstOrDefaultAsync(a => a.ApplicationID == applicationId);

                if (application == null)
                {
                    return (false, "Không tìm thấy đơn ứng tuyển.", null);
                }

                if (application.JobPosting.RecruiterID != recruiter.RecruiterID)
                {
                    return (false, "Bạn không có quyền hủy lịch phỏng vấn của đơn ứng tuyển này.", null);
                }

                var schedule = await _context.InterviewSchedules
                    .FirstOrDefaultAsync(s => s.ApplicationID == applicationId);

                if (schedule == null)
                {
                    return (false, "Đơn ứng tuyển này không có lịch phỏng vấn để hủy.", null);
                }

                _context.InterviewSchedules.Remove(schedule);
                application.Status = "Reviewed";

                await _context.SaveChangesAsync();

                // Trigger notification to candidate
                try
                {
                    var cv = await _context.CandidateCVs.FindAsync(application.CVID);
                    if (cv != null)
                    {
                        var candidate = await _context.Candidates.FindAsync(cv.CandidateID);
                        if (candidate != null)
                        {
                            string positionName = "Chưa cập nhật";
                            var position = await _context.Positions.FindAsync(application.JobPosting.PositionID);
                            if (position != null) positionName = position.PositionName;

                            await _notificationService.CreateNotificationAsync(
                                candidate.AccountID,
                                "Lịch phỏng vấn đã bị hủy",
                                $"Lịch hẹn phỏng vấn cho vị trí {positionName} đã bị nhà tuyển dụng hủy.",
                                "/candidate/application-status"
                            );
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Lỗi gửi thông báo hủy lịch: " + ex.Message);
                }

                return (true, "Đã hủy lịch phỏng vấn và đưa hồ sơ về trạng thái xem xét thành công.", null);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi khi hủy lịch phỏng vấn: " + ex.Message, null);
            }
        }
    }
}
