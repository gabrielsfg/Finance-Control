using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Request
{
    public class UpdateAreaRequestDto
    {
        public int Id { get; set; }
        public int BudgetId { get; set; }
        public string Name { get; set; }
    }
}
