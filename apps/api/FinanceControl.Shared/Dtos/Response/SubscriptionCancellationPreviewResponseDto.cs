using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    /// <summary>What canceling now would do, shown before the user confirms. Amounts in cents.</summary>
    public class SubscriptionCancellationPreviewResponseDto
    {
        public EnumCancellationKind Kind { get; set; }

        /// When access ends (null when it ends at once).
        public DateTime? AccessUntil { get; set; }

        public int RefundAmount { get; set; }
        public int FeeAmount { get; set; }

        /// Yearly early termination: months started, the current one included.
        public int? MonthsUsed { get; set; }

        /// The refund cannot go back by API (boleto) and is paid by Pix or transfer.
        public bool RefundIsManual { get; set; }
    }
}
