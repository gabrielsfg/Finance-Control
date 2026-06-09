namespace FinanceControl.Shared.Dtos.Response
{
    // Internal transport object — carries both tokens from the service layer
    // to the controller. The controller sets the refresh token as an HttpOnly
    // cookie and only exposes the access token in the response body via AuthResponseDto.
    public class AuthTokensDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
    }
}
