using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Services.Services
{
    // Daily scan that raises time-based notifications: credit-card due/closing
    // reminders and budget-threshold alerts. Idempotent via per-period dedupe keys,
    // so re-running the same day never duplicates a notification.
    public class NotificationReminderJobService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<NotificationReminderJobService> _logger;

        public NotificationReminderJobService(
            IServiceScopeFactory scopeFactory,
            ILogger<NotificationReminderJobService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public async Task RunAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("NotificationReminderJob started at {Time} UTC", DateTime.UtcNow);

            await using var scope = _scopeFactory.CreateAsyncScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
            var budgetService = scope.ServiceProvider.GetRequiredService<IBudgetService>();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var prefs = await context.NotificationPreferences
                .ToDictionaryAsync(p => p.UserId, cancellationToken);

            await ProcessCardRemindersAsync(context, notificationService, prefs, today, cancellationToken);
            await ProcessBudgetAlertsAsync(context, budgetService, notificationService, prefs, today, cancellationToken);

            _logger.LogInformation("NotificationReminderJob finished at {Time} UTC", DateTime.UtcNow);
        }

        private async Task ProcessCardRemindersAsync(
            ApplicationDbContext context,
            INotificationService notificationService,
            IReadOnlyDictionary<int, NotificationPreference> prefs,
            DateOnly today,
            CancellationToken cancellationToken)
        {
            var creditAccounts = await context.Accounts
                .Where(a => a.Type == EnumAccountType.Credit && !a.IsSystem)
                .ToListAsync(cancellationToken);

            foreach (var account in creditAccounts)
            {
                prefs.TryGetValue(account.UserId, out var pref);

                if ((pref?.CardDueEnabled ?? true) && account.BillingDueDay.HasValue)
                {
                    var dueDate = NextDayOfMonth(today, account.BillingDueDay.Value);
                    var daysUntil = dueDate.DayNumber - today.DayNumber;
                    if (daysUntil == (pref?.CardDueDaysAhead ?? 3))
                    {
                        await notificationService.CreateAsync(
                            account.UserId,
                            EnumNotificationType.CardDueSoon,
                            "Fatura a vencer",
                            $"{account.Name} {DueText(daysUntil)} ({dueDate:dd/MM}).",
                            "/accounts",
                            $"card-due-{account.Id}-{dueDate:yyyy-MM-dd}");
                    }
                }

                if ((pref?.CardClosingEnabled ?? true) && account.BillingClosingDay.HasValue)
                {
                    var closeDate = NextDayOfMonth(today, account.BillingClosingDay.Value);
                    var daysUntil = closeDate.DayNumber - today.DayNumber;
                    if (daysUntil == (pref?.CardClosingDaysAhead ?? 3))
                    {
                        await notificationService.CreateAsync(
                            account.UserId,
                            EnumNotificationType.CardClosingSoon,
                            "Fatura a fechar",
                            $"{account.Name} {ClosingText(daysUntil)} ({closeDate:dd/MM}).",
                            "/accounts",
                            $"card-closing-{account.Id}-{closeDate:yyyy-MM-dd}");
                    }
                }
            }
        }

        private async Task ProcessBudgetAlertsAsync(
            ApplicationDbContext context,
            IBudgetService budgetService,
            INotificationService notificationService,
            IReadOnlyDictionary<int, NotificationPreference> prefs,
            DateOnly today,
            CancellationToken cancellationToken)
        {
            var userIds = await context.Budgets
                .Where(b => b.IsActive)
                .Select(b => b.UserId)
                .Distinct()
                .ToListAsync(cancellationToken);

            foreach (var userId in userIds)
            {
                prefs.TryGetValue(userId, out var pref);
                if (!(pref?.BudgetAlertEnabled ?? true))
                    continue;

                var budgets = await budgetService.GetAllBudgetAsync(userId);
                var active = budgets.FirstOrDefault(b => b.IsActive);
                if (active is null || active.TotalAllocated <= 0)
                    continue;

                var pct = active.SpentPercentage;
                var periodKey = active.StartDate.ToString("yyyy-MM-dd");
                var warningPercent = pref?.BudgetWarningPercent ?? 80;

                if (pct >= 100)
                {
                    await notificationService.CreateAsync(
                        userId,
                        EnumNotificationType.BudgetExceeded,
                        "Orçamento estourado",
                        $"Você ultrapassou o orçamento \"{active.Name}\" ({pct:0}%).",
                        "/budgets",
                        $"budget-exceeded-{active.Id}-{periodKey}");
                }
                else if (pct >= warningPercent)
                {
                    await notificationService.CreateAsync(
                        userId,
                        EnumNotificationType.BudgetThreshold,
                        "Atenção ao orçamento",
                        $"Você já usou {pct:0}% do orçamento \"{active.Name}\".",
                        "/budgets",
                        $"budget-threshold-{active.Id}-{periodKey}");
                }
            }
        }

        // Next date on or after today whose day-of-month equals `day`, clamped to month length.
        private static DateOnly NextDayOfMonth(DateOnly today, int day)
        {
            var daysInMonth = DateTime.DaysInMonth(today.Year, today.Month);
            var candidate = new DateOnly(today.Year, today.Month, Math.Min(day, daysInMonth));
            if (candidate >= today)
                return candidate;

            var next = today.AddMonths(1);
            var daysInNext = DateTime.DaysInMonth(next.Year, next.Month);
            return new DateOnly(next.Year, next.Month, Math.Min(day, daysInNext));
        }

        private static string DueText(int days) =>
            days == 0 ? "vence hoje" : days == 1 ? "vence amanhã" : $"vence em {days} dias";

        private static string ClosingText(int days) =>
            days == 0 ? "fecha hoje" : days == 1 ? "fecha amanhã" : $"fecha em {days} dias";
    }
}
