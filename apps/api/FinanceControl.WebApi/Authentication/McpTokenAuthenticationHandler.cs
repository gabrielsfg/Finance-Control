using System.Security.Claims;
using System.Text.Encodings.Web;
using FinanceControl.Services.Mcp;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace FinanceControl.WebApi.Authentication
{
    /// <summary>
    /// Authenticates /mcp requests with the MCP server's own bearer tokens — OAuth access
    /// tokens and personal tokens — and nothing else. The app's JWTs are not accepted here,
    /// and these tokens are not accepted anywhere else, because each scheme only knows its
    /// own token format.
    /// </summary>
    /// <remarks>
    /// The 401 challenge carries the protected resource metadata URL (RFC 9728), which is
    /// how an MCP client that has never seen this server discovers where to authorize.
    /// </remarks>
    public class McpTokenAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public const string SchemeName = "McpToken";
        public const string ScopeClaim = "scope";
        public const string GrantClaim = "mcp_grant";
        public const string PersonalTokenClaim = "mcp_pat";

        private readonly McpOAuthService _oauthService;
        private readonly McpSettings _settings;

        public McpTokenAuthenticationHandler(
            IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            McpOAuthService oauthService,
            IOptions<McpSettings> settings)
            : base(options, logger, encoder)
        {
            _oauthService = oauthService;
            _settings = settings.Value;
        }

        protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var header = Request.Headers.Authorization.ToString();
            if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                return AuthenticateResult.NoResult();

            var token = header["Bearer ".Length..].Trim();
            if (token.Length == 0)
                return AuthenticateResult.NoResult();

            var principal = await _oauthService.ValidateAccessTokenAsync(token, Context.RequestAborted);
            if (principal is null)
                return AuthenticateResult.Fail("Invalid or expired MCP token.");

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, principal.UserId.ToString())
            };
            claims.AddRange(principal.Scopes.Select(scope => new Claim(ScopeClaim, scope)));

            if (principal.GrantId is { } grantId)
                claims.Add(new Claim(GrantClaim, grantId.ToString()));
            if (principal.PersonalTokenId is { } tokenId)
                claims.Add(new Claim(PersonalTokenClaim, tokenId.ToString()));

            var identity = new ClaimsIdentity(claims, SchemeName);
            return AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName));
        }

        protected override Task HandleChallengeAsync(AuthenticationProperties properties)
        {
            Response.StatusCode = StatusCodes.Status401Unauthorized;
            Response.Headers.WWWAuthenticate =
                $"Bearer resource_metadata=\"{_settings.Issuer}/.well-known/oauth-protected-resource/mcp\", " +
                $"scope=\"{McpScopes.Join(McpScopes.All)}\"";
            return Task.CompletedTask;
        }
    }
}
