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

        public static LoginResult Success(AuthTokensDto auth) => new() { AuthResponse = auth };
        public static LoginResult Locked(TimeSpan remaining) => new() { IsLockedOut = true, LockoutRemaining = remaining };
        public static LoginResult Failed() => new();
    }
}
