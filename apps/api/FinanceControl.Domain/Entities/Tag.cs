using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    public class Tag : OwnedEntity
    {
        public string Name { get; set; }
        public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    }
}
