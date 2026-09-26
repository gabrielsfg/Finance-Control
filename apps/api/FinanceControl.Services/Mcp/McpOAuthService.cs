using System.Text.Json;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Models;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Mcp
{
    /// <summary>
    /// The OAuth 2.1 authorization server behind the MCP connector: client registration,
    /// authorization with PKCE and user consent, token issue and rotation, revocation, and
    /// the personal tokens for clients configured by file.
    /// </summary>
    /// <remarks>
    /// Kept deliberately small and in line with the MCP authorization spec: public clients
    /// only, authorization code + PKCE S256 only, opaque hashed tokens, one live access and
    /// refresh token per connection. The tokens are separate from the app's own JWTs by
    /// construction — different format, different validation — so an MCP token can never
    /// open the rest of the API and an app token can never open /mcp.
    /// </remarks>
    public class McpOAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly McpClientResolver _clientResolver;
        private readonly McpSettings _settings;

        public McpOAuthService(
            ApplicationDbContext context,
            McpClientResolver clientResolver,
            IOptions<McpSettings> settings)
        {
            _context = context;
            _clientResolver = clientResolver;
            _settings = settings.Value;
        }

        // ── Registration (RFC 7591) ───────────────────────────────────────────────

        public async Task<Result<McpClient>> RegisterClientAsync(McpClientRegistration registration)
        {
            if (registration.RedirectUris.Count == 0)
                return Result<McpClient>.Failure("redirect_uris is required.");

            foreach (var redirect in registration.RedirectUris)
            {
                if (!Uri.TryCreate(redirect, UriKind.Absolute, out var uri))
                    return Result<McpClient>.Failure($"Invalid redirect URI: {redirect}");

                // https everywhere, except loopback for CLI clients and custom schemes for
                // native apps (cursor://, vscode://), both allowed by RFC 8252.
                var isLoopback = uri.Scheme == Uri.UriSchemeHttp && (uri.IsLoopback || uri.Host == "localhost");
                if (uri.Scheme == Uri.UriSchemeHttp && !isLoopback)
                    return Result<McpClient>.Failure($"Redirect URI must use https: {redirect}");

                if (!string.IsNullOrEmpty(uri.Fragment))
                    return Result<McpClient>.Failure($"Redirect URI must not have a fragment: {redirect}");
            }

            if (registration.TokenEndpointAuthMethod is { } method && method != "none")
                return Result<McpClient>.Failure("Only public clients (token_endpoint_auth_method \"none\") are supported.");

            var client = new McpClient
            {
                ClientId = "mcp_" + McpTokenHelper.NewPublicId(),
                ClientName = Truncate(string.IsNullOrWhiteSpace(registration.ClientName) ? "Cliente MCP" : registration.ClientName.Trim(), 120)!,
                ClientUri = Truncate(registration.ClientUri, 500),
                RedirectUris = JsonSerializer.Serialize(registration.RedirectUris),
                Source = EnumMcpClientSource.Registered
            };

            _context.McpClients.Add(client);
            await _context.SaveChangesAsync();

            return Result<McpClient>.Success(client);
        }

        // ── Authorization ─────────────────────────────────────────────────────────

        public async Task<McpAuthorizeOutcome> AuthorizeAsync(
            string? responseType,
            string? clientId,
            string? redirectUri,
            string? codeChallenge,
            string? codeChallengeMethod,
            string? scope,
            string? state,
            string? resource)
        {
            if (string.IsNullOrWhiteSpace(clientId))
                return McpAuthorizeOutcome.Fail("invalid_request", "client_id is required.");

            var client = await _clientResolver.ResolveAsync(clientId);
            if (client is null)
                return McpAuthorizeOutcome.Fail("invalid_client", "Unknown client. Register it first or use a client metadata document URL.");

            if (string.IsNullOrWhiteSpace(redirectUri) || !McpClientResolver.IsAllowedRedirect(client, redirectUri))
                return McpAuthorizeOutcome.Fail("invalid_request", "redirect_uri is missing or not registered for this client.");

            // From here on the redirect URI is trusted, so errors go back to the client.
            if (responseType != "code")
                return McpAuthorizeOutcome.Redirect(ErrorRedirect(redirectUri, "unsupported_response_type", "Only response_type=code is supported.", state));

            if (string.IsNullOrWhiteSpace(codeChallenge) || codeChallengeMethod != "S256")
                return McpAuthorizeOutcome.Redirect(ErrorRedirect(redirectUri, "invalid_request", "PKCE with code_challenge_method=S256 is required.", state));

            if (!string.IsNullOrWhiteSpace(resource) && !IsThisResource(resource))
                return McpAuthorizeOutcome.Redirect(ErrorRedirect(redirectUri, "invalid_target", "Unknown resource.", state));

            var request = new McpAuthorizationRequest
            {
                PublicId = McpTokenHelper.NewPublicId(),
                ClientId = client.ClientId,
                RedirectUri = redirectUri,
                CodeChallenge = codeChallenge,
                Scopes = McpScopes.Join(McpScopes.Parse(scope)),
                State = state,
                Resource = resource,
                ExpiresAt = DateTime.UtcNow.AddMinutes(_settings.AuthorizationRequestMinutes)
            };

            _context.McpAuthorizationRequests.Add(request);
            await _context.SaveChangesAsync();

            var consentUrl = QueryHelpers.AddQueryString(
                _settings.WebBaseUrl.TrimEnd('/') + "/oauth/consent",
                "request",
                request.PublicId);

            return McpAuthorizeOutcome.Redirect(consentUrl);
        }

        public async Task<Result<McpAuthorizationRequestResponseDto>> GetAuthorizationRequestAsync(string requestId)
        {
            var request = await FindPendingRequestAsync(requestId);
            if (request is null)
                return Result<McpAuthorizationRequestResponseDto>.Failure("Authorization request not found or expired.");

            var client = await _context.McpClients.AsNoTracking().FirstOrDefaultAsync(c => c.ClientId == request.ClientId);

            return Result<McpAuthorizationRequestResponseDto>.Success(new McpAuthorizationRequestResponseDto
            {
                RequestId = request.PublicId,
                ClientName = client?.ClientName ?? "Cliente MCP",
                ClientUri = client?.ClientUri,
                RedirectHost = HostOf(request.RedirectUri),
                Scopes = McpScopes.ToResponse(McpScopes.Split(request.Scopes)),
                ExpiresAt = request.ExpiresAt
            });
        }

        public async Task<Result<McpConsentDecisionResponseDto>> ApproveAsync(
            string requestId,
            ApproveMcpAuthorizationRequestDto requestDto,
            int userId)
        {
            var request = await FindPendingRequestAsync(requestId);
            if (request is null)
                return Result<McpConsentDecisionResponseDto>.Failure("Authorization request not found or expired.");

            var requested = McpScopes.Split(request.Scopes);
            var granted = requestDto.Scopes is { Count: > 0 } kept
                ? requested.Intersect(kept).ToList()
                : requested;

            if (granted.Count == 0)
                return Result<McpConsentDecisionResponseDto>.Failure("Select at least one permission.");

            var client = await _context.McpClients.AsNoTracking().FirstOrDefaultAsync(c => c.ClientId == request.ClientId);
            var code = McpTokenHelper.NewToken(McpTokenHelper.AuthorizationCodePrefix);

            _context.McpGrants.Add(new McpGrant
            {
                UserId = userId,
                ClientId = request.ClientId,
                ClientName = client?.ClientName ?? "Cliente MCP",
                RedirectUri = request.RedirectUri,
                Scopes = McpScopes.Join(granted),
                CodeHash = McpTokenHelper.Hash(code),
                CodeChallenge = request.CodeChallenge,
                CodeExpiresAt = DateTime.UtcNow.AddMinutes(_settings.AuthorizationCodeMinutes)
            });

            request.Status = EnumMcpAuthorizationStatus.Approved;
            request.UserId = userId;
            await _context.SaveChangesAsync();

            var query = new Dictionary<string, string?> { ["code"] = code, ["iss"] = _settings.Issuer };
            if (!string.IsNullOrEmpty(request.State))
                query["state"] = request.State;

            return Result<McpConsentDecisionResponseDto>.Success(new McpConsentDecisionResponseDto
            {
                RedirectUrl = QueryHelpers.AddQueryString(request.RedirectUri, query)
            });
        }

        public async Task<Result<McpConsentDecisionResponseDto>> DenyAsync(string requestId, int userId)
        {
            var request = await FindPendingRequestAsync(requestId);
            if (request is null)
                return Result<McpConsentDecisionResponseDto>.Failure("Authorization request not found or expired.");

            request.Status = EnumMcpAuthorizationStatus.Denied;
            request.UserId = userId;
            await _context.SaveChangesAsync();

            return Result<McpConsentDecisionResponseDto>.Success(new McpConsentDecisionResponseDto
            {
                RedirectUrl = ErrorRedirect(request.RedirectUri, "access_denied", "The user denied the connection.", request.State)
            });
        }

        // ── Tokens ────────────────────────────────────────────────────────────────

        public async Task<McpTokenResult> ExchangeCodeAsync(string? code, string? clientId, string? redirectUri, string? codeVerifier)
        {
            if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(codeVerifier))
                return McpTokenResult.Fail("invalid_request", "code, client_id and code_verifier are required.");

            var hash = McpTokenHelper.Hash(code);
            var grant = await _context.McpGrants.FirstOrDefaultAsync(g => g.CodeHash == hash && g.RevokedAt == null);

            if (grant is null || grant.CodeExpiresAt < DateTime.UtcNow)
                return McpTokenResult.Fail("invalid_grant", "The authorization code is invalid or expired.");

            if (grant.ClientId != clientId || (redirectUri is not null && grant.RedirectUri != redirectUri))
                return McpTokenResult.Fail("invalid_grant", "The code was issued to another client or redirect URI.");

            if (grant.CodeChallenge is null || !McpTokenHelper.VerifyPkce(codeVerifier, grant.CodeChallenge))
                return McpTokenResult.Fail("invalid_grant", "PKCE verification failed.");

            // Single use: the code is gone whether or not the client finishes the exchange.
            grant.CodeHash = null;
            grant.CodeChallenge = null;
            grant.CodeExpiresAt = null;

            // Reconnecting the same AI replaces the old connection instead of stacking a
            // second row the user would have to find and revoke.
            var previous = await _context.McpGrants
                .Where(g => g.UserId == grant.UserId && g.ClientId == grant.ClientId && g.Id != grant.Id && g.RevokedAt == null)
                .ToListAsync();
            previous.ForEach(Revoke);

            return await IssueTokensAsync(grant);
        }

        public async Task<McpTokenResult> RefreshAsync(string? refreshToken, string? clientId)
        {
            if (string.IsNullOrEmpty(refreshToken) || string.IsNullOrEmpty(clientId))
                return McpTokenResult.Fail("invalid_request", "refresh_token and client_id are required.");

            var hash = McpTokenHelper.Hash(refreshToken);
            var grant = await _context.McpGrants.FirstOrDefaultAsync(g => g.RefreshTokenHash == hash && g.RevokedAt == null);

            if (grant is null || grant.RefreshTokenExpiresAt < DateTime.UtcNow || grant.ClientId != clientId)
                return McpTokenResult.Fail("invalid_grant", "The refresh token is invalid or expired.");

            return await IssueTokensAsync(grant);
        }

        /// <summary>RFC 7009: revoking either token of a connection ends the connection.</summary>
        public async Task RevokeTokenAsync(string? token)
        {
            if (string.IsNullOrEmpty(token))
                return;

            var hash = McpTokenHelper.Hash(token);
            var grant = await _context.McpGrants.FirstOrDefaultAsync(g =>
                (g.AccessTokenHash == hash || g.RefreshTokenHash == hash) && g.RevokedAt == null);

            if (grant is null)
                return;

            Revoke(grant);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Resolves a bearer token on /mcp. Returns null for anything that is not a live
        /// MCP token — including the app's own JWTs, which never start with these prefixes.
        /// </summary>
        public async Task<McpPrincipal?> ValidateAccessTokenAsync(string token, CancellationToken cancellationToken = default)
        {
            var hash = McpTokenHelper.Hash(token);
            var now = DateTime.UtcNow;

            if (token.StartsWith(McpTokenHelper.AccessTokenPrefix, StringComparison.Ordinal))
            {
                var grant = await _context.McpGrants.FirstOrDefaultAsync(g => g.AccessTokenHash == hash, cancellationToken);
                if (grant is null || grant.RevokedAt is not null || grant.AccessTokenExpiresAt < now)
                    return null;

                if (grant.LastUsedAt is null || grant.LastUsedAt < now.AddMinutes(-5))
                {
                    grant.LastUsedAt = now;
                    await _context.SaveChangesAsync(cancellationToken);
                }

                return new McpPrincipal(grant.UserId, McpScopes.Split(grant.Scopes), grant.Id, null);
            }

            if (token.StartsWith(McpTokenHelper.PersonalTokenPrefix, StringComparison.Ordinal))
            {
                var personal = await _context.McpPersonalTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);
                if (personal is null || personal.RevokedAt is not null || personal.ExpiresAt < now)
                    return null;

                if (personal.LastUsedAt is null || personal.LastUsedAt < now.AddMinutes(-5))
                {
                    personal.LastUsedAt = now;
                    await _context.SaveChangesAsync(cancellationToken);
                }

                return new McpPrincipal(personal.UserId, McpScopes.Split(personal.Scopes), null, personal.Id);
            }

            return null;
        }

        // ── Connections and personal tokens ───────────────────────────────────────

        public async Task<List<McpConnectionResponseDto>> ListConnectionsAsync(int userId)
        {
            var grants = await _context.McpGrants
                .AsNoTracking()
                .Where(g => g.UserId == userId && g.RevokedAt == null && g.RefreshTokenHash != null)
                .OrderByDescending(g => g.LastUsedAt ?? g.CreatedAt)
                .ToListAsync();

            var clientIds = grants.Select(g => g.ClientId).Distinct().ToList();
            var clientUris = await _context.McpClients
                .AsNoTracking()
                .Where(c => clientIds.Contains(c.ClientId))
                .ToDictionaryAsync(c => c.ClientId, c => c.ClientUri);

            return grants.Select(g => new McpConnectionResponseDto
            {
                Id = g.Id,
                ClientName = g.ClientName,
                ClientUri = clientUris.GetValueOrDefault(g.ClientId),
                RedirectHost = HostOf(g.RedirectUri),
                Scopes = McpScopes.Split(g.Scopes),
                CreatedAt = g.CreatedAt,
                LastUsedAt = g.LastUsedAt
            }).ToList();
        }

        public async Task<Result> RevokeConnectionAsync(int grantId, int userId)
        {
            var grant = await _context.McpGrants.FirstOrDefaultAsync(g => g.Id == grantId && g.UserId == userId && g.RevokedAt == null);
            if (grant is null)
                return Result.Failure("Connection not found.");

            Revoke(grant);
            await _context.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<List<McpPersonalTokenResponseDto>> ListPersonalTokensAsync(int userId)
        {
            var now = DateTime.UtcNow;

            return await _context.McpPersonalTokens
                .AsNoTracking()
                .Where(t => t.UserId == userId && t.RevokedAt == null && t.ExpiresAt > now)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new McpPersonalTokenResponseDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    Prefix = t.Prefix,
                    Scopes = t.Scopes.Split(' ', StringSplitOptions.RemoveEmptyEntries).ToList(),
                    CreatedAt = t.CreatedAt,
                    ExpiresAt = t.ExpiresAt,
                    LastUsedAt = t.LastUsedAt
                })
                .ToListAsync();
        }

        public async Task<CreateMcpPersonalTokenResponseDto> CreatePersonalTokenAsync(CreateMcpPersonalTokenRequestDto requestDto, int userId)
        {
            var token = McpTokenHelper.NewToken(McpTokenHelper.PersonalTokenPrefix);
            var days = Math.Clamp(requestDto.ExpiresInDays, 1, _settings.MaxPersonalTokenDays);

            var entity = new McpPersonalToken
            {
                UserId = userId,
                Name = requestDto.Name.Trim(),
                TokenHash = McpTokenHelper.Hash(token),
                Prefix = token[..(McpTokenHelper.PersonalTokenPrefix.Length + 4)],
                Scopes = McpScopes.Join(requestDto.Scopes.Where(McpScopes.IsKnown).Distinct()),
                ExpiresAt = DateTime.UtcNow.AddDays(days)
            };

            _context.McpPersonalTokens.Add(entity);
            await _context.SaveChangesAsync();

            return new CreateMcpPersonalTokenResponseDto
            {
                Token = token,
                Item = new McpPersonalTokenResponseDto
                {
                    Id = entity.Id,
                    Name = entity.Name,
                    Prefix = entity.Prefix,
                    Scopes = McpScopes.Split(entity.Scopes),
                    CreatedAt = entity.CreatedAt,
                    ExpiresAt = entity.ExpiresAt
                }
            };
        }

        public async Task<Result> RevokePersonalTokenAsync(int tokenId, int userId)
        {
            var token = await _context.McpPersonalTokens.FirstOrDefaultAsync(t => t.Id == tokenId && t.UserId == userId && t.RevokedAt == null);
            if (token is null)
                return Result.Failure("Token not found.");

            token.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Result.Success();
        }

        public McpInfoResponseDto GetInfo() => new()
        {
            ServerUrl = _settings.ResourceUrl,
            Scopes = McpScopes.ToResponse(McpScopes.All)
        };

        // ── Helpers ───────────────────────────────────────────────────────────────

        private async Task<McpTokenResult> IssueTokensAsync(McpGrant grant)
        {
            var accessToken = McpTokenHelper.NewToken(McpTokenHelper.AccessTokenPrefix);
            var refreshToken = McpTokenHelper.NewToken(McpTokenHelper.RefreshTokenPrefix);

            grant.AccessTokenHash = McpTokenHelper.Hash(accessToken);
            grant.AccessTokenExpiresAt = DateTime.UtcNow.AddMinutes(_settings.AccessTokenMinutes);
            grant.RefreshTokenHash = McpTokenHelper.Hash(refreshToken);
            grant.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(_settings.RefreshTokenDays);

            await _context.SaveChangesAsync();

            return new McpTokenResult(accessToken, refreshToken, _settings.AccessTokenMinutes * 60, grant.Scopes, null);
        }

        private static void Revoke(McpGrant grant)
        {
            grant.RevokedAt = DateTime.UtcNow;
            grant.AccessTokenHash = null;
            grant.RefreshTokenHash = null;
            grant.CodeHash = null;
        }

        private async Task<McpAuthorizationRequest?> FindPendingRequestAsync(string requestId)
        {
            if (string.IsNullOrWhiteSpace(requestId))
                return null;

            var request = await _context.McpAuthorizationRequests.FirstOrDefaultAsync(r => r.PublicId == requestId);

            return request is { Status: EnumMcpAuthorizationStatus.Pending } && request.ExpiresAt > DateTime.UtcNow
                ? request
                : null;
        }

        private bool IsThisResource(string resource)
        {
            var normalized = resource.TrimEnd('/');
            return normalized == _settings.ResourceUrl || normalized == _settings.Issuer;
        }

        private static string ErrorRedirect(string redirectUri, string error, string description, string? state)
        {
            var query = new Dictionary<string, string?> { ["error"] = error, ["error_description"] = description };
            if (!string.IsNullOrEmpty(state))
                query["state"] = state;

            return QueryHelpers.AddQueryString(redirectUri, query);
        }

        private static string HostOf(string uri) =>
            Uri.TryCreate(uri, UriKind.Absolute, out var parsed) ? (parsed.IsDefaultPort ? parsed.Host : $"{parsed.Host}:{parsed.Port}") : uri;

        private static string? Truncate(string? text, int length) =>
            text is null || text.Length <= length ? text : text[..length];
    }
}
