using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Pluggy;
using FinanceControl.WebApi.Controllers.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace FinanceControl.WebApi.Controllers
{
    /// <summary>
    /// Receives Pluggy webhooks. Stores the event and answers 200 — nothing else.
    /// </summary>
    /// <remarks>
    /// Pluggy waits ten seconds at most and does not retry 4xx answers, so this endpoint
    /// does no business logic and only answers an error when the event must come again: a
    /// database failure answers 500, which Pluggy retries. Pluggy signs nothing; the
    /// webhook is registered with a secret header and anything without it is refused.
    /// </remarks>
    [Route("api/webhooks/pluggy")]
    [ApiController]
    [AllowAnonymous]
    [DisableRateLimiting]
    public class PluggyWebhookController : BaseController
    {
        public const string SecretHeader = "X-Webhook-Secret";
        private const int MaxBodyBytes = 256 * 1024;

        private readonly ApplicationDbContext _context;
        private readonly PluggySettings _settings;
        private readonly ILogger<PluggyWebhookController> _logger;

        public PluggyWebhookController(
            ApplicationDbContext context,
            IOptions<PluggySettings> settings,
            ILogger<PluggyWebhookController> logger)
        {
            _context = context;
            _settings = settings.Value;
            _logger = logger;
        }

        [HttpPost]
        [RequestSizeLimit(MaxBodyBytes)]
        public async Task<IActionResult> ReceiveAsync(CancellationToken cancellationToken)
        {
            if (!IsAuthentic(Request.Headers[SecretHeader].ToString()))
            {
                _logger.LogWarning("Pluggy webhook rejected: missing or wrong secret header.");
                return Unauthorized();
            }

            using var reader = new StreamReader(Request.Body, Encoding.UTF8);
            var body = await reader.ReadToEndAsync(cancellationToken);

            string? eventType;
            string? eventId;
            string? itemId;
            try
            {
                using var document = JsonDocument.Parse(body);
                var root = document.RootElement;
                eventType = ReadString(root, "event");
                eventId = ReadString(root, "eventId");
                itemId = ReadString(root, "itemId");
            }
            catch (JsonException)
            {
                _logger.LogWarning("Pluggy webhook with an unreadable body was acknowledged and dropped.");
                return Ok();
            }

            if (string.IsNullOrEmpty(eventType))
            {
                _logger.LogWarning("Pluggy webhook without an event type was acknowledged and dropped.");
                return Ok();
            }

            // eventId is stable across redeliveries; an event without one is still stored,
            // under a key of its own, since applying it twice is harmless.
            eventId = string.IsNullOrEmpty(eventId) ? $"noid:{Guid.NewGuid():N}" : eventId;

            if (await _context.PluggyWebhookEvents.AnyAsync(e => e.EventId == eventId, cancellationToken))
                return Ok();

            _context.PluggyWebhookEvents.Add(new PluggyWebhookEvent
            {
                EventId = Truncate(eventId, 150),
                EventType = Truncate(eventType, 80),
                ItemId = itemId is null ? null : Truncate(itemId, 100),
                Payload = body
            });

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException exception) when (IsUniqueViolation(exception))
            {
                // The same event arrived twice at once; the other request stored it.
            }

            return Ok();
        }

        private bool IsAuthentic(string received)
        {
            if (string.IsNullOrEmpty(_settings.WebhookSecret))
            {
                _logger.LogError("PluggySettings:WebhookSecret is not configured — every webhook is refused.");
                return false;
            }

            // Constant time, so the secret cannot be guessed byte by byte from response timings.
            var expected = Encoding.UTF8.GetBytes(_settings.WebhookSecret);
            var actual = Encoding.UTF8.GetBytes(received);
            return CryptographicOperations.FixedTimeEquals(expected, actual);
        }

        private static string? ReadString(JsonElement root, string name) =>
            root.ValueKind == JsonValueKind.Object
            && root.TryGetProperty(name, out var value)
            && value.ValueKind == JsonValueKind.String
                ? value.GetString()
                : null;

        private static bool IsUniqueViolation(DbUpdateException exception) =>
            exception.InnerException is Npgsql.PostgresException { SqlState: Npgsql.PostgresErrorCodes.UniqueViolation };

        private static string Truncate(string value, int max) => value.Length <= max ? value : value[..max];
    }
}
