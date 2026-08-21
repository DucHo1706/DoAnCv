namespace RecruitmentBackend.Services
{
    public static class VietnamTimeService
    {
        private static readonly TimeZoneInfo VietnamTimeZone = ResolveVietnamTimeZone();

        public static DateTime NowLocal => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VietnamTimeZone);

        public static DateTime ToLocal(DateTime utcDateTime)
        {
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc), VietnamTimeZone);
        }

        public static (DateTime StartUtc, DateTime EndUtc) GetUtcDayRange(DateTime? vietnamDate = null)
        {
            DateTime localDate = (vietnamDate ?? NowLocal).Date;
            DateTime localStart = DateTime.SpecifyKind(localDate, DateTimeKind.Unspecified);
            DateTime localEnd = localStart.AddDays(1);
            return (
                TimeZoneInfo.ConvertTimeToUtc(localStart, VietnamTimeZone),
                TimeZoneInfo.ConvertTimeToUtc(localEnd, VietnamTimeZone)
            );
        }

        private static TimeZoneInfo ResolveVietnamTimeZone()
        {
            foreach (string id in new[] { "SE Asia Standard Time", "Asia/Ho_Chi_Minh" })
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById(id);
                }
                catch (TimeZoneNotFoundException) { }
                catch (InvalidTimeZoneException) { }
            }

            return TimeZoneInfo.CreateCustomTimeZone("Asia/Ho_Chi_Minh", TimeSpan.FromHours(7), "Việt Nam", "Việt Nam");
        }
    }
}
