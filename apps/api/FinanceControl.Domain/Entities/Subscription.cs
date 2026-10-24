using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    /// A user's paid plan. We run the billing ourselves: Asaas only stores the customer
    /// and processes each charge we create, so the period, the renewal date and the status
    /// here are the source of truth.
    public class Subscription : OwnedEntity
    {
        public EnumSubscriptionPlan Plan { get; set; }
        public EnumBillingCycle Cycle { get; set; }
        public EnumBillingMethod BillingMethod { get; set; }

        /// Installments for the yearly card charge (1 = paid at once). Always 1 otherwise.
        public int InstallmentCount { get; set; } = 1;

        /// Price of one cycle in cents, frozen at signup or at the last plan change.
        public int Price { get; set; }

        public EnumSubscriptionStatus Status { get; set; }
        public EnumSubscriptionEndReason? EndReason { get; set; }

        public DateTime? TrialEndsAt { get; set; }

        /// The period the user has access for. The next charge is due at its end.
        public DateTime CurrentPeriodStart { get; set; }
        public DateTime CurrentPeriodEnd { get; set; }

        public DateTime? CanceledAt { get; set; }
        public DateTime? EndedAt { get; set; }

        /// A plan change that waits for the next renewal (downgrade, cycle switch, or the
        /// price side of an upgrade). Applied when that renewal's charge is created.
        public EnumSubscriptionPlan? PendingPlan { get; set; }
        public EnumBillingCycle? PendingCycle { get; set; }
        public int? PendingInstallmentCount { get; set; }

        /// Granted by an admin: no gateway, no charges, simply ends at CurrentPeriodEnd.
        public bool IsComplimentary { get; set; }

        public List<SubscriptionCharge> Charges { get; set; } = [];
    }
}
