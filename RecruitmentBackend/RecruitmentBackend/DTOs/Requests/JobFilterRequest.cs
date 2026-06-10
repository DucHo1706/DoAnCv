namespace RecruitmentBackend.DTOs.Requests
{
    public class JobFilterRequest
    {
        public string? Keyword { get; set; }
        public string? Location { get; set; }
        public string? CategoryId { get; set; }
        public string? JobLevelId { get; set; }
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public int PageIndex { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}