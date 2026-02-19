using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Respose
{
    public class CategoryAllocationItemByAreaIdDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public int CategoryExpectedValue { get; set; }
        public List<SubCategoryAllocationItemByCategoryIdDto> SubCategories { get; set; }  
        
    }
}
