using FinanceControl.Shared.Enums;

namespace FinanceControl.Services.Legal
{
    /// <summary>One legal text as authored in the repository, before it reaches the database.</summary>
    public record LegalDocumentFile(EnumLegalDocumentType Type, int Version, string Content, string ContentHash);
}
