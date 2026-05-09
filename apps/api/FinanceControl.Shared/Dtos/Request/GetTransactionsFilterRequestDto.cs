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
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string SortField { get; set; } = "date";
        public string SortOrder { get; set; } = "desc";
    }
}
