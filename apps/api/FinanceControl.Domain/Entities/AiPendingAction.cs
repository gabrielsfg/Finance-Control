using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// A write the assistant proposed and the user has not confirmed yet.
    /// </summary>
    /// <remarks>
    /// The model never writes. Its propose_* tools only create this row; the client shows
    /// it as a confirmation card, and only the user's click runs the regular service call,
    /// through the same validators as the rest of the API. Unconfirmed proposals expire.
    /// </remarks>
    public class AiPendingAction : OwnedEntity
    {
        public int ConversationId { get; set; }

        /// <summary>The assistant message the card belongs to. Null until that message is stored.</summary>
        public int? MessageId { get; set; }

        public EnumAiActionKind Kind { get; set; }

        /// <summary>The request DTO the confirmation will send, as JSON.</summary>
        public string Payload { get; set; } = string.Empty;

        /// <summary>For UpdateTransaction: the transaction being edited.</summary>
        public int? TargetId { get; set; }

        public EnumAiActionStatus Status { get; set; } = EnumAiActionStatus.Pending;
        public DateTime ExpiresAt { get; set; }
        public DateTime? ResolvedAt { get; set; }

        /// <summary>Id of the record created or edited on confirmation.</summary>
        public int? ResultId { get; set; }

        /// <summary>Why a confirmation failed, in the words of the validator or service.</summary>
        public string? Error { get; set; }

        public AiConversation Conversation { get; set; } = null!;
    }
}
