using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    public class InvestmentTransaction : OwnedEntity
    {
        public int InvestmentId { get; set; }
        public EnumInvestmentOperation Operation { get; set; }
        public DateOnly Date { get; set; }
        public decimal Quantity { get; set; }
        public long UnitPrice { get; set; }
        public long OtherCosts { get; set; }
        public long TotalValue { get; set; }
        public int? LinkedTransactionId { get; set; }

        public Investment Investment { get; set; } = null!;
        public Transaction? LinkedTransaction { get; set; }
    }
}
