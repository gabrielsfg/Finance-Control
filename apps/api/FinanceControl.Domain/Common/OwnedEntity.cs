using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinanceControl.Domain.Common
{
    public class OwnedEntity : BaseEntity
    {
        public int UserId { get; set; }
    }
}
