using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request.OpenFinance
{
    public class LinkBankAccountItemRequestDto
    {
        /// Our id of the bank account inside the connection.
        public int BankAccountId { get; set; }
        public EnumBankAccountLinkAction Action { get; set; }

        /// Required for Link: the existing app account to import into.
        public int? AccountId { get; set; }

        /// For Create: the new account's name (defaults to the bank's).
        public string? Name { get; set; }

        /// Transactions before this date are not imported. Defaults to the first day of
        /// the current month.
        public DateOnly? ImportFromDate { get; set; }
    }
}
