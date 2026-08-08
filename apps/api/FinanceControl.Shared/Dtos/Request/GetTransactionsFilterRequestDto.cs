using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class GetTransactionsFilterRequestDto
    {
        public DateOnly StartDate { get; set; }
        public DateOnly FinishDate { get; set; }
        public List<int>? BudgetIds { get; set; }
        public List<int>? AccountIds { get; set; }
        public List<int>? CategoryIds { get; set; }
        public List<int>? SubCategoryIds { get; set; }

        /// <summary>Budget area ids. A transaction's area comes from its budget allocation.</summary>
        public List<int>? AreaIds { get; set; }

        /// <summary>Free text matched against description, subcategory name and account name.</summary>
        public string? Search { get; set; }

        /// <summary>"Expense" | "Income" | "Transfer". Null means every type.</summary>
        public EnumTransactionType? Type { get; set; }

        /// <summary>"OneTime" | "Installment" | "Recurring". Null means every payment type.</summary>
        public EnumPaymentType? PaymentType { get; set; }

        /// <summary>Inclusive bounds on the transaction magnitude, in cents.</summary>
        public int? MinValue { get; set; }
        public int? MaxValue { get; set; }

        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string SortField { get; set; } = "date";
        public string SortOrder { get; set; } = "desc";
    }
}
