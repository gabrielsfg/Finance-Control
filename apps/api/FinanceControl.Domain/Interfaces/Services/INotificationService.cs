using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface INotificationService
    {
        Task<IEnumerable<GetNotificationResponseDto>> GetAllAsync(int userId);
        Task<int> GetUnreadCountAsync(int userId);

        // Lazily creates a defaults row on first read.
        Task<GetNotificationPreferenceResponseDto> GetPreferencesAsync(int userId);
        Task<GetNotificationPreferenceResponseDto> UpdatePreferencesAsync(
            UpdateNotificationPreferenceRequestDto requestDto, int userId);

        // Mutations return the full updated list (project convention).
        Task<IEnumerable<GetNotificationResponseDto>> MarkAsReadAsync(int id, int userId);
        Task<IEnumerable<GetNotificationResponseDto>> MarkAllAsReadAsync(int userId);

        // Used by jobs and event hooks to raise a notification. When dedupeKey is
        // provided, a second notification with the same (userId, dedupeKey) is skipped.
        Task CreateAsync(
            int userId,
            EnumNotificationType type,
            string title,
            string body,
            string? actionUrl = null,
            string? dedupeKey = null);
    }
}
