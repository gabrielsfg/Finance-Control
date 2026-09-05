using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Investment
{
    public class InvestmentDto
    {
        public int Id { get; set; }
        public string Ticker { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public EnumAssetType AssetType { get; set; }
        public string AssetClass { get; set; } = string.Empty;
        public string? Broker { get; set; }
        public decimal CurrentQuantity { get; set; }
        public long AveragePrice { get; set; }
        public long CurrentPrice { get; set; }
        public long CurrentValue { get; set; }
        public long TotalInvested { get; set; }
        public long TotalReturn { get; set; }
        public decimal TotalReturnPercent { get; set; }
        public long? PreviousClose { get; set; }
        public long DayChangeAbs { get; set; }
        public decimal DayChangePct { get; set; }
        public DateTime? LastPriceUpdate { get; set; }
        public DateOnly? MaturityDate { get; set; }
        public decimal? ExpectedYieldPct { get; set; }
        public EnumYieldIndex? YieldIndex { get; set; }
        public int AccountId { get; set; }
        public string? LogoUrl { get; set; }
        public string Currency { get; set; } = "BRL";
    }
}
