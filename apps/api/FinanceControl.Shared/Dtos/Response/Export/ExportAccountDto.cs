using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Export
{
    public class ExportAccountDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public EnumAccountType Type { get; set; }
        public bool IsDefaultAccount { get; set; }
        public bool IsSystem { get; set; }
        public int? GoalAmount { get; set; }
        public int? BillingDueDay { get; set; }
        public int? BillingClosingDay { get; set; }
        public int? CreditLimit { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
