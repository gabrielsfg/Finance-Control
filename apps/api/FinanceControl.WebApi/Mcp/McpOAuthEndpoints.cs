using System.Text.Json;
using FinanceControl.Services.Mcp;
using Microsoft.Extensions.Options;

namespace FinanceControl.WebApi.Mcp
{
    /// <summary>
    /// The public OAuth surface MCP clients discover and talk to: metadata (RFC 9728 and
    /// RFC 8414), registration (RFC 7591), authorize, token and revoke.
    /// </summary>
    /// <remarks>
    /// Minimal APIs rather than controllers so they get their own rate limit: these calls
    /// come from the AI providers' servers, where one IP stands for thousands of users, so
    /// the per-IP "general" policy of the controllers would throttle all of them at once.
    /// Responses use the snake_case names the OAuth RFCs define.
    /// </remarks>
    public static class McpOAuthEndpoints
    {
        public const string RateLimitPolicy = "oauth";

        public static IEndpointRouteBuilder MapMcpOAuthEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup(string.Empty)
                .AllowAnonymous()
                .RequireRateLimiting(RateLimitPolicy)
                .ExcludeFromDescription();

            group.MapGet("/.well-known/oauth-protected-resource", ProtectedResourceMetadata);
            group.MapGet("/.well-known/oauth-protected-resource/mcp", ProtectedResourceMetadata);
            group.MapGet("/.well-known/oauth-authorization-server", AuthorizationServerMetadata);
            group.MapGet("/.well-known/oauth-authorization-server/mcp", AuthorizationServerMetadata);
            group.MapGet("/.well-known/openid-configuration", AuthorizationServerMetadata);

            group.MapPost("/oauth/register", RegisterAsync);
            group.MapGet("/oauth/authorize", AuthorizeAsync);
            group.MapPost("/oauth/token", TokenAsync).DisableAntiforgery();
            group.MapPost("/oauth/revoke", RevokeAsync).DisableAntiforgery();

            return app;
        }

        private static IResult ProtectedResourceMetadata(IOptions<McpSettings> options)
        {
            var settings = options.Value;

            return Results.Json(new Dictionary<string, object>
            {
                ["resource"] = settings.ResourceUrl,
                ["authorization_servers"] = new[] { settings.Issuer },
                ["scopes_supported"] = McpScopes.All,
                ["bearer_methods_supported"] = new[] { "header" },
                ["resource_name"] = "Quantia"
            });
        }

        private static IResult AuthorizationServerMetadata(IOptions<McpSettings> options)
        {
            var issuer = options.Value.Issuer;

            return Results.Json(new Dictionary<string, object>
            {
                ["issuer"] = issuer,
                ["authorization_endpoint"] = issuer + "/oauth/authorize",
                ["token_endpoint"] = issuer + "/oauth/token",
                ["registration_endpoint"] = issuer + "/oauth/register",
                ["revocation_endpoint"] = issuer + "/oauth/revoke",
                ["scopes_supported"] = McpScopes.All,
                ["response_types_supported"] = new[] { "code" },
                ["grant_types_supported"] = new[] { "authorization_code", "refresh_token" },
                ["token_endpoint_auth_methods_supported"] = new[] { "none" },
                ["revocation_endpoint_auth_methods_supported"] = new[] { "none" },
                ["code_challenge_methods_supported"] = new[] { "S256" },
                ["client_id_metadata_document_supported"] = true,
                ["authorization_response_iss_parameter_supported"] = true
            });
        }

        private static async Task<IResult> RegisterAsync(HttpRequest request, McpOAuthService oauthService)
        {
            JsonElement body;
            try
            {
                body = await JsonSerializer.DeserializeAsync<JsonElement>(request.Body);
            }
            catch (JsonException)
            {
                return OAuthError("invalid_client_metadata", "The body must be a JSON object.");
            }

            if (body.ValueKind != JsonValueKind.Object)
                return OAuthError("invalid_client_metadata", "The body must be a JSON object.");

            var redirectUris = body.TryGetProperty("redirect_uris", out var uris) && uris.ValueKind == JsonValueKind.Array
                ? uris.EnumerateArray().Select(u => u.GetString()).OfType<string>().ToList()
                : [];

            var registration = new McpClientRegistration(
                GetString(body, "client_name"),
                GetString(body, "client_uri"),
                redirectUris,
                GetString(body, "token_endpoint_auth_method"));

            var result = await oauthService.RegisterClientAsync(registration);
            if (result.IsFailure)
                return OAuthError("invalid_client_metadata", result.Error!);

            var client = result.Value!;
            return Results.Json(new Dictionary<string, object?>
            {
                ["client_id"] = client.ClientId,
                ["client_id_issued_at"] = new DateTimeOffset(client.CreatedAt == default ? DateTime.UtcNow : client.CreatedAt).ToUnixTimeSeconds(),
                ["client_name"] = client.ClientName,
                ["client_uri"] = client.ClientUri,
                ["redirect_uris"] = redirectUris,
                ["grant_types"] = new[] { "authorization_code", "refresh_token" },
                ["response_types"] = new[] { "code" },
                ["token_endpoint_auth_method"] = "none",
                ["scope"] = McpScopes.Join(McpScopes.All)
            }, statusCode: StatusCodes.Status201Created);
        }

        private static async Task<IResult> AuthorizeAsync(HttpRequest request, McpOAuthService oauthService)
        {
            var query = request.Query;

            var outcome = await oauthService.AuthorizeAsync(
                query["response_type"],
                query["client_id"],
                query["redirect_uri"],
                query["code_challenge"],
                query["code_challenge_method"],
                query["scope"],
                query["state"],
                query["resource"]);

            if (outcome.RedirectUrl is { } url)
                return Results.Redirect(url);

            // Nowhere safe to redirect to: say it plainly to whoever is in the browser.
            var error = outcome.DirectError!;
            return Results.Content(
                $"Não foi possível conectar: {error.Description} ({error.Error})",
                "text/plain; charset=utf-8",
                statusCode: StatusCodes.Status400BadRequest);
        }

        private static async Task<IResult> TokenAsync(HttpRequest request, HttpResponse response, McpOAuthService oauthService)
        {
            response.Headers.CacheControl = "no-store";
            response.Headers.Pragma = "no-cache";

            if (!request.HasFormContentType)
                return OAuthError("invalid_request", "Use application/x-www-form-urlencoded.");

            var form = await request.ReadFormAsync();

            var result = form["grant_type"].ToString() switch
            {
                "authorization_code" => await oauthService.ExchangeCodeAsync(
                    form["code"], form["client_id"], form["redirect_uri"], form["code_verifier"]),
                "refresh_token" => await oauthService.RefreshAsync(form["refresh_token"], form["client_id"]),
                _ => McpTokenResult.Fail("unsupported_grant_type", "Only authorization_code and refresh_token are supported.")
            };

            if (result.Error is { } error)
                return OAuthError(error.Error, error.Description);

            return Results.Json(new Dictionary<string, object>
            {
                ["access_token"] = result.AccessToken!,
                ["token_type"] = "Bearer",
                ["expires_in"] = result.ExpiresInSeconds,
                ["refresh_token"] = result.RefreshToken!,
                ["scope"] = result.Scope
            });
        }

        private static async Task<IResult> RevokeAsync(HttpRequest request, McpOAuthService oauthService)
        {
            if (request.HasFormContentType)
            {
                var form = await request.ReadFormAsync();
                await oauthService.RevokeTokenAsync(form["token"]);
            }

            // RFC 7009: 200 whether or not the token existed.
            return Results.Ok();
        }

        private static IResult OAuthError(string error, string description) =>
            Results.Json(new Dictionary<string, string>
            {
                ["error"] = error,
                ["error_description"] = description
            }, statusCode: StatusCodes.Status400BadRequest);

        private static string? GetString(JsonElement body, string name) =>
            body.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    }
}
