using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class UpdateTransactionRequestDto
    {
        public int SubCategoryId { get; set; }
        public int AccountId { get; set; }
        public int? DestinationAccountId { get; set; }
        public int Value { get; set; }
        public EnumTransactionType Type { get; set; }
        public string Description { get; set; }
        public DateOnly TransactionDate { get; set; }
        public EnumPaymentType PaymentType { get; set; }
        public EnumPaymentMethod? PaymentMethod { get; set; }
        public int? TotalInstallments { get; set; }
        public EnumRecurrenceType? Recurrence { get; set; }
        public bool IncludeInBudget { get; set; }
        public List<string>? Tags { get; set; }
    }
}
