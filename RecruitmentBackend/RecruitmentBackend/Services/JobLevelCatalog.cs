using System.Globalization;
using System.Text;

namespace RecruitmentBackend.Services
{
    /// <summary>
    /// Danh mục cấp bậc chuẩn dùng chung cho mọi ngành. Danh mục chỉ biểu diễn
    /// seniority/phạm vi trách nhiệm; loại hợp đồng và hình thức làm việc không
    /// được trộn vào đây.
    /// </summary>
    public static class JobLevelCatalog
    {
        public sealed record Definition(
            string Key,
            string Name,
            string? ParentKey,
            bool IsGroup,
            params string[] Aliases);

        public static IReadOnlyList<Definition> Definitions { get; } = new[]
        {
            new Definition(
                "group-career-entry",
                "Nhóm Khởi đầu nghề nghiệp",
                null,
                true,
                "Nhóm Thực tập & Mới vào nghề"),
            new Definition(
                "group-individual-contributor",
                "Nhóm Chuyên môn cá nhân",
                null,
                true,
                "Nhóm Chuyên viên / Kỹ sư"),
            new Definition(
                "group-frontline-management",
                "Nhóm Quản lý tuyến đầu",
                null,
                true),
            new Definition(
                "group-senior-management",
                "Nhóm Quản lý cấp cao",
                null,
                true,
                "Nhóm Quản lý & Lãnh đạo"),
            new Definition(
                "group-executive",
                "Nhóm Điều hành",
                null,
                true),

            new Definition(
                "intern",
                "Thực tập sinh (Intern)",
                "group-career-entry",
                false,
                "Intern", "Thực tập sinh"),
            new Definition(
                "trainee",
                "Học việc (Trainee / Apprentice)",
                "group-career-entry",
                false,
                "Trainee", "Học việc", "Apprentice", "Trainee / Học việc"),
            new Definition(
                "fresher",
                "Mới tốt nghiệp (Fresher / Entry-level)",
                "group-career-entry",
                false,
                "Fresher", "Entry level", "Entry-level", "Mới tốt nghiệp"),

            new Definition(
                "junior",
                "Junior",
                "group-individual-contributor",
                false,
                "Sơ cấp"),
            new Definition(
                "middle",
                "Middle",
                "group-individual-contributor",
                false,
                "Mid-level", "Intermediate", "Trung cấp"),
            new Definition(
                "senior",
                "Senior",
                "group-individual-contributor",
                false,
                "Cao cấp"),
            new Definition(
                "expert-principal",
                "Chuyên gia (Expert / Principal)",
                "group-individual-contributor",
                false,
                "Expert", "Principal", "Chuyên gia"),

            new Definition(
                "team-lead-supervisor",
                "Trưởng nhóm / Giám sát (Team Lead / Supervisor)",
                "group-frontline-management",
                false,
                "Team Lead", "Team Leader", "Trưởng nhóm", "Supervisor", "Giám sát",
                "Trưởng nhóm (Team Leader)", "Lead/Manager"),

            new Definition(
                "manager",
                "Trưởng phòng / Quản lý (Manager)",
                "group-senior-management",
                false,
                "Manager", "Trưởng phòng", "Quản lý", "Trưởng phòng (Manager)"),
            new Definition(
                "senior-manager",
                "Quản lý cấp cao (Senior Manager)",
                "group-senior-management",
                false,
                "Senior Manager", "Quản lý cấp cao"),
            new Definition(
                "head-of-function",
                "Trưởng bộ phận (Head of Function)",
                "group-senior-management",
                false,
                "Head of Function", "Head of Department", "Trưởng bộ phận"),
            new Definition(
                "director",
                "Giám đốc chức năng (Director)",
                "group-senior-management",
                false,
                "Director", "Giám đốc chức năng", "Giám đốc Kỹ thuật (CTO / Director)"),

            new Definition(
                "vice-president",
                "Phó Tổng giám đốc (Vice President)",
                "group-executive",
                false,
                "Vice President", "VP", "Phó Tổng giám đốc"),
            new Definition(
                "c-level",
                "Lãnh đạo điều hành (C-level)",
                "group-executive",
                false,
                "C-level", "C level", "CEO", "CTO", "CFO", "COO", "Tổng giám đốc"),
        };

        private static readonly IReadOnlyDictionary<string, Definition> DefinitionsByKey =
            Definitions.ToDictionary(item => item.Key, StringComparer.OrdinalIgnoreCase);

        private static readonly IReadOnlyDictionary<string, string> AliasToKey = BuildAliasMap();

        public static Definition? FindDefinition(string? name)
        {
            string normalized = NormalizeName(name);
            return AliasToKey.TryGetValue(normalized, out string? key)
                ? DefinitionsByKey[key]
                : null;
        }

        public static Definition GetDefinition(string key)
        {
            return DefinitionsByKey.TryGetValue(key, out Definition? definition)
                ? definition
                : throw new InvalidOperationException($"Không tìm thấy định nghĩa cấp bậc '{key}'.");
        }

        public static bool AreEquivalent(string? first, string? second)
        {
            Definition? firstDefinition = FindDefinition(first);
            Definition? secondDefinition = FindDefinition(second);
            if (firstDefinition != null || secondDefinition != null)
            {
                return firstDefinition?.Key == secondDefinition?.Key;
            }

            return string.Equals(
                NormalizeName(first),
                NormalizeName(second),
                StringComparison.Ordinal);
        }

        public static string NormalizeName(string? value)
        {
            string decomposed = (value ?? string.Empty).Trim().Normalize(NormalizationForm.FormD);
            StringBuilder builder = new();
            bool previousWasSeparator = false;
            foreach (char character in decomposed)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(character) == UnicodeCategory.NonSpacingMark)
                {
                    continue;
                }

                if (char.IsLetterOrDigit(character))
                {
                    builder.Append(char.ToLowerInvariant(character));
                    previousWasSeparator = false;
                }
                else if (!previousWasSeparator && builder.Length > 0)
                {
                    builder.Append(' ');
                    previousWasSeparator = true;
                }
            }

            return builder.ToString().Trim();
        }

        public static void ValidateDefinitions()
        {
            var duplicateKeys = Definitions
                .GroupBy(item => item.Key, StringComparer.OrdinalIgnoreCase)
                .Where(group => group.Count() > 1)
                .Select(group => group.Key)
                .ToList();
            if (duplicateKeys.Count > 0)
            {
                throw new InvalidOperationException(
                    $"Danh mục cấp bậc trùng mã: {string.Join(", ", duplicateKeys)}.");
            }

            foreach (Definition item in Definitions.Where(item => !item.IsGroup))
            {
                if (string.IsNullOrWhiteSpace(item.ParentKey)
                    || !DefinitionsByKey.TryGetValue(item.ParentKey, out Definition? parent)
                    || !parent.IsGroup)
                {
                    throw new InvalidOperationException(
                        $"Cấp bậc '{item.Name}' không có nhóm cha hợp lệ.");
                }
            }

            _ = AliasToKey;
        }

        private static IReadOnlyDictionary<string, string> BuildAliasMap()
        {
            Dictionary<string, string> aliases = new(StringComparer.Ordinal);
            foreach (Definition definition in Definitions)
            {
                foreach (string name in new[] { definition.Name }.Concat(definition.Aliases))
                {
                    string normalized = NormalizeName(name);
                    if (aliases.TryGetValue(normalized, out string? existingKey)
                        && !string.Equals(existingKey, definition.Key, StringComparison.OrdinalIgnoreCase))
                    {
                        throw new InvalidOperationException(
                            $"Tên/alias cấp bậc '{name}' đang trỏ tới cả '{existingKey}' và '{definition.Key}'.");
                    }

                    aliases[normalized] = definition.Key;
                }
            }

            return aliases;
        }
    }
}
