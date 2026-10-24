using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Asaas;
using FinanceControl.WebApi.Controllers.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace FinanceControl.WebApi.Controllers
{
    /// <summary>
    /// Receives Asaas webhooks. Stores the event and answers 200 — nothing else.
    /// </summary>
    /// <remarks>
    /// Asaas only counts an exact HTTP 200 as delivered, waits ten seconds at most, and
    /// pauses the whole queue after fifteen failures in a row. So this endpoint does no
    /// business logic: a malformed payload, an event we do not handle or a duplicate all
    /// answer 200, and the worker applies the stored events later. The only non-200 answers
    /// are a wrong token (not Asaas) and the database being down (we must not acknowledge
    /// what we could not store — Asaas retries it).
    /// </remarks>
    [Route("api/webhooks/asaas")]
    [ApiController]
    [AllowAnonymous]
    [DisableRateLimiting]
    public class AsaasWebhookController : BaseController
    {
        private const int MaxBodyBytes = 256 * 1024;

        private readonly ApplicationDbContext _context;
        private readonly AsaasSettings _settings;
        private readonly ILogger<AsaasWebhookController> _logger;

        public AsaasWebhookController(
            ApplicationDbContext context,
            IOptions<AsaasSettings> settings,
            ILogger<AsaasWebhookController> logger)
        {
            _context = context;
            _settings = settings.Value;
            _logger = logger;
        }

        [HttpPost]
        [RequestSizeLimit(MaxBodyBytes)]
        public async Task<IActionResult> ReceiveAsync(CancellationToken cancellationToken)
        {
            if (!IsAuthentic(Request.Headers["asaas-access-token"].ToString()))
            {
                _logger.LogWarning("Asaas webhook rejected: missing or wrong access token.");
                return Unauthorized();
            }

            using var reader = new StreamReader(Request.Body, Encoding.UTF8);
            var body = await reader.ReadToEndAsync(cancellationToken);

            string? eventId = null;
            string? eventType = null;
            try
            {
                using var document = JsonDocument.Parse(body);
                var root = document.RootElement;
                if (root.TryGetProperty("id", out var id) && id.ValueKind == JsonValueKind.String)
                    eventId = id.GetString();
                if (root.TryGetProperty("event", out var type) && type.ValueKind == JsonValueKind.String)
                    eventType = type.GetString();
            }
            catch (JsonException)
            {
                _logger.LogWarning("Asaas webhook with an unreadable body was acknowledged and dropped.");
                return Ok();
            }

            if (string.IsNullOrEmpty(eventId) || string.IsNullOrEmpty(eventType))
            {
                _logger.LogWarning("Asaas webhook without id or event was acknowledged and dropped.");
                return Ok();
            }

            if (await _context.AsaasWebhookEvents.AnyAsync(e => e.EventId == eventId, cancellationToken))
                return Ok();

            _context.AsaasWebhookEvents.Add(new AsaasWebhookEvent
            {
                EventId = Truncate(eventId, 150),
                EventType = Truncate(eventType, 80),
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
            if (string.IsNullOrEmpty(_settings.WebhookToken))
            {
                _logger.LogError("AsaasSettings:WebhookToken is not configured — every webhook is refused.");
                return false;
            }

            // Constant time, so the token cannot be guessed byte by byte from response timings.
            var expected = Encoding.UTF8.GetBytes(_settings.WebhookToken);
            var actual = Encoding.UTF8.GetBytes(received);
            return CryptographicOperations.FixedTimeEquals(expected, actual);
        }

        private static bool IsUniqueViolation(DbUpdateException exception) =>
            exception.InnerException is Npgsql.PostgresException { SqlState: Npgsql.PostgresErrorCodes.UniqueViolation };

        private static string Truncate(string value, int max) => value.Length <= max ? value : value[..max];
    }
}
