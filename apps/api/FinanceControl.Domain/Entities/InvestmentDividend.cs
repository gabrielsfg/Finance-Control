using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    public class InvestmentDividend : OwnedEntity
    {
        public int InvestmentId { get; set; }
        public DateOnly Date { get; set; }
        public long Amount { get; set; }
        public EnumDividendType Type { get; set; }
        public int? LinkedTransactionId { get; set; }

        public Investment Investment { get; set; } = null!;
        public Transaction? LinkedTransaction { get; set; }
    }
}
