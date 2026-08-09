using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class LoginResult
    {
        // AuthTokensDto carries both tokens internally; the controller
        // puts the refresh token in an HttpOnly cookie and the access
        // token in the response body only.
        public AuthTokensDto? AuthResponse { get; init; }
        public bool IsLockedOut { get; init; }
        public TimeSpan? LockoutRemaining { get; init; }

        /// <summary>
        /// Set when the password was accepted but the login cannot complete yet. The
        /// distinction matters: a wrong password and a pending challenge look the same
        /// to the client otherwise, and only one of them should send the user to a
        /// code screen.
        /// </summary>
        public EnumLoginChallenge? Challenge { get; init; }

        /// <summary>Handle for the second step. Only set for <see cref="EnumLoginChallenge.TwoFactorRequired"/>.</summary>
        public string? ChallengeToken { get; init; }

        /// <summary>
        /// The password was right and a code was needed, but the email never left. Kept
        /// apart from a plain failure: nothing is wrong with the credentials, and telling
        /// the user "email ou senha inválidos" would send them to reset a working password.
        /// </summary>
        public bool EmailDeliveryFailed { get; init; }

        public static LoginResult Success(AuthTokensDto auth) => new() { AuthResponse = auth };
        public static LoginResult Locked(TimeSpan remaining) => new() { IsLockedOut = true, LockoutRemaining = remaining };
        public static LoginResult Failed() => new();

        public static LoginResult EmailNotVerified() =>
            new() { Challenge = EnumLoginChallenge.EmailNotVerified };

        public static LoginResult TwoFactorRequired(string challengeToken) =>
            new() { Challenge = EnumLoginChallenge.TwoFactorRequired, ChallengeToken = challengeToken };

        public static LoginResult DeliveryFailed() => new() { EmailDeliveryFailed = true };
    }
}
