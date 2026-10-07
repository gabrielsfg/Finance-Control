using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    /// A plan change waiting for the next renewal.
    public class SubscriptionPendingChangeResponseDto
    {
        public EnumSubscriptionPlan Plan { get; set; }
        public EnumBillingCycle Cycle { get; set; }
        public int InstallmentCount { get; set; }

        /// Cents per cycle from the renewal on.
        public int Price { get; set; }
        public DateTime EffectiveAt { get; set; }
    }
}
