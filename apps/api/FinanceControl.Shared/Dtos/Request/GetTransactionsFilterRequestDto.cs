using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class GetTransactionsFilterRequestDto
    {
        public DateOnly StartDate { get; set; }
        public DateOnly FinishDate { get; set; }
        public List<int>? BudgetIds { get; set; }

        /// <summary>
        /// True returns only transactions counting against a budget, false only those
        /// outside every budget, null both. Distinct from BudgetIds, which narrows to
        /// specific budgets and therefore can never surface the ones with none.
        /// </summary>
        public bool? HasBudget { get; set; }
        public List<int>? AccountIds { get; set; }
        public List<int>? CategoryIds { get; set; }
        public List<int>? SubCategoryIds { get; set; }

        /// <summary>Budget area ids. A transaction's area comes from its budget allocation.</summary>
        public List<int>? AreaIds { get; set; }

        /// <summary>A transaction matches when it carries any one of these tags.</summary>
        public List<int>? TagIds { get; set; }

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
