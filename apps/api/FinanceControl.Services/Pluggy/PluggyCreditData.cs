namespace FinanceControl.Services.Pluggy
{
    public class PluggyCreditData
    {
        public decimal? CreditLimit { get; set; }
        public decimal? AvailableCreditLimit { get; set; }
        public DateTime? BalanceCloseDate { get; set; }
        public DateTime? BalanceDueDate { get; set; }
        public string? Brand { get; set; }
    }
}
