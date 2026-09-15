using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Response
{
    public class GetSubCategoryResponseDto
    {
        public int Id { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public string? CategoryColor { get; set; }
        public string Name { get; set; }
        public string? Emoji { get; set; }

        /// <summary>Spending here counts as savings, not as an expense.</summary>
        public bool IsSavings { get; set; }
    }
}
