using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// One chat thread with the in-app assistant. Kept until the user deletes it; deleted
    /// with the account.
    /// </summary>
    public class AiConversation : OwnedEntity
    {
        /// <summary>The first question, trimmed — enough to find the thread again in the list.</summary>
        public string Title { get; set; } = string.Empty;

        public DateTime LastMessageAt { get; set; }

        /// <summary>
        /// Short summary of the turns already folded out of the model's window, replayed in
        /// their place so a long thread keeps its context. Null until the first block closes.
        /// </summary>
        public string? Summary { get; set; }

        /// <summary>Last message the summary covers; later messages are sent to the model verbatim.</summary>
        public int? SummarizedUntilMessageId { get; set; }

        public User User { get; set; } = null!;
        public ICollection<AiMessage> Messages { get; set; } = [];
        public ICollection<AiPendingAction> Actions { get; set; } = [];
    }
}
