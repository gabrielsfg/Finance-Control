using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.OpenFinance
{
    public class BankConnectionAccountResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Number { get; set; }

        /// Pluggy's BANK or CREDIT.
        public string ExternalType { get; set; } = string.Empty;
        public string? ExternalSubtype { get; set; }

        /// The app account type a new account for it would get.
        public EnumAccountType SuggestedAccountType { get; set; }
        public EnumBankAccountLinkStatus Status { get; set; }
        public int? AccountId { get; set; }
        public string? AccountName { get; set; }
        public DateOnly? ImportFromDate { get; set; }
        public DateTime? InitialImportCompletedAt { get; set; }

        /// Balance as the bank reports it, in cents (a card: the used limit).
        public int? ExternalBalance { get; set; }
        public DateTime? ExternalBalanceAt { get; set; }
        public int? ExternalCreditLimit { get; set; }

        /// The linked app account's balance, in cents, computed from its transactions.
        public int? AppBalance { get; set; }

        /// What an adjustment would add to the app balance to match the bank; null when
        /// there is nothing to adjust.
        public int? BalanceDifference { get; set; }
    }
}
