using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Respose
{
    public class GetBudgetByIdResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public DateOnly StartDate { get; set; }
        public DateOnly FinishDate { get; set; }
        public string Reccurence { get; set; }
    }
}
