namespace FinanceControl.Shared.Dtos.Response.Export
{
    public class ExportAiConversationDto
    {
        public string Title { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string? Summary { get; set; }
        public List<ExportAiMessageDto> Messages { get; set; } = [];
    }
}
