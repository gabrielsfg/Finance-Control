using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class TransactionItemResponseDto
    {
        public int Id { get; set; }
        public int? BudgetId { get; set; }
        public int SubCategoryId { get; set; }
        public string SubCategoryName { get; set; }
        public int AccountId { get; set; }
        public string AccountName { get; set; }
        public int? RecurringTransactionId { get; set; }
        public int? ParentTransactionId { get; set; }
        public int Value { get; set; }
        public EnumTransactionType Type { get; set; }
        public string Description { get; set; }
        public DateOnly TransactionDate { get; set; }
        public EnumPaymentType PaymentType { get; set; }
        public int? InstallmentNumber { get; set; }
        public int? TotalInstallments { get; set; }
        public bool IsPaid { get; set; }
    }
}
