using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Export
{
    public class ExportInvestmentDividendDto
    {
        public int Id { get; set; }
        public EnumDividendType Type { get; set; }
        public DateOnly? PaymentDate { get; set; }
        public DateOnly? LastDatePrior { get; set; }
        public long Amount { get; set; }
        public int? LinkedTransactionId { get; set; }
    }
}
