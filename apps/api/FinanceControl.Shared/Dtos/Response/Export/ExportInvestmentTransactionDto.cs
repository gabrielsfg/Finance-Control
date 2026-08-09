using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Export
{
    public class ExportInvestmentTransactionDto
    {
        public int Id { get; set; }
        public EnumInvestmentOperation Operation { get; set; }
        public DateOnly Date { get; set; }
        public decimal Quantity { get; set; }
        public long UnitPrice { get; set; }
        public long OtherCosts { get; set; }
        public long TotalValue { get; set; }
        public int? LinkedTransactionId { get; set; }
    }
}
