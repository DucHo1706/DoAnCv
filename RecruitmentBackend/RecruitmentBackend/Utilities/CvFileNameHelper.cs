using System.Text.RegularExpressions;

namespace RecruitmentBackend.Utilities;

public static partial class CvFileNameHelper
{
    [GeneratedRegex("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}[_-]+")]
    private static partial Regex StoragePrefixRegex();

    public static string GetDisplayName(string? filePathOrName, string fallback = "CV")
    {
        if (string.IsNullOrWhiteSpace(filePathOrName)) return fallback;

        string fileName;
        if (Uri.TryCreate(filePathOrName, UriKind.Absolute, out var absoluteUri)
            && absoluteUri.Scheme is "http" or "https")
        {
            fileName = Path.GetFileName(Uri.UnescapeDataString(absoluteUri.AbsolutePath));
        }
        else
        {
            fileName = Path.GetFileName(Uri.UnescapeDataString(filePathOrName));
        }

        var displayName = StoragePrefixRegex().Replace(fileName, string.Empty).Trim();
        return string.IsNullOrWhiteSpace(displayName) ? fallback : displayName;
    }
}
