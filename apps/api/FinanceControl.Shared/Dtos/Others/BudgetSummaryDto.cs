using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Others
{
    public class BudgetSummaryDto
    {
        public int TotalExpected { get; set; }
        public int TotalSpent { get; set; }
        public decimal SpentPercentage { get; set; }
        public bool HasAllocations { get; set; }
        public List<BudgetSubCategorySummaryDto> TopSubCategories { get; set; } = [];
    }

    public class BudgetSubCategorySummaryDto
    {
        public string SubCategoryName { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public int Spent { get; set; }
        public int Allocated { get; set; }
        public decimal SpentPercentage { get; set; }
    }
}
