using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Request
{
    public class CreateAccountRequestDto
    {
        public string Name { get; set; }
        public int CurrentBalance { get; set; }
        public int? GoalAmount {  get; set; }
        public bool IsDefaultAccount { get; set; } = true;
    }
}
