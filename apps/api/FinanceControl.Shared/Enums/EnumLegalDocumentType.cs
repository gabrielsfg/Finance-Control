namespace FinanceControl.Shared.Enums
{
    /// <summary>
    /// The legal documents the user can be asked to accept. Stored as a string, so a new
    /// kind of document (an AI disclaimer, for instance) costs a value here and a markdown
    /// file — no migration.
    /// </summary>
    public enum EnumLegalDocumentType
    {
        PrivacyPolicy,
        TermsOfUse
    }
}
