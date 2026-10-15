using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Export
{
    /// <summary>A bank connected through Open Finance. Never includes the provider's ids.</summary>
    public class ExportBankConnectionDto
    {
        public string Bank { get; set; } = string.Empty;
        public EnumBankConnectionStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastSyncedAt { get; set; }
        public DateTime? ConsentExpiresAt { get; set; }
        public List<string> Accounts { get; set; } = [];
    }
}
