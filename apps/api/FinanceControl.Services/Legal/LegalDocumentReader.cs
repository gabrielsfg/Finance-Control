using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Services.Legal
{
    /// <summary>
    /// Reads the legal texts embedded in this assembly. Files are named
    /// <c>{Type}.v{Version}.md</c> — <c>PrivacyPolicy.v1.md</c>, <c>TermsOfUse.v2.md</c> —
    /// and a file that does not follow it fails loudly at startup rather than being
    /// skipped: a legal document silently missing is worse than the app not starting.
    /// </summary>
    public static class LegalDocumentReader
    {
        private const string ResourcePrefix = "FinanceControl.Services.Legal.Content.";
        private const string ResourceSuffix = ".md";

        public static IReadOnlyList<LegalDocumentFile> ReadAll()
        {
            var assembly = typeof(LegalDocumentReader).Assembly;

            var names = assembly.GetManifestResourceNames()
                .Where(n => n.StartsWith(ResourcePrefix, StringComparison.Ordinal)
                         && n.EndsWith(ResourceSuffix, StringComparison.Ordinal))
                .ToList();

            if (names.Count == 0)
                throw new InvalidOperationException(
                    "No legal documents are embedded in FinanceControl.Services. Expected markdown files " +
                    "under Legal/Content — check the EmbeddedResource item in the .csproj.");

            return names.Select(name => Read(assembly, name)).ToList();
        }

        private static LegalDocumentFile Read(Assembly assembly, string resourceName)
        {
            // "FinanceControl.Services.Legal.Content.PrivacyPolicy.v1.md" → "PrivacyPolicy.v1"
            var fileName = resourceName[ResourcePrefix.Length..^ResourceSuffix.Length];
            var parts = fileName.Split('.');

            if (parts.Length != 2)
                throw new InvalidOperationException(
                    $"Legal document '{fileName}.md' does not follow the '{{Type}}.v{{Version}}.md' naming convention.");

            if (!Enum.TryParse<EnumLegalDocumentType>(parts[0], ignoreCase: false, out var type))
                throw new InvalidOperationException(
                    $"Legal document '{fileName}.md' names an unknown type '{parts[0]}'. " +
                    $"Valid types: {string.Join(", ", Enum.GetNames<EnumLegalDocumentType>())}.");

            if (parts[1].Length < 2 || parts[1][0] != 'v' || !int.TryParse(parts[1][1..], out var version) || version < 1)
                throw new InvalidOperationException(
                    $"Legal document '{fileName}.md' has an invalid version segment '{parts[1]}'. Expected 'v1', 'v2', …");

            using var stream = assembly.GetManifestResourceStream(resourceName)
                ?? throw new InvalidOperationException($"Could not open embedded resource '{resourceName}'.");
            using var reader = new StreamReader(stream, Encoding.UTF8);
            var content = reader.ReadToEnd();

            // Line endings are normalised before hashing so a checkout with different git
            // autocrlf settings does not look like tampered text.
            var normalised = content.Replace("\r\n", "\n");

            return new LegalDocumentFile(type, version, normalised, Hash(normalised));
        }

        public static string Hash(string content) =>
            Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(content))).ToLowerInvariant();
    }
}
