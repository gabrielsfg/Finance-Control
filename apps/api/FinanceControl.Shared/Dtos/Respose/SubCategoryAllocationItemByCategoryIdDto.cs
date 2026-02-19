using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Respose
{
    public class SubCategoryAllocationItemByCategoryIdDto
    {
        public int SubCategoryId { get; set; }
        public string SubCategoryName { get; set; }
        public int SubCategoryExpectedValue { get; set; }
    }
}
