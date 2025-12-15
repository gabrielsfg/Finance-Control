using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Domain.Enums
{
    public enum EnumPaymentRecurrence
    {
        None = 0,
        Daily = 1,
        WorkDay = 2,
        Weekly = 3,
        Biweekly = 4,
        Monthly = 5,
        Quarterly = 6,
        Semiannually = 7,
        Annually = 8
    }
}
