using System.Security.Cryptography;
using System.Text;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Mcp;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Tests.Helpers;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace FinanceControl.Tests.Unit
{
    /// <summary>
    /// The MCP connector's authorization server, end to end on an in-memory database:
    /// what an AI client does to connect, and the ways it must fail.
    /// </summary>
    public class McpOAuthServiceTests
    {
        private const string RedirectUri = "https://claude.ai/api/mcp/auth_callback";
        private const string Verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk-verifier-long-enough";

        private static readonly McpSettings Settings = new()
        {
            PublicBaseUrl = "https://api.quantia.test",
            WebBaseUrl = "https://app.quantia.test"
        };

        private static string Challenge(string verifier) =>
            Convert.ToBase64String(SHA256.HashData(Encoding.ASCII.GetBytes(verifier)))
                .TrimEnd('=').Replace('+', '-').Replace('/', '_');

        private static (McpOAuthService Service, ApplicationDbContext Context) Create()
        {
            var context = DbContextHelper.CreateInMemory();
            context.Users.Add(new User { Id = 1, Email = "a@b.com", Name = "Ana", PasswordHash = "x" });
            context.Users.Add(new User { Id = 2, Email = "c@d.com", Name = "Bia", PasswordHash = "x" });
            context.SaveChanges();

            var resolver = new McpClientResolver(context, Mock.Of<IHttpClientFactory>(), NullLogger<McpClientResolver>.Instance);
            return (new McpOAuthService(context, resolver, Options.Create(Settings)), context);
        }

        private static async Task<(string ClientId, string Code)> ConnectAsync(McpOAuthService service, int userId = 1, string? scope = null)
        {
            var client = (await service.RegisterClientAsync(new McpClientRegistration("Claude", null, [RedirectUri], "none"))).Value!;

            var outcome = await service.AuthorizeAsync("code", client.ClientId, RedirectUri, Challenge(Verifier), "S256", scope, "xyz", Settings.ResourceUrl);
            var requestId = QueryHelpers.ParseQuery(new Uri(outcome.RedirectUrl!).Query)["request"].ToString();

            var decision = await service.ApproveAsync(requestId, new ApproveMcpAuthorizationRequestDto(), userId);
            var code = QueryHelpers.ParseQuery(new Uri(decision.Value!.RedirectUrl).Query)["code"].ToString();

            return (client.ClientId, code);
        }

        [Fact]
        public async Task FullFlow_IssuesTokensThatResolveToTheConsentingUser()
        {
            var (service, _) = Create();
            var (clientId, code) = await ConnectAsync(service, userId: 2);

            var tokens = await service.ExchangeCodeAsync(code, clientId, RedirectUri, Verifier);

            Assert.Null(tokens.Error);
            Assert.StartsWith(McpTokenHelper.AccessTokenPrefix, tokens.AccessToken);

            var principal = await service.ValidateAccessTokenAsync(tokens.AccessToken!);
            Assert.NotNull(principal);
            Assert.Equal(2, principal!.UserId);
            Assert.Equal(McpScopes.All.OrderBy(s => s), principal.Scopes.OrderBy(s => s));
        }

        [Fact]
        public async Task Authorize_RedirectsToTheWebConsentPage()
        {
            var (service, _) = Create();
            var client = (await service.RegisterClientAsync(new McpClientRegistration("Claude", null, [RedirectUri], null))).Value!;

            var outcome = await service.AuthorizeAsync("code", client.ClientId, RedirectUri, Challenge(Verifier), "S256", null, "s", null);

            Assert.StartsWith("https://app.quantia.test/oauth/consent?request=", outcome.RedirectUrl);
        }

        [Fact]
        public async Task Authorize_WithUnregisteredRedirect_FailsWithoutRedirecting()
        {
            var (service, _) = Create();
            var client = (await service.RegisterClientAsync(new McpClientRegistration("Claude", null, [RedirectUri], null))).Value!;

            var outcome = await service.AuthorizeAsync("code", client.ClientId, "https://evil.example/cb", Challenge(Verifier), "S256", null, null, null);

            Assert.Null(outcome.RedirectUrl);
            Assert.Equal("invalid_request", outcome.DirectError!.Error);
        }

        [Fact]
        public async Task Authorize_WithoutPkce_ReturnsErrorToTheClient()
        {
            var (service, _) = Create();
            var client = (await service.RegisterClientAsync(new McpClientRegistration("Claude", null, [RedirectUri], null))).Value!;

            var outcome = await service.AuthorizeAsync("code", client.ClientId, RedirectUri, null, null, null, "s", null);

            Assert.StartsWith(RedirectUri, outcome.RedirectUrl);
            Assert.Contains("error=invalid_request", outcome.RedirectUrl);
        }

        [Fact]
        public async Task Exchange_WithWrongVerifier_Fails()
        {
            var (service, _) = Create();
            var (clientId, code) = await ConnectAsync(service);

            var tokens = await service.ExchangeCodeAsync(code, clientId, RedirectUri, new string('a', 50));

            Assert.Equal("invalid_grant", tokens.Error!.Error);
        }

        [Fact]
        public async Task Exchange_CodeIsSingleUse()
        {
            var (service, _) = Create();
            var (clientId, code) = await ConnectAsync(service);

            await service.ExchangeCodeAsync(code, clientId, RedirectUri, Verifier);
            var second = await service.ExchangeCodeAsync(code, clientId, RedirectUri, Verifier);

            Assert.Equal("invalid_grant", second.Error!.Error);
        }

        [Fact]
        public async Task Refresh_RotatesTokens_AndTheOldAccessTokenStopsWorking()
        {
            var (service, _) = Create();
            var (clientId, code) = await ConnectAsync(service);
            var first = await service.ExchangeCodeAsync(code, clientId, RedirectUri, Verifier);

            var second = await service.RefreshAsync(first.RefreshToken, clientId);

            Assert.Null(second.Error);
            Assert.Null(await service.ValidateAccessTokenAsync(first.AccessToken!));
            Assert.NotNull(await service.ValidateAccessTokenAsync(second.AccessToken!));
            Assert.Equal("invalid_grant", (await service.RefreshAsync(first.RefreshToken, clientId)).Error!.Error);
        }

        [Fact]
        public async Task RevokingTheConnection_InvalidatesItsTokensImmediately()
        {
            var (service, context) = Create();
            var (clientId, code) = await ConnectAsync(service);
            var tokens = await service.ExchangeCodeAsync(code, clientId, RedirectUri, Verifier);
            var grantId = context.McpGrants.Single().Id;

            var result = await service.RevokeConnectionAsync(grantId, userId: 1);

            Assert.True(result.IsSuccess);
            Assert.Null(await service.ValidateAccessTokenAsync(tokens.AccessToken!));
        }

        [Fact]
        public async Task RevokeConnection_OfAnotherUser_IsRefused()
        {
            var (service, context) = Create();
            var (clientId, code) = await ConnectAsync(service, userId: 1);
            await service.ExchangeCodeAsync(code, clientId, RedirectUri, Verifier);

            var result = await service.RevokeConnectionAsync(context.McpGrants.Single().Id, userId: 2);

            Assert.True(result.IsFailure);
        }

        [Fact]
        public async Task Approve_WithSubsetOfScopes_GrantsOnlyThose()
        {
            var (service, _) = Create();
            var client = (await service.RegisterClientAsync(new McpClientRegistration("Claude", null, [RedirectUri], null))).Value!;
            var outcome = await service.AuthorizeAsync("code", client.ClientId, RedirectUri, Challenge(Verifier), "S256", null, null, null);
            var requestId = QueryHelpers.ParseQuery(new Uri(outcome.RedirectUrl!).Query)["request"].ToString();

            var decision = await service.ApproveAsync(requestId, new ApproveMcpAuthorizationRequestDto { Scopes = [McpScopes.Finance] }, 1);
            var code = QueryHelpers.ParseQuery(new Uri(decision.Value!.RedirectUrl).Query)["code"].ToString();
            var tokens = await service.ExchangeCodeAsync(code, client.ClientId, RedirectUri, Verifier);

            var principal = await service.ValidateAccessTokenAsync(tokens.AccessToken!);
            Assert.Equal([McpScopes.Finance], principal!.Scopes);
        }

        [Fact]
        public async Task Deny_SendsAccessDeniedToTheClient()
        {
            var (service, _) = Create();
            var client = (await service.RegisterClientAsync(new McpClientRegistration("Claude", null, [RedirectUri], null))).Value!;
            var outcome = await service.AuthorizeAsync("code", client.ClientId, RedirectUri, Challenge(Verifier), "S256", null, "st", null);
            var requestId = QueryHelpers.ParseQuery(new Uri(outcome.RedirectUrl!).Query)["request"].ToString();

            var decision = await service.DenyAsync(requestId, 1);

            Assert.Contains("error=access_denied", decision.Value!.RedirectUrl);
            Assert.Contains("state=st", decision.Value.RedirectUrl);
        }

        [Fact]
        public async Task Register_RejectsPlainHttpRedirectOutsideLoopback()
        {
            var (service, _) = Create();

            var result = await service.RegisterClientAsync(new McpClientRegistration("X", null, ["http://example.com/cb"], null));

            Assert.True(result.IsFailure);
        }

        [Fact]
        public async Task LoopbackRedirect_MayUseAnyPort()
        {
            var (service, _) = Create();
            var client = (await service.RegisterClientAsync(new McpClientRegistration("Claude Code", null, ["http://localhost:33418/callback"], null))).Value!;

            var outcome = await service.AuthorizeAsync("code", client.ClientId, "http://localhost:51234/callback", Challenge(Verifier), "S256", null, null, null);

            Assert.NotNull(outcome.RedirectUrl);
            Assert.Contains("/oauth/consent", outcome.RedirectUrl);
        }

        [Fact]
        public async Task PersonalToken_ResolvesWithItsScopes_AndStopsAfterRevocation()
        {
            var (service, _) = Create();

            var created = await service.CreatePersonalTokenAsync(new CreateMcpPersonalTokenRequestDto
            {
                Name = "Codex",
                Scopes = [McpScopes.Transactions],
                ExpiresInDays = 30
            }, userId: 1);

            var principal = await service.ValidateAccessTokenAsync(created.Token);
            Assert.Equal(1, principal!.UserId);
            Assert.Equal([McpScopes.Transactions], principal.Scopes);

            await service.RevokePersonalTokenAsync(created.Item.Id, userId: 1);
            Assert.Null(await service.ValidateAccessTokenAsync(created.Token));
        }

        [Fact]
        public async Task AppStyleJwt_IsNeverAcceptedAsAnMcpToken()
        {
            var (service, _) = Create();

            Assert.Null(await service.ValidateAccessTokenAsync("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig"));
        }

        [Fact]
        public void Pkce_AcceptsTheMatchingVerifierOnly()
        {
            Assert.True(McpTokenHelper.VerifyPkce(Verifier, Challenge(Verifier)));
            Assert.False(McpTokenHelper.VerifyPkce(Verifier + "x", Challenge(Verifier)));
            Assert.False(McpTokenHelper.VerifyPkce("short", Challenge("short")));
        }
    }
}
