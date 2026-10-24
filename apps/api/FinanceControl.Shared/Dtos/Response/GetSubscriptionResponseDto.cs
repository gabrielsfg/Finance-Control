using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    /// <summary>Everything the clients need to render the subscription state.</summary>
    /// <remarks>
    /// With no live subscription this describes the last one that ended (so the client can
    /// say "canceled for lack of payment"), or is empty apart from <see cref="HasAccess"/>
    /// when the user never subscribed.
    /// </remarks>
    public class GetSubscriptionResponseDto
    {
        public bool HasAccess { get; set; }

        public EnumSubscriptionStatus? Status { get; set; }
        public EnumSubscriptionEndReason? EndReason { get; set; }
        public EnumSubscriptionPlan? Plan { get; set; }
        public EnumBillingCycle? Cycle { get; set; }
        public EnumBillingMethod? BillingMethod { get; set; }
        public int InstallmentCount { get; set; } = 1;

        /// Cents per cycle.
        public int? Price { get; set; }

        public DateTime? TrialEndsAt { get; set; }
        public DateTime? CurrentPeriodStart { get; set; }
        public DateTime? CurrentPeriodEnd { get; set; }
        public DateTime? CanceledAt { get; set; }
        public DateTime? EndedAt { get; set; }
        public bool IsComplimentary { get; set; }

        public string? CardBrand { get; set; }
        public string? CardLast4 { get; set; }

        public SubscriptionPendingChangeResponseDto? PendingChange { get; set; }

        /// The unpaid Pix/Boleto charge, when there is one.
        public SubscriptionChargeResponseDto? PendingCharge { get; set; }

        /// Pix/Boleto in the last days of the period with the renewal unpaid: the client
        /// shows the renewal banner on every visit while this is true.
        public bool ShowRenewalReminder { get; set; }

        public bool CanRequestRefund { get; set; }
        public bool CanResume { get; set; }

        public List<SubscriptionChargeResponseDto> Charges { get; set; } = [];
    }
}
