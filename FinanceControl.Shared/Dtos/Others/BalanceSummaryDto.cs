using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Others
{
    public class BalanceSummaryDto
    {
        public int TotalIncome { get; set; }
        public int TotalExpenses { get; set; }
        public int Balance { get; set; }
    }
}
