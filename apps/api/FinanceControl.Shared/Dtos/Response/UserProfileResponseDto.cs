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

        /// <summary>Which features the account is entitled to. The web client already declared this field; it now has a source.</summary>
        public EnumUserPlan Plan { get; set; }
    }
}
