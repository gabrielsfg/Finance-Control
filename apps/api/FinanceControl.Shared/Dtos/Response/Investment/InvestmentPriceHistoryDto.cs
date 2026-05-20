namespace FinanceControl.Shared.Dtos.Response.Investment
{
    public class InvestmentPriceHistoryDto
    {
        public DateOnly Date { get; set; }
        public long Price { get; set; }
    }
}
