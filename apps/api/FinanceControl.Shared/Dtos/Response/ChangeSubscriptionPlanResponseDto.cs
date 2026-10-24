using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class ChangeSubscriptionPlanResponseDto
    {
        public EnumSubscriptionPlan Plan { get; set; }
        public EnumBillingCycle Cycle { get; set; }
        public int InstallmentCount { get; set; }

        /// Cents per cycle once the change is in force.
        public int Price { get; set; }

        /// When the new price is first charged.
        public DateTime NextChargeAt { get; set; }

        /// True when the new plan's features unlock right away (trial, or an upgrade).
        public bool PlanAppliesNow { get; set; }

        /// False for a preview.
        public bool Applied { get; set; }

        /// The updated state, after a confirmed change.
        public GetSubscriptionResponseDto? Subscription { get; set; }
    }
}
