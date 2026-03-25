using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Request
{
    public class CreateAreaRequestDto
    {
        public int BudgetId { get; set; }
        public string Name { get; set; }
    }
}
