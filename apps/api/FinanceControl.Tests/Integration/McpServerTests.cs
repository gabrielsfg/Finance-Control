using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Mcp;
using FinanceControl.Shared.Dtos.Request;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace FinanceControl.Tests.Integration
{
    /// <summary>
    /// The MCP server as an AI client sees it, hosted in memory: discovery, the 401 that
    /// points to the metadata, the JSON-RPC handshake, scope filtering and a real tool call.
    /// No real database and no model provider are involved.
    /// </summary>
    public class McpServerTests : IClassFixture<McpServerTests.Factory>
    {
        private readonly Factory _factory;

        public McpServerTests(Factory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task ProtectedResourceMetadata_PointsToThisAuthorizationServer()
        {
            var client = _factory.CreateClient();

            var json = await client.GetStringAsync("/.well-known/oauth-protected-resource/mcp");
            using var document = JsonDocument.Parse(json);

            Assert.Equal("http://localhost:5112/mcp", document.RootElement.GetProperty("resource").GetString());
            Assert.Equal("http://localhost:5112", document.RootElement.GetProperty("authorization_servers")[0].GetString());
        }

        [Fact]
        public async Task AuthorizationServerMetadata_AdvertisesPkceAndRegistration()
        {
            var client = _factory.CreateClient();

            using var document = JsonDocument.Parse(await client.GetStringAsync("/.well-known/oauth-authorization-server"));
            var root = document.RootElement;

            Assert.Equal("S256", root.GetProperty("code_challenge_methods_supported")[0].GetString());
            Assert.EndsWith("/oauth/register", root.GetProperty("registration_endpoint").GetString());
            Assert.True(root.GetProperty("client_id_metadata_document_supported").GetBoolean());
        }

        [Fact]
        public async Task McpWithoutToken_Returns401WithResourceMetadata()
        {
            var client = _factory.CreateClient();

            var response = await client.SendAsync(JsonRpc("initialize", InitializeParams(), token: null));

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            Assert.Contains("resource_metadata=", response.Headers.WwwAuthenticate.ToString());
        }

        [Fact]
        public async Task McpWithUnknownToken_Returns401()
        {
            var client = _factory.CreateClient();

            var response = await client.SendAsync(JsonRpc("initialize", InitializeParams(), token: "qtm_pat_not-a-real-token"));

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task PersonalToken_ListsOnlyTheToolsOfItsScopes_AndCallsThem()
        {
            var token = await _factory.CreatePersonalTokenAsync([McpScopes.Finance]);
            var client = _factory.CreateClient();

            var init = await client.SendAsync(JsonRpc("initialize", InitializeParams(), token));
            Assert.Equal(HttpStatusCode.OK, init.StatusCode);

            var list = await ReadResultAsync(await client.SendAsync(JsonRpc("tools/list", new { }, token)));
            var names = list.GetProperty("tools").EnumerateArray().Select(t => t.GetProperty("name").GetString()).ToList();

            Assert.Contains("list_tags", names);
            Assert.Contains("list_accounts", names);
            Assert.DoesNotContain("search_transactions", names);
            Assert.DoesNotContain(names, n => n!.StartsWith("propose_"));

            var call = await ReadResultAsync(await client.SendAsync(JsonRpc("tools/call", new { name = "list_tags", arguments = new { } }, token)));
            Assert.False(call.TryGetProperty("isError", out var isError) && isError.GetBoolean());
            var text = call.GetProperty("content")[0].GetProperty("text").GetString();
            Assert.Contains("Viagem", text);
        }

        [Fact]
        public async Task CallingAToolOutsideTheGrantedScopes_IsAnError()
        {
            var token = await _factory.CreatePersonalTokenAsync([McpScopes.Market]);
            var client = _factory.CreateClient();
            await client.SendAsync(JsonRpc("initialize", InitializeParams(), token));

            var call = await ReadResultAsync(await client.SendAsync(JsonRpc("tools/call", new { name = "list_tags", arguments = new { } }, token)));

            Assert.True(call.GetProperty("isError").GetBoolean());
        }

        [Fact]
        public async Task ProposalTools_CannotBeCalledOverMcp()
        {
            var token = await _factory.CreatePersonalTokenAsync(McpScopes.All.ToList());
            var client = _factory.CreateClient();
            await client.SendAsync(JsonRpc("initialize", InitializeParams(), token));

            var call = await ReadResultAsync(await client.SendAsync(JsonRpc("tools/call",
                new { name = "propose_goal", arguments = new { name = "x", type = "Item", targetAmount = 100, targetDate = "2027-01-01" } }, token)));

            Assert.True(call.GetProperty("isError").GetBoolean());
        }

        [Fact]
        public async Task McpToken_DoesNotOpenTheRestOfTheApi()
        {
            var token = await _factory.CreatePersonalTokenAsync(McpScopes.All.ToList());
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.GetAsync("/api/tag");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task OAuthFlowOverHttp_ConnectsAnAiClient()
        {
            await _factory.CreatePersonalTokenAsync([McpScopes.Finance]); // seeds the user
            var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
            const string redirectUri = "https://claude.ai/api/mcp/auth_callback";
            const string verifier = "integration-test-verifier-0123456789-abcdefghijklmnopqrstuvwxyz";
            var challenge = Convert.ToBase64String(System.Security.Cryptography.SHA256.HashData(Encoding.ASCII.GetBytes(verifier)))
                .TrimEnd('=').Replace('+', '-').Replace('/', '_');

            // 1. Dynamic client registration.
            var registration = await client.PostAsync("/oauth/register", new StringContent(
                JsonSerializer.Serialize(new { client_name = "Claude", redirect_uris = new[] { redirectUri }, token_endpoint_auth_method = "none" }),
                Encoding.UTF8, "application/json"));
            Assert.Equal(HttpStatusCode.Created, registration.StatusCode);
            using var registered = JsonDocument.Parse(await registration.Content.ReadAsStringAsync());
            var clientId = registered.RootElement.GetProperty("client_id").GetString()!;

            // 2. Authorize: the browser is sent to the web consent page.
            var authorize = await client.GetAsync(
                $"/oauth/authorize?response_type=code&client_id={Uri.EscapeDataString(clientId)}&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
                $"&code_challenge={challenge}&code_challenge_method=S256&state=abc&scope={Uri.EscapeDataString("finance:read")}");
            Assert.Equal(HttpStatusCode.Redirect, authorize.StatusCode);
            var consentUrl = authorize.Headers.Location!;
            var requestId = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(consentUrl.Query)["request"].ToString();

            // 3. The logged-in user approves on the consent page (app JWT).
            var web = _factory.CreateClient();
            web.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _factory.CreateAppJwt(userId: 1));
            var details = await web.GetAsync($"/api/oauth/requests/{requestId}");
            Assert.Equal(HttpStatusCode.OK, details.StatusCode);
            var approve = await web.PostAsync($"/api/oauth/requests/{requestId}/approve", new StringContent("{}", Encoding.UTF8, "application/json"));
            using var decision = JsonDocument.Parse(await approve.Content.ReadAsStringAsync());
            var callback = new Uri(decision.RootElement.GetProperty("redirectUrl").GetString()!);
            var callbackQuery = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(callback.Query);
            Assert.Equal("abc", callbackQuery["state"].ToString());

            // 4. Token exchange with PKCE.
            var token = await client.PostAsync("/oauth/token", new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "authorization_code",
                ["code"] = callbackQuery["code"].ToString(),
                ["client_id"] = clientId,
                ["redirect_uri"] = redirectUri,
                ["code_verifier"] = verifier
            }));
            Assert.Equal(HttpStatusCode.OK, token.StatusCode);
            using var tokens = JsonDocument.Parse(await token.Content.ReadAsStringAsync());
            var accessToken = tokens.RootElement.GetProperty("access_token").GetString()!;

            // 5. The AI can now use /mcp — with the scope it was granted, and only that.
            var init = await client.SendAsync(JsonRpc("initialize", InitializeParams(), accessToken));
            Assert.Equal(HttpStatusCode.OK, init.StatusCode);
            var list = await ReadResultAsync(await client.SendAsync(JsonRpc("tools/list", new { }, accessToken)));
            var names = list.GetProperty("tools").EnumerateArray().Select(t => t.GetProperty("name").GetString()).ToList();
            Assert.Contains("get_overview", names);
            Assert.DoesNotContain("get_portfolio", names);
        }

        [Fact]
        public async Task AppJwt_DoesNotOpenMcp()
        {
            await _factory.CreatePersonalTokenAsync([McpScopes.Finance]);
            var client = _factory.CreateClient();

            var response = await client.SendAsync(JsonRpc("initialize", InitializeParams(), _factory.CreateAppJwt(userId: 1)));

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        private static object InitializeParams() => new
        {
            protocolVersion = "2025-06-18",
            capabilities = new { },
            clientInfo = new { name = "tests", version = "1.0" }
        };

        private static int _nextId;

        private static HttpRequestMessage JsonRpc(string method, object @params, string? token)
        {
            var body = JsonSerializer.Serialize(new { jsonrpc = "2.0", id = Interlocked.Increment(ref _nextId), method, @params });
            var request = new HttpRequestMessage(HttpMethod.Post, "/mcp")
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json")
            };
            request.Headers.Accept.ParseAdd("application/json");
            request.Headers.Accept.ParseAdd("text/event-stream");
            request.Headers.Add("MCP-Protocol-Version", "2025-06-18");
            if (token is not null)
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            return request;
        }

        /// <summary>Reads a JSON-RPC result from either a plain JSON body or an SSE stream.</summary>
        private static async Task<JsonElement> ReadResultAsync(HttpResponseMessage response)
        {
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var raw = await response.Content.ReadAsStringAsync();

            var json = raw.TrimStart().StartsWith('{')
                ? raw
                : string.Join('\n', raw.Split('\n')
                    .Where(line => line.StartsWith("data:"))
                    .Select(line => line["data:".Length..].Trim()));

            using var document = JsonDocument.Parse(json);
            Assert.True(document.RootElement.TryGetProperty("result", out var result), raw);
            return result.Clone();
        }

        public sealed class Factory : WebApplicationFactory<Program>
        {
            private const string JwtKey = "integration-tests-secret-key-that-is-long-enough";
            private readonly string _databaseName = "mcp-tests-" + Guid.NewGuid();

            protected override void ConfigureWebHost(IWebHostBuilder builder)
            {
                builder.UseEnvironment("Development");
                builder.UseSetting("AppSettings:Token", JwtKey);
                builder.UseSetting("AppSettings:Issuer", "http://localhost:5112");
                builder.UseSetting("AppSettings:Audience", "http://localhost:5112");
                builder.UseSetting("ConnectionStrings:DefaultConnection", "Host=unused");
                builder.UseSetting("AnthropicSettings:Enabled", "false");
                builder.UseSetting("McpSettings:PublicBaseUrl", "http://localhost:5112");

                builder.ConfigureTestServices(services =>
                {
                    services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
                    services.RemoveAll<Microsoft.EntityFrameworkCore.Infrastructure.IDbContextOptionsConfiguration<ApplicationDbContext>>();
                    services.RemoveAll<IDbContextFactory<ApplicationDbContext>>();
                    services.RemoveAll<ApplicationDbContext>();
                    services.RemoveAll<IHostedService>();

                    // Same shape as Program.cs: a scoped factory, which also registers the context.
                    services.AddDbContextFactory<ApplicationDbContext>(options => options
                        .UseInMemoryDatabase(_databaseName)
                        .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning)),
                        ServiceLifetime.Scoped);
                });
            }

            /// <summary>A token shaped like the ones UserService issues for the web app.</summary>
            public string CreateAppJwt(int userId)
            {
                var key = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtKey));
                var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken(
                    issuer: "http://localhost:5112",
                    audience: "http://localhost:5112",
                    claims: [new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, userId.ToString())],
                    expires: DateTime.UtcNow.AddMinutes(10),
                    signingCredentials: new Microsoft.IdentityModel.Tokens.SigningCredentials(key, Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256));

                return new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(token);
            }

            public async Task<string> CreatePersonalTokenAsync(List<string> scopes)
            {
                using var scope = Services.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                if (!await context.Users.AnyAsync(u => u.Id == 1))
                {
                    context.Users.Add(new User { Id = 1, Email = "ana@test.com", Name = "Ana", PasswordHash = "x" });
                    // The connector sits behind the same paywall as the app.
                    context.Subscriptions.Add(new Subscription
                    {
                        UserId = 1,
                        Plan = FinanceControl.Shared.Enums.EnumSubscriptionPlan.Basic,
                        Status = FinanceControl.Shared.Enums.EnumSubscriptionStatus.Active,
                        CurrentPeriodStart = DateTime.UtcNow.AddDays(-1),
                        CurrentPeriodEnd = DateTime.UtcNow.AddDays(29)
                    });
                    context.Tags.Add(new Tag { UserId = 1, Name = "Viagem" });
                    await context.SaveChangesAsync();
                }

                var oauth = scope.ServiceProvider.GetRequiredService<McpOAuthService>();
                var created = await oauth.CreatePersonalTokenAsync(new CreateMcpPersonalTokenRequestDto
                {
                    Name = "tests",
                    Scopes = scopes,
                    ExpiresInDays = 1
                }, userId: 1);

                return created.Token;
            }
        }
    }
}
