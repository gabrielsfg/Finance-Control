using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class UserProfileResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        /// <summary>Drives the security section: the toggle state, and whether to offer it at all.</summary>
        public bool TwoFactorEnabled { get; set; }

        public bool EmailVerified { get; set; }

        /// <summary>
        /// The plan the account can use right now, or null without an active subscription.
        /// Read-only mirror of the subscription — GET /api/subscription has the full state.
        /// </summary>
        public EnumSubscriptionPlan? Plan { get; set; }
    }
}
