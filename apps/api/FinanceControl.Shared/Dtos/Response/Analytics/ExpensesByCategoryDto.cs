namespace FinanceControl.Shared.Dtos.Response.Analytics
{
    public class ExpensesByCategoryDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int Total { get; set; }
        public List<SubCategoryExpenseItemDto> Subcategories { get; set; } = [];
    }

    public class SubCategoryExpenseItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Total { get; set; }
    }
}
