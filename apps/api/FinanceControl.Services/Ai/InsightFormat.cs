using System.Globalization;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// Formats every figure that goes into a snapshot.
    /// </summary>
    /// <remarks>
    /// Centralised on purpose: the guard verifies the text by matching figures against the
    /// snapshot, so both sides have to agree on how a number is written. Two formatters
    /// would mean the guard rejecting text that is perfectly correct.
    /// </remarks>
    public static class InsightFormat
    {
        private static readonly CultureInfo Culture = new("pt-BR");

        /// <summary>Cents in, "R$ 1.234,56" out.</summary>
        public static string Money(long cents) =>
            (cents / 100m).ToString("C2", Culture);

        public static string Money(int cents) => Money((long)cents);

        /// <summary>Share of a total, as "18,3%". Zero total yields "0%" rather than dividing.</summary>
        public static string Percent(long part, long total)
        {
            if (total == 0)
                return "0%";

            var value = (decimal)part / total * 100m;
            return value.ToString("0.#", Culture) + "%";
        }

        /// <summary>
        /// How much current sits above or below a reference, as "18,3% acima". The words
        /// are here rather than in the prompt so the direction cannot be flipped by the
        /// model rewriting the sentence.
        /// </summary>
        public static string Change(long current, long reference)
        {
            if (reference == 0)
                return current == 0 ? "sem variação" : "sem base de comparação";

            var change = (decimal)(current - reference) / Math.Abs(reference) * 100m;
            var magnitude = Math.Abs(change).ToString("0.#", Culture);

            return change switch
            {
                > 0 => magnitude + "% acima",
                < 0 => magnitude + "% abaixo",
                _ => "igual à média"
            };
        }

        /// <summary>Signed percentage, for a fall that has to read as a fall: "-22,4%".</summary>
        public static string SignedPercent(decimal value) =>
            value.ToString("0.#", Culture) + "%";

        public static string Decimal(decimal value) =>
            value.ToString("0.#", Culture);

        public static string MonthLabel(int year, int month) =>
            new DateOnly(year, month, 1).ToString("MMMM 'de' yyyy", Culture);

        /// <summary>Shown to the user inside generated text, so Portuguese.</summary>
        public static string AssetClass(EnumAssetType type) => type switch
        {
            EnumAssetType.Acao => "ações",
            EnumAssetType.FundoInvestimento => "fundos de investimento",
            EnumAssetType.FII => "fundos imobiliários",
            EnumAssetType.Cripto => "criptoativos",
            EnumAssetType.Stock => "ações no exterior",
            EnumAssetType.Reit => "REITs",
            EnumAssetType.BDR => "BDRs",
            EnumAssetType.ETF => "ETFs",
            EnumAssetType.ETFInternacional => "ETFs internacionais",
            EnumAssetType.TesouroDireto => "Tesouro Direto",
            EnumAssetType.RendaFixa => "renda fixa",
            EnumAssetType.Index => "índices",
            EnumAssetType.Moeda => "moedas",
            _ => "outros"
        };

        public static string RiskProfile(EnumRiskClassification classification) => classification switch
        {
            EnumRiskClassification.Conservative => "conservador",
            EnumRiskClassification.Moderate => "moderado",
            _ => "arrojado"
        };
    }
}
