using System.Net;
using System.Net.Sockets;
using System.Text.Json;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Services.Mcp
{
    /// <summary>
    /// Turns a client_id into a known client: a row created by Dynamic Client Registration,
    /// or — when the client_id is an https URL — the Client ID Metadata Document served at
    /// that URL, which the current MCP authorization spec prefers over registration.
    /// </summary>
    /// <remarks>
    /// Fetching a URL the caller chose is an SSRF vector, so only https is accepted, every
    /// resolved address must be public, the body is capped and the request times out fast.
    /// </remarks>
    public class McpClientResolver
    {
        private const int MaxDocumentBytes = 64 * 1024;
        private static readonly TimeSpan RefreshAfter = TimeSpan.FromDays(1);

        private readonly ApplicationDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<McpClientResolver> _logger;

        public McpClientResolver(
            ApplicationDbContext context,
            IHttpClientFactory httpClientFactory,
            ILogger<McpClientResolver> logger)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async Task<McpClient?> ResolveAsync(string clientId, CancellationToken cancellationToken = default)
        {
            var existing = await _context.McpClients.FirstOrDefaultAsync(c => c.ClientId == clientId, cancellationToken);

            if (existing is not null && existing.Source == EnumMcpClientSource.Registered)
                return existing;

            if (!Uri.TryCreate(clientId, UriKind.Absolute, out var documentUri) || documentUri.Scheme != Uri.UriSchemeHttps)
                return existing;

            if (existing is not null && existing.MetadataFetchedAt > DateTime.UtcNow - RefreshAfter)
                return existing;

            var document = await FetchAsync(documentUri, cancellationToken);
            if (document is null)
                return existing;

            var client = existing ?? new McpClient { ClientId = clientId, Source = EnumMcpClientSource.MetadataDocument };
            client.ClientName = Truncate(document.Value.Name, 120) ?? documentUri.Host;
            client.ClientUri = Truncate(document.Value.ClientUri, 500);
            client.RedirectUris = JsonSerializer.Serialize(document.Value.RedirectUris);
            client.MetadataFetchedAt = DateTime.UtcNow;

            if (existing is null)
                _context.McpClients.Add(client);

            await _context.SaveChangesAsync(cancellationToken);
            return client;
        }

        public static IReadOnlyList<string> RedirectUrisOf(McpClient client)
        {
            try
            {
                return JsonSerializer.Deserialize<List<string>>(client.RedirectUris) ?? [];
            }
            catch (JsonException)
            {
                return [];
            }
        }

        /// <summary>
        /// Exact match, except that a loopback redirect may use any port (RFC 8252 §7.3):
        /// CLI clients such as Claude Code and Codex listen on a random local port.
        /// </summary>
        public static bool IsAllowedRedirect(McpClient client, string redirectUri)
        {
            var allowed = RedirectUrisOf(client);
            if (allowed.Contains(redirectUri, StringComparer.Ordinal))
                return true;

            if (!Uri.TryCreate(redirectUri, UriKind.Absolute, out var requested) || !IsLoopback(requested))
                return false;

            return allowed.Any(candidate =>
                Uri.TryCreate(candidate, UriKind.Absolute, out var registered)
                && IsLoopback(registered)
                && registered.Scheme == requested.Scheme
                && registered.AbsolutePath == requested.AbsolutePath);
        }

        private static bool IsLoopback(Uri uri) =>
            uri.Scheme == Uri.UriSchemeHttp && (uri.IsLoopback || uri.Host == "localhost");

        private async Task<(string? Name, string? ClientUri, List<string> RedirectUris)?> FetchAsync(
            Uri documentUri,
            CancellationToken cancellationToken)
        {
            try
            {
                if (!await IsPublicHostAsync(documentUri.DnsSafeHost, cancellationToken))
                {
                    _logger.LogWarning("Refused client metadata document on a non-public host: {Host}", documentUri.Host);
                    return null;
                }

                var http = _httpClientFactory.CreateClient();
                http.Timeout = TimeSpan.FromSeconds(5);

                using var response = await http.GetAsync(documentUri, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                if (!response.IsSuccessStatusCode)
                    return null;

                await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
                var buffer = new byte[MaxDocumentBytes + 1];
                var read = 0;
                int chunk;
                while (read < buffer.Length && (chunk = await stream.ReadAsync(buffer.AsMemory(read), cancellationToken)) > 0)
                    read += chunk;

                if (read > MaxDocumentBytes)
                    return null;

                using var json = JsonDocument.Parse(buffer.AsMemory(0, read));
                var root = json.RootElement;

                // The document must claim the very URL it was fetched from, or anyone could
                // point a client_id at someone else's metadata.
                if (!root.TryGetProperty("client_id", out var id) || id.GetString() != documentUri.OriginalString)
                    return null;

                var redirects = root.TryGetProperty("redirect_uris", out var uris) && uris.ValueKind == JsonValueKind.Array
                    ? uris.EnumerateArray().Select(u => u.GetString()).OfType<string>().ToList()
                    : [];

                if (redirects.Count == 0)
                    return null;

                return (
                    root.TryGetProperty("client_name", out var name) ? name.GetString() : null,
                    root.TryGetProperty("client_uri", out var uri) ? uri.GetString() : null,
                    redirects);
            }
            catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException or JsonException or SocketException)
            {
                _logger.LogWarning(exception, "Could not fetch client metadata document {Uri}", documentUri);
                return null;
            }
        }

        private static async Task<bool> IsPublicHostAsync(string host, CancellationToken cancellationToken)
        {
            var addresses = await Dns.GetHostAddressesAsync(host, cancellationToken);
            return addresses.Length > 0 && addresses.All(IsPublicAddress);
        }

        private static bool IsPublicAddress(IPAddress address)
        {
            if (IPAddress.IsLoopback(address) || address.IsIPv6LinkLocal || address.IsIPv6SiteLocal || address.IsIPv6UniqueLocal)
                return false;

            if (address.IsIPv4MappedToIPv6)
                address = address.MapToIPv4();

            if (address.AddressFamily != AddressFamily.InterNetwork)
                return true;

            var bytes = address.GetAddressBytes();
            return bytes[0] switch
            {
                0 or 10 or 127 => false,
                100 when bytes[1] >= 64 && bytes[1] <= 127 => false,
                169 when bytes[1] == 254 => false,
                172 when bytes[1] >= 16 && bytes[1] <= 31 => false,
                192 when bytes[1] == 168 => false,
                _ => true
            };
        }

        private static string? Truncate(string? text, int length) =>
            text is null || text.Length <= length ? text : text[..length];
    }
}
