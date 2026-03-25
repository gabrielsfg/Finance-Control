using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Request
{
    public class UpdateTransactionRequestDto
    {
        public int? BudgetId { get; set; }
        public int SubCategoryId { get; set; }
        public int AccountId { get; set; }
        public int Value { get; set; }
        public string Description { get; set; }
        public DateOnly TransactionDate { get; set; }
    }
}
