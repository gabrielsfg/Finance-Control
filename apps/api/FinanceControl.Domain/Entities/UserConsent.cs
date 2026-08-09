namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// A signature: this user accepted this exact version of this document, at this
    /// moment, from this address.
    /// </summary>
    /// <remarks>
    /// Never updated and never reused — a new acceptance is a new row, so the history of
    /// what someone agreed to over time stays intact.
    ///
    /// <see cref="IpAddress"/> and <see cref="UserAgent"/> are what turn the row from a
    /// note into evidence; they are the circumstances of the signature, not tracking, and
    /// nothing else in the app reads them.
    ///
    /// Deleting the account deletes these rows with it. That is deliberate: account
    /// deletion here is immediate and irreversible, and keeping a signature tied to a
    /// person who exercised their right to erasure would contradict what the policy says
    /// happens. If counsel later prefers to retain proof of consent under Art. 16, this
    /// becomes a nullable UserId and a restrict on the foreign key.
    /// </remarks>
    public class UserConsent
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int LegalDocumentId { get; set; }
        public DateTime AcceptedAt { get; set; }

        /// <summary>Client address as seen after the reverse proxy headers are applied.</summary>
        public string? IpAddress { get; set; }

        public string? UserAgent { get; set; }

        public User User { get; set; } = null!;
        public LegalDocument LegalDocument { get; set; } = null!;
    }
}
