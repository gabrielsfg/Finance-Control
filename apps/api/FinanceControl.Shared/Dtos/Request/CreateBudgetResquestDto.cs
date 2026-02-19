using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Request
{
    public class CreateBudgetResquestDto
    {
        public string Name {  get; set; }
        public int StartDate { get; set; }
        public string Reccurrence { get; set; }
    }
}
