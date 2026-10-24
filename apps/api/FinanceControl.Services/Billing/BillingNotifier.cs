using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Service;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Billing
{
    /// <summary>Sends each billing email at most once, keyed by what it is about.</summary>
    /// <remarks>
    /// The key is recorded whether or not the provider accepted the message. The hourly
    /// job would otherwise resend on every run while email is unconfigured or down, and a
    /// burst of identical reminders is worse than one that did not arrive — the state of
    /// the subscription is always visible in the app.
    /// </remarks>
    public class BillingNotifier
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly BillingSettings _settings;
        private readonly ILogger<BillingNotifier> _logger;

        public BillingNotifier(
            ApplicationDbContext context,
            IEmailService emailService,
            IOptions<BillingSettings> settings,
            ILogger<BillingNotifier> logger)
        {
            _context = context;
            _emailService = emailService;
            _settings = settings.Value;
            _logger = logger;
        }

        public string ManageUrl => $"{_settings.WebBaseUrl.TrimEnd('/')}/subscription";
        public string PlansUrl => $"{_settings.WebBaseUrl.TrimEnd('/')}/plans";

        public async Task SendOnceAsync(
            int userId,
            string key,
            Func<User, (string Subject, string Html)> build,
            CancellationToken cancellationToken = default)
        {
            if (await _context.BillingEmailLogs.AnyAsync(l => l.Key == key, cancellationToken))
                return;

            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user is null)
                return;

            var (subject, html) = build(user);
            var sent = await _emailService.SendAsync(user.Email, subject, html, cancellationToken);
            if (!sent)
                _logger.LogWarning("Billing email {Key} to user {UserId} was not accepted by the provider.", key, userId);

            var log = new BillingEmailLog { UserId = userId, Key = key };
            _context.BillingEmailLogs.Add(log);
            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                // Another run recorded the same key in the meantime. Detach only this row —
                // the context is shared with the caller, whose entities must stay tracked.
                _context.Entry(log).State = EntityState.Detached;
            }
        }
    }
}
