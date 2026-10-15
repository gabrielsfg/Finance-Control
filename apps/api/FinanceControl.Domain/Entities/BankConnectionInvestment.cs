using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// One investment position found in a bank connection and the portfolio position it
    /// feeds.
    /// </summary>
    /// <remarks>
    /// Open Finance reports positions, not operations. The first sync records the position
    /// as one purchase; later syncs record the difference in quantity as a purchase or a
    /// sale, and a redemption as a sale of everything. A position nobody quotes (a CDB, a
    /// fund) lives in a private asset priced by the bank's own figure.
    /// </remarks>
    public class BankConnectionInvestment : OwnedEntity
    {
        public int BankConnectionId { get; set; }

        /// Pluggy's investment id. Unique.
        public string ExternalInvestmentId { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;
        public string? Code { get; set; }
        public string ExternalType { get; set; } = string.Empty;
        public string? ExternalSubtype { get; set; }

        public int? InvestmentId { get; set; }
        public EnumBankInvestmentLinkStatus Status { get; set; } = EnumBankInvestmentLinkStatus.Active;

        /// Last figures the bank reported, in cents (balance is net of taxes).
        public long? Balance { get; set; }
        public long? AmountOriginal { get; set; }
        public decimal? Quantity { get; set; }
        public DateTime? LastSyncedAt { get; set; }

        public BankConnection BankConnection { get; set; } = null!;
        public Investment? Investment { get; set; }
    }
}
