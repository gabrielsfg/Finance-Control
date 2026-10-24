namespace FinanceControl.Services.Pluggy
{
    public class PluggyTransaction
    {
        public string Id { get; set; } = string.Empty;
        public string AccountId { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? DescriptionRaw { get; set; }

        /// Cards: a purchase is positive, a payment or refund negative. Bank accounts: the
        /// direction is in <see cref="Type"/>, which is what we read there.
        public decimal Amount { get; set; }

        /// Set on foreign-currency purchases: the amount converted to the account's currency.
        public decimal? AmountInAccountCurrency { get; set; }
        public DateTime Date { get; set; }

        /// DEBIT (outflow) or CREDIT (inflow).
        public string? Type { get; set; }

        /// POSTED or PENDING.
        public string? Status { get; set; }
        public string? Category { get; set; }
        public string? CategoryId { get; set; }
        public string? ProviderId { get; set; }

        /// PIX, TED, ... on accounts; PAGAMENTO_FATURA, ESTORNO, ... on Open Finance cards.
        public string? OperationType { get; set; }
        public PluggyCreditCardMetadata? CreditCardMetadata { get; set; }
    }
}
