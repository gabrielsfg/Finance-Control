using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// One account (checking, savings or card) found inside a bank connection, and the app
    /// account its transactions are imported into.
    /// </summary>
    public class BankConnectionAccount : OwnedEntity
    {
        public int BankConnectionId { get; set; }

        /// Pluggy's account id. Unique.
        public string ExternalAccountId { get; set; } = string.Empty;

        /// Pluggy's type (BANK / CREDIT) and subtype (CHECKING_ACCOUNT, SAVINGS_ACCOUNT, CREDIT_CARD).
        public string ExternalType { get; set; } = string.Empty;
        public string? ExternalSubtype { get; set; }
        public string Name { get; set; } = string.Empty;

        /// Account number as the bank shows it; for cards, the last four digits.
        public string? Number { get; set; }

        public int? AccountId { get; set; }
        public EnumBankAccountLinkStatus Status { get; set; } = EnumBankAccountLinkStatus.PendingLink;

        /// Transactions dated before this are never imported, so history the user already
        /// typed by hand is not duplicated.
        public DateOnly? ImportFromDate { get; set; }
        public DateTime? InitialImportCompletedAt { get; set; }

        /// The balance the bank reports, in cents. Shown next to ours, never used as ours:
        /// the app's balance is always the sum of its transactions. For an Open Finance
        /// card it is the used limit.
        public int? ExternalBalance { get; set; }
        public DateTime? ExternalBalanceAt { get; set; }
        public int? ExternalCreditLimit { get; set; }

        public BankConnection BankConnection { get; set; } = null!;
        public Account? Account { get; set; }
    }
}
