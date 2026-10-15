namespace FinanceControl.Services.Pluggy
{
    /// <summary>
    /// One investment position as Pluggy reports it: the position today, not its history.
    /// </summary>
    public class PluggyInvestment
    {
        public string Id { get; set; } = string.Empty;
        public string? ItemId { get; set; }
        public string? Name { get; set; }

        /// The exchange ticker for listed assets (PETR4, BOVA11), when the bank sends it.
        public string? Code { get; set; }
        public string? Isin { get; set; }

        /// FIXED_INCOME, SECURITY, MUTUAL_FUND, EQUITY, ETF, COE or OTHER.
        public string? Type { get; set; }

        /// CDB, LCI, LCA, TREASURY, STOCK, BDR, REAL_ESTATE_FUND, PGBL, VGBL, ...
        public string? Subtype { get; set; }

        /// Net value (after taxes) — what the user would get today.
        public decimal? Balance { get; set; }

        /// Gross value.
        public decimal? Amount { get; set; }

        /// What was originally invested, when the bank reports it.
        public decimal? AmountOriginal { get; set; }
        public decimal? Quantity { get; set; }

        /// Value of one unit.
        public decimal? Value { get; set; }
        public DateTime? Date { get; set; }
        public DateTime? IssueDate { get; set; }
        public DateTime? DueDate { get; set; }
        public string? Issuer { get; set; }
        public decimal? Rate { get; set; }
        public string? RateType { get; set; }
        public string? CurrencyCode { get; set; }

        /// ACTIVE, PENDING or TOTAL_WITHDRAWAL.
        public string? Status { get; set; }
    }
}
