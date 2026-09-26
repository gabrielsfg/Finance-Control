using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// One turn of a conversation, as the user saw it. Tool calls are recorded by name
    /// for support; their payloads are not kept, since they are rebuilt from the database
    /// on every question anyway.
    /// </summary>
    public class AiMessage : OwnedEntity
    {
        public int ConversationId { get; set; }
        public EnumAiMessageRole Role { get; set; }
        public string Content { get; set; } = string.Empty;

        /// <summary>JSON array of the tool names the assistant called to write this answer.</summary>
        public string? ToolCalls { get; set; }

        public int InputTokens { get; set; }
        public int OutputTokens { get; set; }

        /// <summary>True when the text is the fixed apology written after a provider failure.</summary>
        public bool IsError { get; set; }

        public AiConversation Conversation { get; set; } = null!;
    }
}
