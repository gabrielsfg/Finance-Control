using FinanceControl.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Domain.Entities
{
    public class BudgetSubcategoryAllocation : BaseEntity
    {
        public int BudgetId { get; set; }
        public Budget Budget { get; set; }

        public int AreaId { get; set; }
        public Area Area { get; set; }

        public int SubCategoryId { get; set; }
        public SubCategory SubCategory { get; set; }

        public int ExpectedValue { get; set; }
    }
}
