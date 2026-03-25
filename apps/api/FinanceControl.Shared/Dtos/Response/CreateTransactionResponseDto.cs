using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Response
{
    public class CreateTransactionResponseDto
    {
        public List<GetTransactionResponseDto> Transactions { get; set; }
    }
}
