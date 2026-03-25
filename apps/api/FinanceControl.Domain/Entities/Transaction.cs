using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Domain.Entities
{
    public class Transaction : OwnedEntity
    {
        public int? BudgetId { get; set; }
        public int SubCategoryId { get; set; }
        public int AccountId { get; set; }
        public int? RecurringTransactionId { get; set; }
        public int? ParentTransactionId { get; set; }
        public int Value { get; set; }
        public EnumTransactionType Type { get; set; }
        public string Description { get; set; }
        public DateOnly TransactionDate { get; set; }
        public EnumPaymentType PaymentType { get; set; }
        public int? InstallmentNumber { get; set; }
        public int? TotalInstallments { get; set; }
        public bool IsPaid { get; set; }
        public Budget? Budget { get; set; }
        public SubCategory SubCategory { get; set; }
        public Account Account { get; set; }
        public RecurringTransaction? RecurringTransaction { get; set; }
        public Transaction? ParentTransaction { get; set; }
        public ICollection<Transaction> Installments { get; set; } = new List<Transaction>();
    }
}
