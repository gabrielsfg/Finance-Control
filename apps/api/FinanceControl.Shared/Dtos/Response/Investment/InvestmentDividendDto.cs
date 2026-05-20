using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Investment
{
    public class InvestmentDividendDto
    {
        public int Id { get; set; }
        public int InvestmentId { get; set; }
        public string Ticker { get; set; } = string.Empty;
        public DateOnly? PaymentDate { get; set; }
        public DateOnly? LastDatePrior { get; set; }
        public long Amount { get; set; }
        public EnumDividendType Type { get; set; }
    }
}
