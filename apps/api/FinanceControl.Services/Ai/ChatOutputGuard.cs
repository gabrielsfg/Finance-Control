using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// The chat counterpart of <see cref="InsightOutputGuard"/>: runs on the final answer
    /// before the user sees it and rejects investment advice.
    /// </summary>
    /// <remarks>
    /// The insight term list cannot be reused as-is — a chat that registers purchases says
    /// "compra" and "venda" all the time. So the rules here target advice about financial
    /// products specifically, and a ticker check that allows every ticker the user holds,
    /// mentioned or the tools returned.
    /// </remarks>
    public static class ChatOutputGuard
    {
        /// <summary>Advice phrases, matched on lowercase accent-free text.</summary>
        private static readonly string[] AdviceTerms =
        [
            "recomendo que", "recomendo comprar", "recomendo vender", "recomendo investir",
            "eu recomendaria", "minha recomendacao", "recomendo o ", "recomendo a ",
            "sugiro que voce compre", "sugiro que voce venda", "sugiro que voce invista",
            "sugiro investir", "sugiro comprar", "sugiro vender", "sugiro aportar",
            "voce deveria comprar", "voce deveria vender", "voce deveria investir",
            "voce deveria aportar", "voce deveria resgatar",
            "compre acoes", "compre cotas", "venda suas acoes", "venda suas cotas",
            "invista em ", "vale a pena investir", "vale mais a pena investir",
            "melhor investimento para voce", "o melhor investimento e",
            "e o investimento ideal", "investimento mais adequado", "mais adequado para o seu perfil",
            "hora de comprar", "hora de vender", "bom momento para comprar", "bom momento para vender"
        ];

        private static readonly Regex TickerPattern =
            new(@"\b[A-Z]{4}\d{1,2}[A-Z]?\b", RegexOptions.Compiled);

        public static InsightGuardResult Inspect(string answer, IReadOnlyCollection<string> allowedTickers)
        {
            if (string.IsNullOrWhiteSpace(answer))
                return InsightGuardResult.Approved();

            var normalized = Normalize(answer);
            var advice = AdviceTerms.FirstOrDefault(term => normalized.Contains(term, StringComparison.Ordinal));
            if (advice is not null)
                return InsightGuardResult.Rejected($"Advice term: \"{advice.Trim()}\".");

            var allowed = new HashSet<string>(allowedTickers, StringComparer.OrdinalIgnoreCase);
            foreach (Match match in TickerPattern.Matches(answer))
            {
                if (!allowed.Contains(match.Value))
                    return InsightGuardResult.Rejected($"Ticker volunteered by the model: {match.Value}.");
            }

            return InsightGuardResult.Approved();
        }

        /// <summary>Every ticker-shaped token in a text — used to collect what the user and the tools mentioned.</summary>
        public static IEnumerable<string> ExtractTickers(string? text) =>
            string.IsNullOrEmpty(text)
                ? []
                : TickerPattern.Matches(text.ToUpperInvariant()).Select(m => m.Value);

        private static string Normalize(string text)
        {
            var decomposed = text.ToLowerInvariant().Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder(decomposed.Length);

            foreach (var character in decomposed)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
                    builder.Append(character);
            }

            return builder.ToString().Normalize(NormalizationForm.FormC);
        }
    }
}
