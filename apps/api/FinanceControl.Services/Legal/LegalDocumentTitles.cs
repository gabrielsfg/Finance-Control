using FinanceControl.Shared.Enums;

namespace FinanceControl.Services.Legal
{
    /// <summary>User-facing titles of the legal documents (pt-BR product copy).</summary>
    public static class LegalDocumentTitles
    {
        public static string For(EnumLegalDocumentType type) => type switch
        {
            EnumLegalDocumentType.TermsOfUse => "Termos de Uso",
            EnumLegalDocumentType.PrivacyPolicy => "Política de Privacidade",
            _ => type.ToString()
        };
    }
}
