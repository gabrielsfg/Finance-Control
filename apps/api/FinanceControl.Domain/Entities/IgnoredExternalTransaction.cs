using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    /// A bank transaction the user deleted. Pluggy re-sends the last days on every sync, so
    /// without this record the deleted row would come straight back.
    public class IgnoredExternalTransaction : OwnedEntity
    {
        public string ExternalId { get; set; } = string.Empty;
    }
}
