using System.Globalization;
using System.Text;

namespace FinanceControl.Shared.Helpers
{
    public static class TextNormalization
    {
        /// <summary>
        /// Collapses a user-typed name to the key two names are compared by: accent-free,
        /// lowercase, and stripped of everything that is not a letter or digit.
        /// "Férias 2026", "ferias 2026" and "FERIAS-2026" all become "ferias2026".
        /// </summary>
        /// <remarks>
        /// Deliberately matches <c>normalizeSearch</c> on the web, so the suggestion the
        /// user sees and the row the server reuses are decided by the same rule. If one
        /// side changes, the other has to change with it.
        /// </remarks>
        public static string ToComparisonKey(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return string.Empty;

            var decomposed = value.Trim().Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder(decomposed.Length);

            foreach (var character in decomposed)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(character) == UnicodeCategory.NonSpacingMark)
                    continue;

                if (char.IsLetterOrDigit(character))
                    builder.Append(char.ToLowerInvariant(character));
            }

            return builder.ToString();
        }
    }
}
