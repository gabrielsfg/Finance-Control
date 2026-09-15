using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class CreateInvestmentTransactionRequestDto
    {
        public string Ticker { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public EnumAssetType AssetType { get; set; }
        public string? Broker { get; set; }
        public EnumInvestmentOperation Operation { get; set; }
        public DateOnly Date { get; set; }
        public decimal Quantity { get; set; }
        public long UnitPrice { get; set; }
        public long OtherCosts { get; set; }
        public int AccountId { get; set; }

        /// <summary>
        /// Whether the operation also moves money in the chosen account.
        /// </summary>
        /// <remarks>
        /// False when registering a position the user already held — the purchase happened
        /// months ago and its cash movement is either already in the ledger or predates
        /// it. Creating one anyway invents an expense on a date the balance never saw.
        /// Defaults to true so an omitted field keeps the original behaviour.
        /// </remarks>
        public bool CreateLinkedTransaction { get; set; } = true;

        /// <summary>
        /// Whether the cash movement counts against the active budget. On by default: a
        /// contribution is planned spending like any other line of the budget, and leaving
        /// it out made the budget under-report what actually left the account.
        /// </summary>
        public bool IncludeInBudget { get; set; } = true;

        /// <summary>Tags for the cash movement, same names the transaction form uses.</summary>
        public List<string> Tags { get; set; } = [];

        /// <summary>
        /// Register the operation against a NEW asset even when the ticker is already
        /// taken, by suffixing it (CDB → CDB-2). Fixed income is the reason: every CDB is
        /// a different contract with its own rate and maturity, and folding a second one
        /// into the first position averages two unrelated investments together.
        /// </summary>
        public bool ForceNewAsset { get; set; }

        /// <summary>
        /// For fixed income only: what the position earns against, since nobody quotes a
        /// CDB. Null leaves the position valued at its purchase price.
        /// </summary>
        public EnumYieldIndex? YieldIndex { get; set; }

        /// <summary>The rate paired with <see cref="YieldIndex"/> — 110 for "110% do CDI".</summary>
        public decimal? YieldRatePct { get; set; }

        /// <summary>Optional maturity, for the user's own reference.</summary>
        public DateOnly? MaturityDate { get; set; }
    }
}
