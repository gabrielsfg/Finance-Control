using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    public class InvestmentPriceHistory : BaseEntity
    {
        public int InvestmentId { get; set; }
        public DateOnly Date { get; set; }
        public long Price { get; set; }

        public Investment Investment { get; set; } = null!;
    }
}
