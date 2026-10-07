using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    /// Which billing email went out, keyed so the hourly job can run again and again
    /// without anyone getting the same reminder twice.
    public class BillingEmailLog : OwnedEntity
    {
        public string Key { get; set; } = string.Empty;
    }
}
