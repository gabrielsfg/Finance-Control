using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class CreateFeedbackRequestDto
    {
        public EnumFeedbackType Type { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }

        /// Set by the client ("web" | "mobile"); ignored when it is anything else.
        public string? Source { get; set; }
    }
}
