using System.Net.Http.Json;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Services.Email;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Services
{
    /// <summary>
    /// Sends transactional email through Resend's REST API.
    /// </summary>
    /// <remarks>
    /// A typed <see cref="HttpClient"/> against two fields and one POST, rather than an
    /// SDK: Resend publishes no official .NET client, and a community one would be a
    /// dependency to track for no gain here.
    ///
    /// With no API key configured the email is written to the log instead of being sent,
    /// so a fresh clone can run the whole signup flow without a Resend account. The code
    /// appears in the log in that mode — it only ever happens when the key is missing,
    /// which in a deployed environment is a misconfiguration worth screaming about.
    /// </remarks>
    public class EmailService : IEmailService
    {
        private readonly HttpClient _httpClient;
        private readonly EmailSettings _settings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(
            HttpClient httpClient,
            IOptions<EmailSettings> settings,
            ILogger<EmailService> logger)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
            _logger = logger;
        }

        /// <summary>
        /// One extra attempt on a transport failure. A stalled TLS handshake or a dropped
        /// connection kills the first request but almost never the second, since the retry
        /// opens a fresh one — and the cost of not retrying is a user parked on a code
        /// screen waiting for an email that will never arrive.
        /// </summary>
        private const int MaxAttempts = 2;

        public async Task<bool> SendAsync(
            string toEmail,
            string subject,
            string htmlBody,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_settings.ApiKey))
            {
                _logger.LogWarning(
                    "EmailSettings:ApiKey is not configured — email to {Recipient} was not sent. Subject: {Subject}\n{Body}",
                    toEmail, subject, htmlBody);
                return false;
            }

            var payload = new
            {
                from = string.IsNullOrWhiteSpace(_settings.FromName)
                    ? _settings.FromEmail
                    : $"{_settings.FromName} <{_settings.FromEmail}>",
                to = new[] { toEmail },
                subject,
                html = htmlBody
            };

            for (var attempt = 1; attempt <= MaxAttempts; attempt++)
            {
                try
                {
                    var response = await _httpClient.PostAsJsonAsync("emails", payload, cancellationToken);

                    if (response.IsSuccessStatusCode)
                        return true;

                    // Resend answers 422 for a malformed payload or an unverified sender
                    // domain, and 429 past the rate limit. The body names which one.
                    var error = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogError(
                        "Resend rejected the email to {Recipient} with {StatusCode}: {Error}",
                        toEmail, (int)response.StatusCode, error);

                    // A rejection is a verdict, not a hiccup — retrying an unverified
                    // sender or a malformed payload just fails again, slower.
                    return false;
                }
                catch (Exception exception) when (attempt < MaxAttempts)
                {
                    _logger.LogWarning(
                        exception,
                        "Attempt {Attempt} to email {Recipient} failed on transport; retrying.",
                        attempt, toEmail);
                }
                catch (Exception exception)
                {
                    // Never let a delivery failure take down the request that triggered it.
                    // The caller decides what the user sees — for flows that can be probed
                    // for valid addresses, that answer is the same either way.
                    _logger.LogError(exception, "Failed to send email to {Recipient}.", toEmail);
                    return false;
                }
            }

            return false;
        }
    }
}
