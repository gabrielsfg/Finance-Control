using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class GetAccountItemResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public EnumAccountType Type { get; set; }
        public int CurrentAmount { get; set; }
        public bool IsDefaultAccount { get; set; }
        public int? CreditLimit { get; set; }
        public int? BillingDueDay { get; set; }
        public int? BillingClosingDay { get; set; }

        /// BankCatalog slug of the account's bank; null shows the account-type icon.
        public string? BankSlug { get; set; }

        /// A card with closing and due days: its balance split into bills.
        public CreditCardBillsResponseDto? Bills { get; set; }

        /// Imports from a bank through Open Finance.
        public bool IsConnected { get; set; }
        public int? BankConnectionId { get; set; }
        public string? ConnectorName { get; set; }
        public string? ConnectorImageUrl { get; set; }
        public EnumBankConnectionStatus? ConnectionStatus { get; set; }
        public DateTime? LastSyncedAt { get; set; }

        /// The balance the bank reports, in cents (a card: the used limit).
        public int? ExternalBalance { get; set; }
    }
}
