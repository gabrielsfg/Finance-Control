using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Respose
{
    public class GetAccountByIdResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int CurrentAmount { get; set; }
        public int? GoalAmount {  get; set; }
        public bool IsDefaultAccount { get; set; }
    }
}
