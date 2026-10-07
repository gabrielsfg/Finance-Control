using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class ChangeSubscriptionPlanRequestDto
    {
        public EnumSubscriptionPlan Plan { get; set; }
        public EnumBillingCycle Cycle { get; set; }
        public int InstallmentCount { get; set; } = 1;

        /// False returns the preview (new price, when it takes effect) and changes nothing.
        /// The client shows it and calls again with true — a price change is never silent.
        public bool Confirm { get; set; }
    }
}
