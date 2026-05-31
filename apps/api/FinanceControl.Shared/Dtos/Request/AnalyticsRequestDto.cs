using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class AnalyticsRequestDto
    {
        public DateOnly StartDate { get; set; }
        public DateOnly FinishDate { get; set; }
        public List<int> AccountIds { get; set; } = [];
        public List<int> CategoryIds { get; set; } = [];
        public List<int> TagIds { get; set; } = [];
        // null = no filter (include both); set to filter to only Expense or only Income
        public EnumTransactionType? TransactionType { get; set; }
        // null = no filter; set to filter by payment type (OneTime, Installment, Recurring)
        public EnumPaymentType? PaymentType { get; set; }
        public int UserId { get; set; }
    }
}
