using System.Globalization;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Services.Services
{
    public class RecurringTransactionJobService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<RecurringTransactionJobService> _logger;

        public RecurringTransactionJobService(
            IServiceScopeFactory scopeFactory,
            ILogger<RecurringTransactionJobService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public async Task RunAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("RecurringTransactionJob started at {Time} UTC", DateTime.UtcNow);

            await using var scope = _scopeFactory.CreateAsyncScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            // Users who turned the "recurrence charged" notification off. Missing = enabled.
            var chargedDisabledUsers = await context.NotificationPreferences
                .Where(p => !p.RecurrenceChargedEnabled)
                .Select(p => p.UserId)
                .ToListAsync(cancellationToken);
            var chargedDisabledSet = new HashSet<int>(chargedDisabledUsers);

            var activeRecurrences = await context.RecurringTransactions
                .Where(rt => rt.IsActive && (rt.EndDate == null || rt.EndDate >= today))
                .ToListAsync(cancellationToken);

            int totalGenerated = 0;
            var errors = new List<string>();

            foreach (var rt in activeRecurrences)
            {
                try
                {
                    var generated = await ProcessRecurrenceAsync(
                        context, notificationService, chargedDisabledSet, rt, today, cancellationToken);
                    totalGenerated += generated;
                }
                catch (Exception ex)
                {
                    errors.Add($"RecurringTransaction {rt.Id}: {ex.Message}");
                    _logger.LogError(ex, "Error processing RecurringTransaction {Id}", rt.Id);
                }
            }

            _logger.LogInformation(
                "RecurringTransactionJob finished. Processed {Count} recurrences, generated {Total} transactions. Errors: {ErrorCount}",
                activeRecurrences.Count, totalGenerated, errors.Count);

            if (errors.Count > 0)
                _logger.LogWarning("Errors during job run: {Errors}", string.Join("; ", errors));
        }

        private async Task<int> ProcessRecurrenceAsync(
            ApplicationDbContext context,
            INotificationService notificationService,
            HashSet<int> chargedDisabledUsers,
            RecurringTransaction rt,
            DateOnly today,
            CancellationToken cancellationToken)
        {
            // Determine the last date already covered by an existing transaction instance
            var lastDate = await context.Transactions
                .Where(t => t.RecurringTransactionId == rt.Id)
                .MaxAsync(t => (DateOnly?)t.TransactionDate, cancellationToken);

            // Catch-up: start from the day after the last generated instance,
            // or from StartDate if no instance exists yet.
            var startFrom = lastDate.HasValue
                ? NextOccurrenceAfter(rt.Recurrence, lastDate.Value)
                : rt.StartDate;

            if (startFrom > today)
                return 0;

            // Build the list of dates to generate
            var datesToGenerate = new List<DateOnly>();
            var current = startFrom;
            while (current <= today)
            {
                datesToGenerate.Add(current);
                current = NextOccurrenceAfter(rt.Recurrence, current);
            }

            if (datesToGenerate.Count == 0)
                return 0;

            // Idempotency: fetch already-existing dates in one query
            var existingDates = await context.Transactions
                .Where(t => t.RecurringTransactionId == rt.Id && datesToGenerate.Contains(t.TransactionDate))
                .Select(t => t.TransactionDate)
                .ToListAsync(cancellationToken);

            var existingSet = new HashSet<DateOnly>(existingDates);
            var newTransactions = new List<Transaction>();

            foreach (var date in datesToGenerate)
            {
                if (existingSet.Contains(date))
                    continue;

                newTransactions.Add(new Transaction
                {
                    UserId = rt.UserId,
                    BudgetId = rt.BudgetId,
                    SubCategoryId = rt.SubCategoryId,
                    AccountId = rt.AccountId,
                    RecurringTransactionId = rt.Id,
                    Value = rt.Value,
                    Type = rt.Type,
                    Description = rt.Description,
                    TransactionDate = date,
                    PaymentType = EnumPaymentType.Recurring,
                });
            }

            if (newTransactions.Count > 0)
            {
                context.Transactions.AddRange(newTransactions);
                await context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "RecurringTransaction {Id} (User {UserId}): generated {Count} instance(s) for dates [{Dates}]",
                    rt.Id, rt.UserId, newTransactions.Count,
                    string.Join(", ", newTransactions.Select(t => t.TransactionDate)));

                // Notify the user only for the instance charged today — catch-up
                // instances for past dates do not raise a notification (avoids a
                // flood on the first run after downtime).
                if (!chargedDisabledUsers.Contains(rt.UserId) && newTransactions.Any(t => t.TransactionDate == today))
                {
                    await notificationService.CreateAsync(
                        rt.UserId,
                        EnumNotificationType.RecurrenceCharged,
                        "Cobrança recorrente",
                        $"{rt.Description} • {FormatBrl(rt.Value)}",
                        "/transactions",
                        $"rec-charged-{rt.Id}-{today:yyyy-MM-dd}");
                }
            }

            return newTransactions.Count;
        }

        private static DateOnly NextOccurrenceAfter(EnumRecurrenceType recurrence, DateOnly from)
        {
            return recurrence switch
            {
                EnumRecurrenceType.Daily => from.AddDays(1),
                EnumRecurrenceType.WorkDay => NextWorkDay(from),
                EnumRecurrenceType.Weekly => from.AddDays(7),
                EnumRecurrenceType.Biweekly => from.AddDays(14),
                EnumRecurrenceType.Monthly => from.AddMonths(1),
                EnumRecurrenceType.Quarterly => from.AddMonths(3),
                EnumRecurrenceType.Semiannually => from.AddMonths(6),
                EnumRecurrenceType.Annually => from.AddYears(1),
                _ => from.AddDays(1),
            };
        }

        private static DateOnly NextWorkDay(DateOnly from)
        {
            var next = from.AddDays(1);
            while (next.DayOfWeek == DayOfWeek.Saturday || next.DayOfWeek == DayOfWeek.Sunday)
                next = next.AddDays(1);
            return next;
        }

        private static readonly CultureInfo BrlCulture = CultureInfo.GetCultureInfo("pt-BR");

        // Cents (int) → "R$ 44,90".
        private static string FormatBrl(int cents) => (cents / 100m).ToString("C", BrlCulture);
    }
}
