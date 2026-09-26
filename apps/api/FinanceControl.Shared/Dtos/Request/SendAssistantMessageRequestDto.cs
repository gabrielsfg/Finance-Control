namespace FinanceControl.Shared.Dtos.Request
{
    public class SendAssistantMessageRequestDto
    {
        /// <summary>Null starts a new conversation.</summary>
        public int? ConversationId { get; set; }

        public string Message { get; set; } = string.Empty;
    }
}
