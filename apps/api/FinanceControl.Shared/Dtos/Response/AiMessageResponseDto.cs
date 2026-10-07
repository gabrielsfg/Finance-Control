using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class AiMessageResponseDto
    {
        public int Id { get; set; }
        public EnumAiMessageRole Role { get; set; }

        /// <summary>Plain text with "-" lists and **bold**; the prompt allows nothing richer.</summary>
        public string Content { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        /// <summary>True for the fixed apology after a provider failure — the client may offer a retry.</summary>
        public bool IsError { get; set; }

        /// <summary>Confirmation cards the assistant attached to this answer.</summary>
        public List<AiActionResponseDto> Actions { get; set; } = [];
    }
}
