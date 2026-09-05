using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    /// A bug report or an idea sent from inside the app. Write-only from the
    /// client's side: it is created and then read straight from the database
    /// during triage, so there is no endpoint that lists it back.
    public class UserFeedback : OwnedEntity
    {
        public EnumFeedbackType Type { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public EnumFeedbackStatus Status { get; set; } = EnumFeedbackStatus.New;

        /// Which client it came from ("web", "mobile"). Kept because the same
        /// complaint often only reproduces on one of them.
        public string? Source { get; set; }
    }
}
