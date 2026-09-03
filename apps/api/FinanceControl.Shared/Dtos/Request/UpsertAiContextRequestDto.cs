namespace FinanceControl.Shared.Dtos.Request
{
    /// <summary>
    /// Free text the user writes to qualify the current month. Reaches the model as data,
    /// never as instruction.
    /// </summary>
    public class UpsertAiContextRequestDto
    {
        public string Text { get; set; } = string.Empty;
    }
}
