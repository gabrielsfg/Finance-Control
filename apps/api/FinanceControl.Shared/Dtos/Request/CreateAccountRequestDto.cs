using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class CreateAccountRequestDto
    {
        public string Name { get; set; }
        public EnumAccountType Type { get; set; }
        public int? GoalAmount { get; set; }
        public bool IsDefaultAccount { get; set; } = true;
        public int? BillingDueDay { get; set; }
        public int? CreditLimit { get; set; }
    }
}
