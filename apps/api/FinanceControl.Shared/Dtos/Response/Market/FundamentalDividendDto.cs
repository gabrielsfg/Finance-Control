namespace FinanceControl.Shared.Dtos.Response.Market
{
    public class FundamentalDividendDto
    {
        public DateOnly? PaymentDate { get; set; }
        public decimal Rate { get; set; }
        public string Label { get; set; } = string.Empty;
    }
}
