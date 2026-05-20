using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class CreateInvestmentDividendRequestDto
    {
        public int InvestmentId { get; set; }
        public DateOnly? PaymentDate { get; set; }
        public DateOnly? LastDatePrior { get; set; }
        public long Amount { get; set; }
        public EnumDividendType Type { get; set; }
        public int AccountId { get; set; }
    }
}
