namespace FinanceControl.Shared.Dtos.Response
{
    /// <summary>One row of the conversation list.</summary>
    public class AiConversationItemResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime LastMessageAt { get; set; }
    }
}
