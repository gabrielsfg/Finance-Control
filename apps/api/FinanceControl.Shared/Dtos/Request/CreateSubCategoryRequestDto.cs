using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Request
{
    public class CreateSubCategoryRequestDto
    {
        public string Name { get; set; }
        public int CategoryId { get; set; }
    }
}
