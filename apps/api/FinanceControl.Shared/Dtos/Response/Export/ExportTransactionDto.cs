using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Export
{
    public class ExportTransactionDto
    {
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;

        /// <summary>Cents, like everywhere else in the API.</summary>
        public int Value { get; set; }

        public EnumTransactionType Type { get; set; }
        public DateOnly TransactionDate { get; set; }
        public EnumPaymentType PaymentType { get; set; }
        public EnumPaymentMethod? PaymentMethod { get; set; }
        public int AccountId { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public int? DestinationAccountId { get; set; }
        public int SubCategoryId { get; set; }
        public string SubCategoryName { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public int? BudgetId { get; set; }
        public int? RecurringTransactionId { get; set; }
        public int? ParentTransactionId { get; set; }
        public int? InstallmentNumber { get; set; }
        public int? TotalInstallments { get; set; }
        public List<string> Tags { get; set; } = [];
        public DateTime CreatedAt { get; set; }
    }
}
