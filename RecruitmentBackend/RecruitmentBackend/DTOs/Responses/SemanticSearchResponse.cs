using System.Collections.Generic;

namespace RecruitmentBackend.DTOs.Responses
{
    public class SemanticSearchResponse
    {
        public List<SemanticSearchResultItemDto> Results { get; set; } = new List<SemanticSearchResultItemDto>();
    }

    public class SemanticSearchResultItemDto
    {
        public string Id { get; set; } = string.Empty;
        public double Score { get; set; }
    }
}
