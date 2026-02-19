using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Request
{
    public class AddSubCategoryToBudgetRequestDto
    {
        public int BudgetId { get; set; }
        public int AreaId { get; set; }
        public int SubCategoryId { get; set; }
        public int ExpectedValue { get; set; }
    }
}
