using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class SendAssistantMessageResponseDto
    {
        /// <summary>
        /// Available when the message was answered (even with the error apology). Any other
        /// value means nothing was sent to the model and no message was stored.
        /// </summary>
        public EnumAiAvailability Status { get; set; }

        public int? ConversationId { get; set; }
        public string? ConversationTitle { get; set; }
        public AiMessageResponseDto? UserMessage { get; set; }
        public AiMessageResponseDto? AssistantMessage { get; set; }

        public int MessagesUsed { get; set; }
        public int MessagesLimit { get; set; }
    }
}
