namespace FinanceControl.Shared.Dtos.Response
{
    public class AiConversationResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime LastMessageAt { get; set; }

        /// <summary>Oldest first, as the chat renders them.</summary>
        public List<AiMessageResponseDto> Messages { get; set; } = [];
    }
}
