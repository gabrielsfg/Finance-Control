using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Export
{
    /// <summary>
    /// A position. The ticker and asset type are copied in because market data itself is
    /// shared reference data, not personal data — without them the position would export
    /// as a number pointing at an id the user cannot resolve.
    /// </summary>
    public class ExportInvestmentDto
    {
        public int Id { get; set; }
        public string Ticker { get; set; } = string.Empty;
        public string AssetName { get; set; } = string.Empty;
        public EnumAssetType AssetType { get; set; }
        public string? Broker { get; set; }
        public decimal CurrentQuantity { get; set; }
        public long AveragePrice { get; set; }
        public DateOnly? MaturityDate { get; set; }
        public decimal? ExpectedYieldPct { get; set; }
        public int AccountId { get; set; }
        public List<ExportInvestmentTransactionDto> Transactions { get; set; } = [];
        public List<ExportInvestmentDividendDto> Dividends { get; set; } = [];
        public DateTime CreatedAt { get; set; }
    }
}
