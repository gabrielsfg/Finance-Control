using FinanceControl.Domain.Enums;
using FinanceControl.Shared.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Domain.Entities
{
    public class Budget : OwnedEntity
    {
        public string Name { get; set; }
        public int StartDate {  get; set; }
        public EnumBudgetRecurrence Reccurrence { get; set; }

    }
}
