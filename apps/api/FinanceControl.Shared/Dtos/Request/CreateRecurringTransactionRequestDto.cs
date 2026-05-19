using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class CreateRecurringTransactionRequestDto
    {
        public int SubCategoryId { get; set; }
        public int AccountId { get; set; }
        public int Value { get; set; }
        public EnumTransactionType Type { get; set; }
        public string Description { get; set; }
        public EnumRecurrenceType Recurrence { get; set; }
        public DateOnly StartDate { get; set; }
        public DateOnly? EndDate { get; set; }
        public bool IncludeInBudget { get; set; }
    }
}
