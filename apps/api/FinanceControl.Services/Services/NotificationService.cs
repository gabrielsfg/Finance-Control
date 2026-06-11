using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Services
{
    public class NotificationService : INotificationService
    {
        // Most recent notifications surfaced in the bell. Older ones stay in the
        // table for history but are not loaded into the dropdown.
        private const int MaxListSize = 50;

        private readonly ApplicationDbContext _context;

        public NotificationService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<GetNotificationResponseDto>> GetAllAsync(int userId)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(MaxListSize)
                .Select(ToDto)
                .ToListAsync();
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }

        public async Task<IEnumerable<GetNotificationResponseDto>> MarkAsReadAsync(int id, int userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            // Idempotent: a missing or already-read item is a no-op that still
            // returns the current list, so the client can refresh its cache.
            if (notification is not null && !notification.IsRead)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return await GetAllAsync(userId);
        }

        public async Task<IEnumerable<GetNotificationResponseDto>> MarkAllAsReadAsync(int userId)
        {
            var unread = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            if (unread.Count > 0)
            {
                var now = DateTime.UtcNow;
                foreach (var n in unread)
                {
                    n.IsRead = true;
                    n.ReadAt = now;
                }
                await _context.SaveChangesAsync();
            }

            return await GetAllAsync(userId);
        }

        public async Task CreateAsync(
            int userId,
            EnumNotificationType type,
            string title,
            string body,
            string? actionUrl = null,
            string? dedupeKey = null)
        {
            if (dedupeKey is not null)
            {
                var alreadyExists = await _context.Notifications
                    .AnyAsync(n => n.UserId == userId && n.DedupeKey == dedupeKey);
                if (alreadyExists)
                    return;
            }

            _context.Notifications.Add(new Notification
            {
                UserId = userId,
                Type = type,
                Title = title,
                Body = body,
                ActionUrl = actionUrl,
                DedupeKey = dedupeKey,
                IsRead = false,
            });

            await _context.SaveChangesAsync();
        }

        public async Task<GetNotificationPreferenceResponseDto> GetPreferencesAsync(int userId)
        {
            var pref = await GetOrCreatePreferenceAsync(userId);
            return ToPreferenceDto(pref);
        }

        public async Task<GetNotificationPreferenceResponseDto> UpdatePreferencesAsync(
            UpdateNotificationPreferenceRequestDto requestDto, int userId)
        {
            var pref = await GetOrCreatePreferenceAsync(userId);

            pref.RecurrenceChargedEnabled = requestDto.RecurrenceChargedEnabled;
            pref.CardDueEnabled = requestDto.CardDueEnabled;
            pref.CardDueDaysAhead = requestDto.CardDueDaysAhead;
            pref.CardClosingEnabled = requestDto.CardClosingEnabled;
            pref.CardClosingDaysAhead = requestDto.CardClosingDaysAhead;
            pref.BudgetAlertEnabled = requestDto.BudgetAlertEnabled;
            pref.BudgetWarningPercent = requestDto.BudgetWarningPercent;

            await _context.SaveChangesAsync();
            return ToPreferenceDto(pref);
        }

        private async Task<NotificationPreference> GetOrCreatePreferenceAsync(int userId)
        {
            var pref = await _context.NotificationPreferences
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (pref is null)
            {
                pref = new NotificationPreference { UserId = userId };
                _context.NotificationPreferences.Add(pref);
                await _context.SaveChangesAsync();
            }

            return pref;
        }

        private static GetNotificationPreferenceResponseDto ToPreferenceDto(NotificationPreference p) =>
            new()
            {
                RecurrenceChargedEnabled = p.RecurrenceChargedEnabled,
                CardDueEnabled = p.CardDueEnabled,
                CardDueDaysAhead = p.CardDueDaysAhead,
                CardClosingEnabled = p.CardClosingEnabled,
                CardClosingDaysAhead = p.CardClosingDaysAhead,
                BudgetAlertEnabled = p.BudgetAlertEnabled,
                BudgetWarningPercent = p.BudgetWarningPercent,
            };

        private static readonly System.Linq.Expressions.Expression<Func<Notification, GetNotificationResponseDto>> ToDto =
            n => new GetNotificationResponseDto
            {
                Id = n.Id,
                Type = n.Type,
                Title = n.Title,
                Body = n.Body,
                ActionUrl = n.ActionUrl,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
            };
    }
}
