using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class GetTransactionResponseDto
    {
        public int Id { get; set; }
        public int? BudgetId { get; set; }
        public string? BudgetName { get; set; }
        public int SubCategoryId { get; set; }
        public string SubCategoryName { get; set; }
        public string? SubCategoryEmoji { get; set; }

        /// <summary>
        /// The parent category of <see cref="SubCategoryName"/>. Carried on the row so a
        /// consumer that only has the transaction — the CSV export, for one — can name it
        /// without loading the whole category tree.
        /// </summary>
        public string CategoryName { get; set; } = string.Empty;

        public int AccountId { get; set; }
        public string AccountName { get; set; }
        public int? DestinationAccountId { get; set; }
        public string? DestinationAccountName { get; set; }
        public int? RecurringTransactionId { get; set; }
        public int? ParentTransactionId { get; set; }
        public int Value { get; set; }
        public EnumTransactionType Type { get; set; }
        public string Description { get; set; }
        public DateOnly TransactionDate { get; set; }
        public EnumPaymentType PaymentType { get; set; }
        public EnumPaymentMethod? PaymentMethod { get; set; }
        public int? InstallmentNumber { get; set; }
        public int? TotalInstallments { get; set; }
        public int? AreaId { get; set; }
        public string? AreaName { get; set; }
        public List<GetTagResponseDto> Tags { get; set; } = new();
    }
}
