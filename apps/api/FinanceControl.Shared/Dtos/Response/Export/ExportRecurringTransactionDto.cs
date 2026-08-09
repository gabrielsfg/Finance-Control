using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Export
{
    public class ExportRecurringTransactionDto
    {
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Value { get; set; }
        public EnumTransactionType Type { get; set; }
        public EnumRecurrenceType Recurrence { get; set; }
        public DateOnly StartDate { get; set; }
        public DateOnly? EndDate { get; set; }
        public bool IsActive { get; set; }
        public int AccountId { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public int SubCategoryId { get; set; }
        public string SubCategoryName { get; set; } = string.Empty;
        public int? BudgetId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
