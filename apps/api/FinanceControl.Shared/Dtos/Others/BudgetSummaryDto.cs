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
    }
}
