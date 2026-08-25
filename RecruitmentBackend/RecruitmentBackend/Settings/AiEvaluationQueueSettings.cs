namespace RecruitmentBackend.Settings
{
    public class AiEvaluationQueueSettings
    {
        public const string SectionName = "AiEvaluationQueue";

        public int GracePeriodSeconds { get; set; } = 30;
        public int PollIntervalSeconds { get; set; } = 2;
        public int MaxAttempts { get; set; } = 3;
        public int StaleProcessingMinutes { get; set; } = 10;
    }
}
