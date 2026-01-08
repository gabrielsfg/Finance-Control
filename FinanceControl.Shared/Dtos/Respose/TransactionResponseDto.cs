using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Respose
{
    public class TransactionResponseDto
    {
        public int Id { get; set; }
        public int Value { get; set; }
        public string Type { get; set; }
        public int Category { get; set; }
        public string? Description { get; set; }
        public DateOnly TransactionDate { get; set; }
        public string PaymentType { get; set; }
        public string Reccurence { get; set; }
    }
}
