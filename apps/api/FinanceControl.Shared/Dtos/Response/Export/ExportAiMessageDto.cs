using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Export
{
    public class ExportAiMessageDto
    {
        public EnumAiMessageRole Role { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
