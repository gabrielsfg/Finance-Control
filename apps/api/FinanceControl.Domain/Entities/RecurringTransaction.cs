using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Domain.Entities
{
    public class RecurringTransaction : OwnedEntity
    {
        public int? BudgetId { get; set; }
        public int SubCategoryId { get; set; }
        public int AccountId { get; set; }
        public int Value { get; set; }
        public EnumTransactionType Type { get; set; }
        public string Description { get; set; }
        public EnumRecurrenceType Recurrence { get; set; }
        public DateOnly StartDate { get; set; }
        public DateOnly? EndDate { get; set; }
        public bool IsActive { get; set; } = true;
        public Budget? Budget { get; set; }
        public SubCategory SubCategory { get; set; }
        public Account Account { get; set; }
        public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();

    }
}
