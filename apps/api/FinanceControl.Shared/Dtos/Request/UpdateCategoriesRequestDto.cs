using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Request
{
    public class UpdateCategoriesRequestDto
    {
        public List<UpdateCategoryRequestDto> Categories { get; set; }
    }
}
