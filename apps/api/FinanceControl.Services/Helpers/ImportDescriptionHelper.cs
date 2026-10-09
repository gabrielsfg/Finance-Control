using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace FinanceControl.Services.Helpers
{
    /// <summary>
    /// Deterministic reading of bank statement descriptions: installment markers and the
    /// key a description is matched against the user's history by.
    /// </summary>
    /// <remarks>
    /// This used to be the model's job. Doing it here means an import works the same for
    /// every plan and with the AI switched off, and the model only sees the rows the
    /// history could not place.
    /// </remarks>
    public static class ImportDescriptionHelper
    {
        /// <summary>"Parcela 3/12", "PARC 03/12", "3 de 12", or a trailing "03/12".</summary>
        private static readonly Regex InstallmentPatterns = new(
            @"(?:parc(?:ela)?\.?\s*(?<n>\d{1,2})\s*(?:/|de)\s*(?<t>\d{1,2}))|(?:(?<n>\d{1,2})\s+de\s+(?<t>\d{1,2})\b)|(?:\b(?<n>\d{1,2})/(?<t>\d{1,2})\s*$)",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex Digits = new(@"\d+", RegexOptions.Compiled);
        private static readonly Regex NonLetters = new(@"[^a-z ]+", RegexOptions.Compiled);
        private static readonly Regex Spaces = new(@"\s+", RegexOptions.Compiled);

        /// <summary>
        /// Words that say how the money moved rather than where it went. Left in, every
        /// "PIX ENVIADO ..." row would match every other one.
        /// </summary>
        private static readonly HashSet<string> NoiseWords =
        [
            "pix", "enviado", "recebido", "ted", "doc", "transf", "transferencia",
            "compra", "pagamento", "pagto", "pag", "debito", "credito", "cartao",
            "parc", "parcela", "de", "da", "do", "em", "no", "na", "com"
        ];

        /// <summary>
        /// The installment a description declares, when it declares one. A trailing
        /// "25/09" is a date, not "25 of 9": the number must not exceed the total and the
        /// total must be at least 2.
        /// </summary>
        public static (int Number, int Total)? DetectInstallment(string? description)
        {
            if (string.IsNullOrWhiteSpace(description))
                return null;

            var match = InstallmentPatterns.Match(description);
            if (!match.Success)
                return null;

            var number = int.Parse(match.Groups["n"].Value, CultureInfo.InvariantCulture);
            var total = int.Parse(match.Groups["t"].Value, CultureInfo.InvariantCulture);

            if (total < 2 || number < 1 || number > total)
                return null;

            return (number, total);
        }

        /// <summary>
        /// The words of a description that identify the counterparty: accent-free,
        /// lowercase, without numbers, punctuation or payment-method noise.
        /// "PIX ENVIADO Padaria São João 25/09" becomes "padaria sao joao".
        /// </summary>
        public static string ToMatchKey(string? description)
        {
            if (string.IsNullOrWhiteSpace(description))
                return string.Empty;

            var decomposed = description.Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder(decomposed.Length);
            foreach (var character in decomposed)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
                    builder.Append(char.ToLowerInvariant(character));
            }

            var text = Digits.Replace(builder.ToString(), " ");
            text = NonLetters.Replace(text, " ");

            var words = Spaces.Split(text.Trim())
                .Where(w => w.Length > 1 && !NoiseWords.Contains(w));

            return string.Join(' ', words);
        }

        /// <summary>The first words of the match key — a looser fallback for merchants whose suffix varies.</summary>
        public static string ToPrefixKey(string matchKey, int words = 2)
        {
            if (string.IsNullOrEmpty(matchKey))
                return string.Empty;

            return string.Join(' ', matchKey.Split(' ').Take(words));
        }
    }
}
