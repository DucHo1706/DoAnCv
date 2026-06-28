namespace RecruitmentBackend.Constants
{
    public static class ApplicationStatuses
    {
        public const string Applied = "Applied";
        public const string Reviewing = "Reviewing";
        public const string Interview = "Interview";
        public const string Offer = "Offer";
        public const string Rejected = "Rejected";
        public const string Expired = "Expired";
        public const string Withdrawn = "Withdrawn";
        public const string Hired = "Hired";

        public static readonly List<string> AllStatuses = new List<string>
        {
            Applied,
            Reviewing,
            Interview,
            Offer,
            Rejected,
            Expired,
            Withdrawn,
            Hired
        };

        public static readonly List<string> ActiveStatuses = new List<string>
        {
            Applied,
            Reviewing,
            Interview,
            Offer
        };
    }
}