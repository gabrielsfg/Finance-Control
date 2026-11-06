using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// An application access record as the Marco Civil da Internet defines it (art. 5º, VIII
    /// and art. 15): who used the app, when, and from which IP address and source port. Kept
    /// for six months.
    /// </summary>
    /// <remarks>
    /// UserId is a plain column, not a foreign key: the legal duty to keep the record
    /// outlives the account, so deleting the user must not take these rows with it. One
    /// row per user, address and hour is enough to answer a court order — not one per
    /// request.
    /// </remarks>
    public class AccessLog : BaseEntity
    {
        public int UserId { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public int? SourcePort { get; set; }
    }
}
