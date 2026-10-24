using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.OpenFinance
{
    public class BankConnectionResponseDto
    {
        public int Id { get; set; }
        public int ConnectorId { get; set; }
        public string ConnectorName { get; set; } = string.Empty;
        public string? ConnectorImageUrl { get; set; }
        public string? ConnectorPrimaryColor { get; set; }
        public EnumBankConnectionStatus Status { get; set; }
        public string? LastErrorMessage { get; set; }
        public DateTime? LastSyncedAt { get; set; }
        public DateTime? NextAutoSyncAt { get; set; }
        public DateTime? ConsentExpiresAt { get; set; }

        /// True when the consent expires within the notice window.
        public bool ConsentExpiringSoon { get; set; }

        /// When "sync now" becomes available again; null means now.
        public DateTime? ManualSyncAvailableAt { get; set; }

        /// Some account was linked and its first import has not finished yet.
        public bool IsImporting { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<BankConnectionAccountResponseDto> Accounts { get; set; } = [];
    }
}
