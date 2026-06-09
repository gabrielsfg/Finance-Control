namespace FinanceControl.Shared.Dtos.Response
{
    // The refresh token is no longer returned in the response body.
    // It is set as an HttpOnly cookie by the controller so JavaScript
    // cannot read it, eliminating XSS-based token theft.
    public class AuthResponseDto
    {
        public string AccessToken { get; set; } = string.Empty;
    }
}
