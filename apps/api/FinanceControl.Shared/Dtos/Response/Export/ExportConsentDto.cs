using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Export
{
    /// <summary>
    /// A legal document this account accepted. Carries the hash rather than the full text
    /// so the file stays readable; the wording itself is at
    /// <c>GET /api/legal/{type}?version={version}</c>.
    /// </summary>
    public class ExportConsentDto
    {
        public EnumLegalDocumentType DocumentType { get; set; }
        public int DocumentVersion { get; set; }
        public string DocumentHash { get; set; } = string.Empty;
        public DateTime AcceptedAt { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
    }
}
