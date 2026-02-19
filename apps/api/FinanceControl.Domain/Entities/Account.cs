using FinanceControl.Domain.Common;


namespace FinanceControl.Domain.Entities
{
    public class Account : OwnedEntity
    {
        public string Name { get; set; }
        public int CurrentBalance { get; set; }
        public int? GoalAmount {  get; set; }
        public bool IsDefaultAccount { get; set; }
    }
}
