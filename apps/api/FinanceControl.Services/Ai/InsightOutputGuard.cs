using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using FinanceControl.Shared.Dtos.Others.Insight;

namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// Runs between the model response and the user. Rejection is a normal path, not an
    /// exception: rejected text is never shown, never stored, and the caller falls back to
    /// a deterministic sentence built from the same figures.
    /// </summary>
    /// <remarks>
    /// The product promised the lawyer that the analyses are descriptive and never
    /// recommend. A prompt instruction is a request; this class is the enforcement. It is
    /// the difference between a policy the product claims and a policy the product has.
    /// </remarks>
    public static class InsightOutputGuard
    {
        private const int MaxHeadlineLength = 90;
        private const int MaxParagraphLength = 320;
        private const int MaxParagraphs = 4;

        /// <summary>
        /// Brazilian tickers: four letters and one or two digits, optionally with a
        /// fractional-lot F. Anything matching this that the user does not hold is the
        /// model volunteering an asset, which is a recommendation however it is worded.
        /// </summary>
        private static readonly Regex TickerPattern =
            new(@"\b[A-Z]{4}\d{1,2}[A-Z]?\b", RegexOptions.Compiled);

        /// <summary>
        /// Money and percentages: "R$ 1.234,56", "1.234,56", "18,3%", "12%". These are the
        /// claims that must exist in the snapshot. A bare small integer ("nas últimas 3
        /// semanas") is prose and is not checked — see IsCheckableFigure.
        /// </summary>
        private static readonly Regex FigurePattern =
            new(@"R\$\s?\d[\d.,]*|\d[\d.,]*\s?%|\b\d{1,3}(?:\.\d{3})+(?:,\d+)?\b|\b\d+,\d+\b",
                RegexOptions.Compiled);

        public static InsightGuardResult Inspect(
            InsightModelOutputDto output,
            string snapshotJson,
            IReadOnlyCollection<string> ownedTickers)
        {
            if (string.IsNullOrWhiteSpace(output.Headline))
                return InsightGuardResult.Rejected("Empty headline.");

            if (output.Headline.Length > MaxHeadlineLength)
                return InsightGuardResult.Rejected($"Headline exceeds {MaxHeadlineLength} characters.");

            if (output.Paragraphs.Count == 0)
                return InsightGuardResult.Rejected("No paragraphs returned.");

            if (output.Paragraphs.Count > MaxParagraphs)
                return InsightGuardResult.Rejected($"More than {MaxParagraphs} paragraphs returned.");

            foreach (var paragraph in output.Paragraphs)
            {
                if (string.IsNullOrWhiteSpace(paragraph.Text))
                    return InsightGuardResult.Rejected("Empty paragraph.");

                if (paragraph.Text.Length > MaxParagraphLength)
                    return InsightGuardResult.Rejected($"Paragraph exceeds {MaxParagraphLength} characters.");
            }

            var fullText = output.Headline + " " + string.Join(" ", output.Paragraphs.Select(p => p.Text));
            var normalized = Normalize(fullText);

            if (FindTerm(normalized, InsightGuardTerms.RecommendationTerms) is { } recommendation)
                return InsightGuardResult.Rejected($"Recommendation term: \"{recommendation}\".");

            if (FindTerm(normalized, InsightGuardTerms.AdequacyTerms) is { } adequacy)
                return InsightGuardResult.Rejected($"Adequacy judgement: \"{adequacy}\".");

            if (FindTerm(normalized, InsightGuardTerms.OutOfScopeTerms) is { } outOfScope)
                return InsightGuardResult.Rejected($"Out of scope: \"{outOfScope}\".");

            var owned = new HashSet<string>(ownedTickers, StringComparer.OrdinalIgnoreCase);
            foreach (Match match in TickerPattern.Matches(fullText))
            {
                if (!owned.Contains(match.Value))
                    return InsightGuardResult.Rejected($"Ticker not held by the user: {match.Value}.");
            }

            var allowedFigures = CollectFigures(snapshotJson);

            foreach (Match match in FigurePattern.Matches(fullText))
            {
                var figure = NormalizeFigure(match.Value);
                if (!IsCheckableFigure(figure))
                    continue;

                if (!allowedFigures.Contains(figure))
                    return InsightGuardResult.Rejected($"Figure not present in the snapshot: {match.Value.Trim()}.");
            }

            // A paragraph that declares a figure it did not take from the snapshot is the
            // same failure one step earlier, and it shows up even when the prose hides it.
            foreach (var declared in output.Paragraphs.SelectMany(p => p.Figures))
            {
                var figure = NormalizeFigure(declared);
                if (!IsCheckableFigure(figure))
                    continue;

                if (!allowedFigures.Contains(figure))
                    return InsightGuardResult.Rejected($"Declared figure not in the snapshot: {declared}.");
            }

            return InsightGuardResult.Approved();
        }

        /// <summary>
        /// Every money and percentage string anywhere in the snapshot. Walking the JSON
        /// rather than the DTO means a field added later is covered without touching this.
        /// </summary>
        private static HashSet<string> CollectFigures(string snapshotJson)
        {
            var figures = new HashSet<string>(StringComparer.Ordinal);

            using var document = JsonDocument.Parse(snapshotJson);
            Walk(document.RootElement, figures);

            return figures;
        }

        private static void Walk(JsonElement element, HashSet<string> figures)
        {
            switch (element.ValueKind)
            {
                case JsonValueKind.Object:
                    foreach (var property in element.EnumerateObject())
                        Walk(property.Value, figures);
                    break;

                case JsonValueKind.Array:
                    foreach (var item in element.EnumerateArray())
                        Walk(item, figures);
                    break;

                case JsonValueKind.String:
                    var value = element.GetString();
                    if (!string.IsNullOrEmpty(value))
                    {
                        foreach (Match match in FigurePattern.Matches(value))
                            figures.Add(NormalizeFigure(match.Value));
                    }
                    break;

                case JsonValueKind.Number:
                    figures.Add(NormalizeFigure(element.GetRawText()));
                    break;
            }
        }

        /// <summary>
        /// Reduces a figure to what actually has to match: digits, a decimal comma and the
        /// percent sign. Currency symbol, thousands separators and spacing are formatting,
        /// and rejecting on them would fail texts that are perfectly correct.
        /// </summary>
        private static string NormalizeFigure(string raw)
        {
            var builder = new StringBuilder(raw.Length);

            foreach (var character in raw)
            {
                if (char.IsDigit(character) || character == ',' || character == '%')
                    builder.Append(character);
            }

            var normalized = builder.ToString();

            // A trailing ",00" and a bare integer are the same amount written two ways.
            if (normalized.EndsWith(",00", StringComparison.Ordinal))
                normalized = normalized[..^3];

            return normalized;
        }

        /// <summary>
        /// Money and percentages are claims about the user's data and must be verifiable.
        /// A bare integer up to two digits is prose — "nos últimos 3 meses" is not a
        /// financial claim, and demanding it appear in the snapshot would reject good text.
        /// </summary>
        private static bool IsCheckableFigure(string normalized)
        {
            if (normalized.Length == 0)
                return false;

            if (normalized.Contains('%') || normalized.Contains(','))
                return true;

            return normalized.Length > 2;
        }

        private static string? FindTerm(string normalizedText, IEnumerable<string> terms) =>
            terms.FirstOrDefault(term => normalizedText.Contains(term, StringComparison.Ordinal));

        /// <summary>
        /// Lowercase and diacritic-free, so the term list does not need an entry for
        /// "recomendação" and another for "recomendacao".
        /// </summary>
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
