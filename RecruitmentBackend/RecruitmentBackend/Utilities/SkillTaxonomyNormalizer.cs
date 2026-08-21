using System.Globalization;
using System.Text;
using RecruitmentBackend.Models;

namespace RecruitmentBackend.Utilities
{
    public static class SkillTaxonomyNormalizer
    {
        public static string NormalizeKey(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;

            var decomposed = value.Trim().Normalize(NormalizationForm.FormKD);
            var output = new StringBuilder(decomposed.Length + 8);
            var previousWasSpace = true;

            foreach (var character in decomposed)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(character) == UnicodeCategory.NonSpacingMark)
                    continue;

                if (char.IsLetterOrDigit(character))
                {
                    output.Append(char.ToLowerInvariant(character));
                    previousWasSpace = false;
                    continue;
                }

                var symbolWord = character switch
                {
                    '.' => "dot",
                    '#' => "sharp",
                    '+' => "plus",
                    '&' => "and",
                    _ => string.Empty
                };

                if (symbolWord.Length > 0)
                {
                    if (!previousWasSpace) output.Append(' ');
                    output.Append(symbolWord);
                    output.Append(' ');
                    previousWasSpace = true;
                }
                else if (!previousWasSpace)
                {
                    output.Append(' ');
                    previousWasSpace = true;
                }
            }

            return string.Join(' ', output.ToString().Split(
                ' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
        }

        public static Dictionary<string, string> BuildCanonicalMap(IEnumerable<Skill> skills)
        {
            var canonicalMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var skill in skills.Where(item => item.IsApproved && !string.IsNullOrWhiteSpace(item.Name)))
            {
                var canonicalName = skill.Name.Trim().ToLowerInvariant();
                var canonicalKey = NormalizeKey(canonicalName);
                if (canonicalKey.Length > 0) canonicalMap[canonicalKey] = canonicalName;

                foreach (var alias in skill.Aliases)
                {
                    var aliasKey = NormalizeKey(alias.Alias);
                    if (aliasKey.Length > 0) canonicalMap[aliasKey] = canonicalName;
                }
            }

            return canonicalMap;
        }

        public static List<string> Canonicalize(IEnumerable<string>? values, IReadOnlyDictionary<string, string> canonicalMap)
        {
            return (values ?? Array.Empty<string>())
                .Select(NormalizeKey)
                .Where(key => key.Length > 0 && canonicalMap.ContainsKey(key))
                .Select(key => canonicalMap[key])
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(value => value, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        public static Dictionary<string, string> AliasMapForApi(
            IReadOnlyDictionary<string, string> canonicalMap,
            IEnumerable<string> canonicalSkills)
        {
            var canonicalKeys = canonicalSkills
                .Select(NormalizeKey)
                .Where(key => key.Length > 0)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            return canonicalMap
                .Where(pair => !canonicalKeys.Contains(pair.Key))
                .ToDictionary(pair => pair.Key, pair => pair.Value, StringComparer.OrdinalIgnoreCase);
        }
    }
}
