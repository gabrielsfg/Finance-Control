using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Others
{
    public class TopCategoryItemDto
    {
        public string CategoryName { get; set; }
        public string? Color { get; set; }
        public int TotalSpent { get; set; }
    }
}
