namespace RecruitmentBackend.Constants
{
    public static class AiEvaluationTaskStatuses
    {
        public const string Pending = "Pending";
        public const string Processing = "Processing";
        public const string RetryScheduled = "RetryScheduled";
        public const string Completed = "Completed";
        public const string Failed = "Failed";
        public const string CancelRequested = "CancelRequested";
        public const string Cancelled = "Cancelled";

        public static readonly string[] WaitingStatuses =
        {
            Pending,
            RetryScheduled
        };

        public static readonly string[] ActiveStatuses =
        {
            Pending,
            Processing,
            RetryScheduled,
            CancelRequested
        };
    }
}
