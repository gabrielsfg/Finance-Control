using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    /// Echo of what was just stored — the client only needs it to confirm the
    /// submission landed.
    public class GetFeedbackResponseDto
    {
        public int Id { get; set; }
        public EnumFeedbackType Type { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public EnumFeedbackStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
