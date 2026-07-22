using System.Collections.Generic;

namespace RecruitmentBackend.DTOs.Requests
{
    public class SemanticSearchRequest
    {
        public string Query { get; set; } = string.Empty;
        public List<SemanticSearchJobItemDto> Jobs { get; set; } = new List<SemanticSearchJobItemDto>();
    }

    public class SemanticSearchJobItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
    }
}
