namespace FinanceControl.Services.Pluggy
{
    public class PluggyAccount
    {
        public string Id { get; set; } = string.Empty;
        public string ItemId { get; set; } = string.Empty;

        /// BANK or CREDIT.
        public string Type { get; set; } = string.Empty;

        /// CHECKING_ACCOUNT, SAVINGS_ACCOUNT or CREDIT_CARD.
        public string? Subtype { get; set; }
        public string? Name { get; set; }
        public string? MarketingName { get; set; }
        public string? Number { get; set; }

        /// Bank: available balance. Open Finance card: the used limit.
        public decimal Balance { get; set; }
        public string? CurrencyCode { get; set; }
        public PluggyCreditData? CreditData { get; set; }
    }
}
