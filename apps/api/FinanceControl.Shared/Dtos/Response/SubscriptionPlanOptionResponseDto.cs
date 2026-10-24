using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class SubscriptionPlanOptionResponseDto
    {
        public EnumSubscriptionPlan Plan { get; set; }
        public string Name { get; set; } = string.Empty;
        public EnumBillingCycle Cycle { get; set; }

        /// Cents per cycle.
        public int Price { get; set; }

        /// Cents per month — the yearly price divided by 12, for the "R$ 29,17/mês" line.
        public int MonthlyEquivalent { get; set; }

        /// 1 when the option cannot be split.
        public int MaxInstallments { get; set; }
    }
}
