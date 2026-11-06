using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// A CPF (as its HMAC) that already had the free trial. Kept apart from the billing
    /// profile so it survives the account: deleting an account and signing up again with
    /// the same CPF must not grant a second trial. Deleted after the retention period.
    /// </summary>
    public class TrialUsage : BaseEntity
    {
        public string CpfHash { get; set; } = string.Empty;
        public DateTime UsedAt { get; set; }
    }
}
