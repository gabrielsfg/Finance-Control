using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// One bank connected through Open Finance — a Pluggy "item".
    /// </summary>
    /// <remarks>
    /// The connector fields are a snapshot taken at connection time so the list renders
    /// without calling Pluggy. Status mirrors the item; Pluggy is the source of truth and
    /// every webhook refreshes it from <c>GET /items/{id}</c>.
    /// </remarks>
    public class BankConnection : OwnedEntity
    {
        /// Pluggy's item id. Unique: the same item can never belong to two rows.
        public string ItemId { get; set; } = string.Empty;

        public int ConnectorId { get; set; }
        public string ConnectorName { get; set; } = string.Empty;
        public string? ConnectorImageUrl { get; set; }
        public string? ConnectorPrimaryColor { get; set; }

        public EnumBankConnectionStatus Status { get; set; } = EnumBankConnectionStatus.Syncing;
        public string? ExecutionStatus { get; set; }
        public string? LastErrorCode { get; set; }
        public string? LastErrorMessage { get; set; }

        /// The item's lastUpdatedAt: when Pluggy last finished collecting from the bank.
        public DateTime? LastSyncedAt { get; set; }
        public DateTime? NextAutoSyncAt { get; set; }
        public DateTime? ConsentExpiresAt { get; set; }
        public DateTime? LastManualSyncAt { get; set; }
        public DateTime? DisconnectedAt { get; set; }

        public ICollection<BankConnectionAccount> Accounts { get; set; } = [];
        public ICollection<BankConnectionInvestment> Investments { get; set; } = [];
    }
}
