using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class GetAllBudgetResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public EnumBudgetRecurrence Recurrence { get; set; }
        public bool IsActive { get; set; }
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public int TotalAllocated { get; set; }
        public int TotalSpent { get; set; }
        public double SpentPercentage { get; set; }
        public int TotalIncome { get; set; }
        public int TotalReceived { get; set; }
        public int Available { get; set; }
        public List<BudgetAllocationFlatResponseDto> Allocations { get; set; } = [];
    }

    public class BudgetAllocationFlatResponseDto
    {
        public int Id { get; set; }
        public int SubCategoryId { get; set; }
        public string SubCategoryName { get; set; }
        public string? SubCategoryEmoji { get; set; }
        public string CategoryName { get; set; }
        public string? CategoryColor { get; set; }
        public string AreaName { get; set; }
        public int Allocated { get; set; }
        public int Spent { get; set; }
        public double SpentPercentage { get; set; }
        public EnumAllocationType AllocationType { get; set; }

        /// <summary>
        /// True for spend that was assigned to the budget but has no allocation planned for
        /// its subcategory. These rows carry <see cref="Allocated"/> = 0 and are grouped
        /// under the <c>UnbudgetedAreaName</c> area, so they count towards the budget's
        /// totals without pretending to have a target.
        /// </summary>
        public bool IsUnbudgeted { get; set; }
    }
}
