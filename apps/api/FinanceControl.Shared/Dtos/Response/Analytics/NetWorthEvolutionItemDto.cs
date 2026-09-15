namespace FinanceControl.Shared.Dtos.Response.Analytics
{
    public class NetWorthEvolutionItemDto
    {
        public int Month { get; set; }
        public int Year { get; set; }

        /// <summary>Everything the user owns that month: cash across accounts plus the portfolio.</summary>
        public long NetWorth { get; set; }

        /// <summary>
        /// The portfolio's worth at the close of the month, carried separately from
        /// <see cref="Breakdown"/> so it never distorts an account's cash balance.
        /// Always an asset — a position cannot be worth less than nothing.
        /// </summary>
        public long Investments { get; set; }

        public List<AccountBalanceItemDto> Breakdown { get; set; } = [];
    }

    public class AccountBalanceItemDto
    {
        public int AccountId { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public long Balance { get; set; }
    }
}
