using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Respose
{
    public class GetAccountItemResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int CurrentAmout { get; set; }
        public Boolean IsDefaultAccount { get; set; }
    }
}
