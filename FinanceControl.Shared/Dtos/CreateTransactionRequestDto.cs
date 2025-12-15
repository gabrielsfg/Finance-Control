using FinanceControl.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos
{
    public class CreateTransactionRequestDto
    {
        public EnumTransactionType Type { get; set; }
        public int Value { get; set; }
        public int Category {  get; set; }
        public string Description { get; set; }
        public DateTime Date { get; set; }
        public EnumPaymentType PaymentType { get; set; }
        public EnumPaymentRecurrence Reccurence { get; set; }
        public int? FromWallet { get; set; }
        public int? ToWallet { get; set;}
    }
}
