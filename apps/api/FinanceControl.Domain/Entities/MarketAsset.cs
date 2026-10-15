using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    // Global market data for an asset (from Brapi). Not owned by any user —
    // the same PETR4 row is shared by every user who holds it.
    public class MarketAsset : BaseEntity
    {
        public string Ticker { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? CoinName { get; set; }
        public EnumAssetType AssetType { get; set; }
        public long CurrentPrice { get; set; }
        public DateTime? LastPriceUpdate { get; set; }
        public string? LogoUrl { get; set; }
        public string Currency { get; set; } = "BRL";

        /// <summary>
        /// Set on an asset that belongs to one user — a bank position imported through Open
        /// Finance (a CDB, a fund) that no market quotes. Private assets never appear in the
        /// market screens or searches and are never priced by Brapi; the bank sync prices
        /// them. No foreign key: the rows are removed with the user's data explicitly.
        /// </summary>
        public int? OwnerUserId { get; set; }

        public ICollection<MarketPriceHistory> PriceHistory { get; set; } = [];
        public ICollection<MarketPriceIntraday> PriceIntraday { get; set; } = [];
        public ICollection<Investment> Investments { get; set; } = [];
        public MarketAssetFundamentals? Fundamentals { get; set; }
    }
}
