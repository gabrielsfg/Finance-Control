using FinanceControl.Shared.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Domain.Entities
{
    public class Category : OwnedEntity
    {
        public string Name { get; set; }
    }
}
