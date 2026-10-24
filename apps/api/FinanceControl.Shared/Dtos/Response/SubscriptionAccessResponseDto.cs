using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    /// What a user may use right now. Plan is null when there is no access.
    public class SubscriptionAccessResponseDto
    {
        public bool HasAccess { get; set; }
        public EnumSubscriptionPlan? Plan { get; set; }

        public bool IsPremium => HasAccess && Plan == EnumSubscriptionPlan.Premium;
    }
}
