using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Respose
{
    public class GetCategoriesResponseDto
    {
        public IEnumerable<CategoryResponseDto>? Categories { get; set; }
    }
}
