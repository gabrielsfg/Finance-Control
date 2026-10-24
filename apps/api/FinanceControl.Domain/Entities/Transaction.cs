using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinanceControl.Domain.Entities
{
    public class Transaction : OwnedEntity
    {
        public int? BudgetId { get; set; }
        public int SubCategoryId { get; set; }
        public int AccountId { get; set; }
        public int? DestinationAccountId { get; set; }
        public int? RecurringTransactionId { get; set; }
        public int? ParentTransactionId { get; set; }
        public int Value { get; set; }
        public EnumTransactionType Type { get; set; }
        public string Description { get; set; }
        public DateOnly TransactionDate { get; set; }
        public EnumPaymentType PaymentType { get; set; }
        public EnumPaymentMethod? PaymentMethod { get; set; }
        public int? InstallmentNumber { get; set; }
        public int? TotalInstallments { get; set; }

        public EnumTransactionSource Source { get; set; } = EnumTransactionSource.Manual;

        /// Pluggy's transaction id when the row came from (or was matched to) a bank sync.
        /// Unique per user: it is what makes every sync an upsert instead of an insert.
        public string? ExternalId { get; set; }

        /// For a transfer between two connected accounts: Pluggy's id of the inflow leg,
        /// which was folded into this row instead of becoming an income of its own.
        public string? ExternalCounterpartId { get; set; }

        /// The bank's own id for the transaction (Open Finance only) — the one id that
        /// survives a reconnection, kept for reconciling across items.
        public string? ExternalProviderId { get; set; }

        /// Synced and not confirmed by the user yet.
        public bool NeedsReview { get; set; }

        /// The user edited a synced row; later syncs stop overwriting value, date and description.
        public bool ExternalModified { get; set; }

        /// Synced next to more than one similar hand-typed row, so it was not merged into any.
        public bool PossibleDuplicate { get; set; }

        public Budget? Budget { get; set; }
        public SubCategory SubCategory { get; set; }
        public Account Account { get; set; }
        public Account? DestinationAccount { get; set; }
        public RecurringTransaction? RecurringTransaction { get; set; }
        public Transaction? ParentTransaction { get; set; }
        public ICollection<Transaction> Installments { get; set; } = new List<Transaction>();
        public ICollection<Tag> Tags { get; set; } = new List<Tag>();
    }
}
