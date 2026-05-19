namespace FinanceControl.Shared.Dtos.Response.Analytics
{
    public class NetWorthEvolutionItemDto
    {
        public int Month { get; set; }
        public int Year { get; set; }
        public int NetWorth { get; set; }
        public List<AccountBalanceItemDto> Breakdown { get; set; } = [];
    }

    public class AccountBalanceItemDto
    {
        public int AccountId { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public int Balance { get; set; }
    }
}
