using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Response
{
    public class CategoryResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Color { get; set; }
        public List<GetSubCategoryResponseDto> SubCategories { get; set; }
    }
}
