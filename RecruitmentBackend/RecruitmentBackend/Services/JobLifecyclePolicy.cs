using System.Linq.Expressions;
using RecruitmentBackend.Models;

namespace RecruitmentBackend.Services
{
    public static class JobLifecyclePolicy
    {
        public const string Recruiting = "Recruiting";
        public const string Scheduled = "Scheduled";
        public const string Expired = "Expired";
        public const string Pending = "Pending";
        public const string Rejected = "Rejected";
        public const string Closed = "Closed";
        public const string Archived = "Archived";
        public const string Flagged = "Flagged";

        public static DateTime TodayVietnam => VietnamTimeService.NowLocal.Date;

        public static Expression<Func<JobPosting, bool>> IsRecruitingOn(DateTime vietnamDate)
        {
            DateTime date = vietnamDate.Date;
            return job =>
                job.Status == "Published" &&
                (!job.StartDate.HasValue || job.StartDate.Value.Date <= date) &&
                job.Deadline.Date >= date;
        }

        public static bool IsExpired(JobPosting job, DateTime? vietnamDate = null)
        {
            return job.Deadline.Date < (vietnamDate ?? TodayVietnam).Date;
        }

        public static bool IsRecruiting(JobPosting job, DateTime? vietnamDate = null)
        {
            DateTime date = (vietnamDate ?? TodayVietnam).Date;
            return job.Status == "Published" &&
                   (!job.StartDate.HasValue || job.StartDate.Value.Date <= date) &&
                   job.Deadline.Date >= date;
        }

        public static string Resolve(JobPosting job, DateTime? vietnamDate = null)
        {
            DateTime date = (vietnamDate ?? TodayVietnam).Date;

            if (job.Status == "Pending") return Pending;
            if (job.Status == "Rejected") return Rejected;
            if (job.Status == "Flagged") return Flagged;
            if (job.Status == "Archived") return Archived;

            if ((job.Status == "Published" || job.Status == "Closed") && job.Deadline.Date < date)
            {
                return Expired;
            }

            if (job.Status == "Closed" || job.Status == "Locked") return Closed;
            if (job.Status == "Published" && job.StartDate.HasValue && job.StartDate.Value.Date > date)
            {
                return Scheduled;
            }

            return job.Status == "Published" ? Recruiting : job.Status;
        }
    }
}
