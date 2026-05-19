using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class RecurringTransactionResponseDto
    {
        public int Id { get; set; }
        public int SubCategoryId { get; set; }
        public string SubCategoryName { get; set; }
        public string? SubCategoryEmoji { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public string? CategoryColor { get; set; }
        public int AccountId { get; set; }
        public string AccountName { get; set; }
        public int Value { get; set; }
        public EnumTransactionType Type { get; set; }
        public string Description { get; set; }
        public EnumRecurrenceType Recurrence { get; set; }
        public DateOnly StartDate { get; set; }
        public DateOnly? EndDate { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class InstallmentSummaryResponseDto
    {
        public int Id { get; set; }
        public int SubCategoryId { get; set; }
        public string SubCategoryName { get; set; }
        public string? SubCategoryEmoji { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public string? CategoryColor { get; set; }
        public int AccountId { get; set; }
        public string AccountName { get; set; }
        public int Value { get; set; }
        public int TotalValue { get; set; }
        public EnumTransactionType Type { get; set; }
        public string Description { get; set; }
        public DateOnly TransactionDate { get; set; }
        public int TotalInstallments { get; set; }
        public int PaidInstallments { get; set; }
        public int RemainingInstallments { get; set; }
        public int RemainingAmount { get; set; }
        public EnumPaymentMethod? PaymentMethod { get; set; }
    }

    public class RecurrencePageResponseDto
    {
        public int TotalMonthlyAmount { get; set; }
        public int InstallmentMonthlyAmount { get; set; }
        public int SubscriptionMonthlyAmount { get; set; }
        public int ActiveRecurringCount { get; set; }
        public int ActiveInstallmentCount { get; set; }
        public int MonthlyIncome { get; set; }
        public IReadOnlyList<RecurringTransactionResponseDto> Recurring { get; set; }
        public IReadOnlyList<InstallmentSummaryResponseDto> Installments { get; set; }
    }
}
