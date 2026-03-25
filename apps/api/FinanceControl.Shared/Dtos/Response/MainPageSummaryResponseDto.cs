using FinanceControl.Shared.Dtos.Others;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Response
{
    public class MainPageSummaryResponseDto
    {
        public BalanceSummaryDto BalanceSummary { get; set; }
        public List<RecentTransactionDto> RecentTransactions { get; set; }
        public BudgetSummaryDto BudgetSummary { get; set; }
        public List<TopCategoryItemDto> TopCategories { get; set; }
    }
}
