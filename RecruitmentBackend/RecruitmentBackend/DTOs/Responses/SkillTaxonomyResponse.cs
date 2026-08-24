namespace RecruitmentBackend.DTOs.Responses
{
    public class SkillTaxonomyResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsApproved { get; set; }
        public List<SkillAliasResponse> Aliases { get; set; } = new();
    }

    public class SkillAliasResponse
    {
        public int Id { get; set; }
        public string Alias { get; set; } = string.Empty;
    }
}
