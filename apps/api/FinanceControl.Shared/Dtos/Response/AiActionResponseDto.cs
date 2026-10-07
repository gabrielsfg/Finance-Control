using System.Text.Json;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    /// <summary>A confirmation card: what the assistant proposes to write.</summary>
    public class AiActionResponseDto
    {
        public int Id { get; set; }
        public EnumAiActionKind Kind { get; set; }

        /// <summary>
        /// Pending until the user confirms or cancels. A pending card past ExpiresAt is
        /// returned as Expired and can no longer be confirmed.
        /// </summary>
        public EnumAiActionStatus Status { get; set; }

        /// <summary>
        /// The request that confirming sends: CreateTransactionRequestDto,
        /// UpdateTransactionRequestDto, CreateGoalRequestDto or CreateBudgetRequestDto,
        /// camelCase. Clients edit fields of this object and send it back on confirm.
        /// </summary>
        public JsonElement Payload { get; set; }

        /// <summary>For UpdateTransaction: the transaction being edited.</summary>
        public int? TargetId { get; set; }

        /// <summary>Ready-to-render title and label/value lines, with names resolved.</summary>
        public AiActionPreviewDto Preview { get; set; } = new();

        public DateTime ExpiresAt { get; set; }

        /// <summary>Id of the record created or edited once confirmed.</summary>
        public int? ResultId { get; set; }

        public string? Error { get; set; }
    }
}
