namespace FinanceControl.Shared.Dtos.Response
{
    /// <summary>
    /// A card body both clients can render without knowing each payload type: a title
    /// ("Nova despesa") and label/value lines ("Conta" → "Nubank"). Built on the server so
    /// ids are already resolved to the names the user knows.
    /// </summary>
    public class AiActionPreviewDto
    {
        public string Title { get; set; } = string.Empty;
        public List<AiActionPreviewLineDto> Lines { get; set; } = [];
    }
}
