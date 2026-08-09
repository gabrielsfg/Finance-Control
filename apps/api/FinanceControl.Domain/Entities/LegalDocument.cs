using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// One published version of a legal document. The wording is authored as a markdown
    /// file in the repository and copied into this table on startup.
    /// </summary>
    /// <remarks>
    /// The copy is not redundancy for its own sake: a consent record has to stand on its
    /// own. "The text was in the repository at commit X" depends on that repository still
    /// existing and on nobody having rewritten history — a row frozen next to the
    /// signature, with its hash, does not.
    ///
    /// A version becomes immutable the moment someone signs it. The seeder refuses to
    /// rewrite a row that already has consents, because changing the text under a
    /// signature is the one thing this table exists to prevent. New wording is always a
    /// new version, and the old one stays readable for whoever accepted it.
    /// </remarks>
    public class LegalDocument
    {
        public int Id { get; set; }
        public EnumLegalDocumentType Type { get; set; }

        /// <summary>Sequential, taken from the file name (<c>PrivacyPolicy.v1.md</c>).</summary>
        public int Version { get; set; }

        public string Content { get; set; } = string.Empty;

        /// <summary>
        /// SHA-256 of <see cref="Content"/>, hex. Lets the stored copy be checked against
        /// the file in the repository at any time, by anyone, without trusting either one.
        /// </summary>
        public string ContentHash { get; set; } = string.Empty;

        public DateTime PublishedAt { get; set; }

        public ICollection<UserConsent> Consents { get; set; } = [];
    }
}
