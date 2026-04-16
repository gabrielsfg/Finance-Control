namespace FinanceControl.Shared.Dtos.Response
{
    public class LoginResult
    {
        public AuthResponseDto? AuthResponse { get; init; }
        public bool IsLockedOut { get; init; }
        public TimeSpan? LockoutRemaining { get; init; }

        public static LoginResult Success(AuthResponseDto auth) => new() { AuthResponse = auth };
        public static LoginResult Locked(TimeSpan remaining) => new() { IsLockedOut = true, LockoutRemaining = remaining };
        public static LoginResult Failed() => new();
    }
}
