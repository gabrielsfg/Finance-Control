using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class UpdateTransactionRequestDto
    {
        public int? BudgetId { get; set; }
        public int SubCategoryId { get; set; }
        public int AccountId { get; set; }
        public int Value { get; set; }
        public string Description { get; set; }
        public DateOnly TransactionDate { get; set; }
        public EnumPaymentMethod? PaymentMethod { get; set; }
    }
}
