using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    /// <summary>
    /// Answer to a login whose password was right but which cannot issue tokens yet.
    /// Carries why, and the handle needed to finish the flow.
    /// </summary>
    public class LoginChallengeResponseDto
    {
        public EnumLoginChallenge Challenge { get; set; }

        /// <summary>
        /// Present only for <see cref="EnumLoginChallenge.TwoFactorRequired"/>: hand it back
        /// to <c>login/two-factor</c> along with the code. It is what proves the password
        /// step happened, so the second step cannot be attacked with an email address alone.
        /// </summary>
        public string? ChallengeToken { get; set; }
    }
}
